"""Row-level-security test harness.

Builds a throwaway PostgreSQL database from the real SQL files in shared-app/
(on top of tests/db/bootstrap.sql, which stands in for Supabase's auth schema),
then lets each test act as any member through the same JWT-claims mechanism
Supabase uses. Every test runs inside a transaction that is rolled back.

Set TEST_DATABASE_URL to a superuser connection string (CI uses a Postgres
service container). Without it the database tests are skipped locally.
"""
import json
import os
import re
import uuid
from contextlib import contextmanager
from pathlib import Path

import psycopg
import pytest

ROOT = Path(__file__).resolve().parents[2]
SHARED = ROOT / "shared-app"

# Order the files are run in a fresh Supabase project (see shared-app/README.md).
# New migrations are appended here as they are added.
MIGRATIONS = [
    "schema.sql",
    "matrix-roles-update.sql",
    "task-assignment-workflow.sql",
    "profile-update.sql",
    "access-and-visibility-update.sql",
    "lock-rls-auto-enable.sql",
    "pending-members-plan.sql",
    "executive-permissions-alignment.sql",
    "task-subtasks-system.sql",
]
MIGRATIONS += [p.name for p in sorted((SHARED / "migrations").glob("*.sql"))] if (SHARED / "migrations").exists() else []


def _dsn_for(base: str, dbname: str) -> str:
    return re.sub(r"/[^/?]*(\?|$)", f"/{dbname}\\1", base, count=1)


@pytest.fixture(scope="session")
def database():
    base = os.environ.get("TEST_DATABASE_URL")
    if not base:
        if os.environ.get("CI"):
            pytest.fail("TEST_DATABASE_URL must be set in CI")
        pytest.skip("TEST_DATABASE_URL not set; skipping database tests")
    name = f"vines_test_{uuid.uuid4().hex[:8]}"
    admin = psycopg.connect(base, autocommit=True)
    admin.execute(f'create database "{name}" template template0 encoding \'UTF8\'')
    dsn = _dsn_for(base, name)
    conn = psycopg.connect(dsn, autocommit=True)
    conn.execute((Path(__file__).with_name("bootstrap.sql")).read_text())
    for filename in MIGRATIONS:
        sql = (SHARED / "migrations" / filename if (SHARED / "migrations" / filename).exists() else SHARED / filename).read_text()
        # pg_cron is a Supabase extension; bootstrap.sql provides a stand-in cron schema.
        sql = sql.replace("create extension if not exists pg_cron;", "")
        try:
            conn.execute(sql)
        except Exception as exc:  # surface which file broke
            raise RuntimeError(f"migration {filename} failed: {exc}") from exc
    conn.close()
    yield dsn
    admin.execute(f'drop database "{name}" with (force)')
    admin.close()


class World:
    """Seeds rows as the database owner and switches identity with act_as()."""

    def __init__(self, conn):
        self.conn = conn
        self.members = {}

    # -- identity -------------------------------------------------------
    @contextmanager
    def act_as(self, who):
        """Run queries as an authenticated member (or None for anon)."""
        member = self.members[who] if isinstance(who, str) else who
        claims = {"role": "authenticated", "email": member["email"], "sub": str(uuid.uuid5(uuid.NAMESPACE_DNS, member["email"]))}
        self.conn.execute("select set_config('request.jwt.claims', %s, true)", (json.dumps(claims),))
        self.conn.execute("set local role authenticated")
        try:
            yield self.conn
        finally:
            self.conn.execute("reset role")
            self.conn.execute("select set_config('request.jwt.claims', '', true)")

    def try_sql(self, who, sql, params=None):
        """Run a statement as `who` inside a savepoint; return (ok, rows_or_error)."""
        with self.act_as(who) as conn:
            conn.execute("savepoint attempt")
            try:
                cur = conn.execute(sql, params)
                rows = cur.fetchall() if cur.description else []
                # Row-level security hides rows silently, so an UPDATE/DELETE that touched nothing
                # was refused as far as these tests are concerned.
                if sql.lstrip().lower().startswith(("update", "delete")) and cur.rowcount == 0:
                    conn.execute("rollback to savepoint attempt")
                    return False, "no rows affected (blocked by row-level security)"
                conn.execute("release savepoint attempt")
                return True, rows
            except psycopg.Error as exc:
                conn.execute("rollback to savepoint attempt")
                return False, str(exc).splitlines()[0]

    def rows(self, who, sql, params=None):
        ok, result = self.try_sql(who, sql, params)
        assert ok, result
        return result

    # -- seeding (as owner, bypasses RLS) ---------------------------------
    def q1(self, sql, params=None):
        return self.conn.execute(sql, params).fetchone()[0]

    def force(self, sql, params=None):
        """Run a statement as the owner with triggers off (seeding states the app can't create directly)."""
        self.conn.execute("set local session_replication_role = replica")
        try:
            return self.conn.execute(sql, params)
        finally:
            self.conn.execute("set local session_replication_role = origin")

    def member(self, key, *, admin=False, status="Active"):
        email = f"{key}@vines.test"
        mid = self.q1(
            "insert into public.members(name, email, is_club_admin, status) values (%s,%s,%s,%s) returning id",
            (key.title(), email, admin, status),
        )
        self.members[key] = {"id": mid, "email": email, "key": key}
        return self.members[key]

    def dept(self, name):
        return self.q1("insert into public.departments(name) values (%s) returning id", (name,))

    def project(self, name):
        return self.q1("insert into public.projects(name) values (%s) returning id", (name,))

    def position(self, who, position, *, dept=None, project=None):
        self.conn.execute(
            "insert into public.member_positions(member_id, position_id, department_id, project_id) "
            "select %s, p.id, %s, %s from public.positions p where p.name = %s",
            (self.members[who]["id"], dept, project, position),
        )

    def in_dept(self, who, dept):
        self.conn.execute("insert into public.member_departments(member_id, department_id) values (%s,%s)", (self.members[who]["id"], dept))

    def in_project(self, who, project, by="admin"):
        self.conn.execute(
            "insert into public.project_assignments(member_id, project_id, allocated_by) values (%s,%s,%s)",
            (self.members[who]["id"], project, self.members[by]["id"]),
        )

    def task(self, title, *, task_type="Project task", projects=(), departments=(), by="admin", assignee=None):
        """Insert a task as the owner. Assignment is applied afterwards because the
        workflow trigger starts every task unassigned."""
        tid = self.q1(
            "insert into public.tasks(title, task_type, project_id, department_id, assigned_by) values (%s,%s,%s,%s,%s) returning id",
            (
                title,
                task_type,
                projects[0] if task_type == "Project task" else None,
                departments[0] if task_type == "Department task" else None,
                self.members[by]["id"],
            ),
        )
        for p in projects:
            self.conn.execute("insert into public.task_projects(task_id, project_id) values (%s,%s)", (tid, p))
        for d in departments:
            self.conn.execute("insert into public.task_departments(task_id, department_id) values (%s,%s)", (tid, d))
        if assignee:
            self.force("update public.tasks set assignee_id=%s, status='Not Started' where id=%s", (self.members[assignee]["id"], tid))
        return tid


@pytest.fixture()
def world(database):
    conn = psycopg.connect(database, autocommit=False)
    w = World(conn)
    yield w
    conn.rollback()
    conn.close()


@pytest.fixture()
def club(world):
    """A small club: owner/admin, President, VP, one department and one project with
    heads and members, plus a second (unrelated) department and project."""
    w = world
    w.member("admin", admin=True)
    w.conn.execute("update public.members set is_club_owner = true where id = %s", (w.members["admin"]["id"],)) if w.q1(
        "select count(*) from information_schema.columns where table_name='members' and column_name='is_club_owner'"
    ) else None
    for key in ["president", "vp", "filmhead", "videohead", "edithead", "designer", "editor", "outsider", "otherhead"]:
        w.member(key)
    w.dept_video = w.dept("Test Videography")
    w.dept_edit = w.dept("Test Editing")
    w.dept_other = w.dept("Test Marketing")
    w.proj_film = w.project("Test Film Project")
    w.proj_other = w.project("Test Other Project")
    w.position("president", "President")
    w.position("vp", "Vice President")
    w.position("filmhead", "Project Head", project=w.proj_film)
    w.position("videohead", "Department Head", dept=w.dept_video)
    w.position("edithead", "Department Head", dept=w.dept_edit)
    w.position("otherhead", "Project Head", project=w.proj_other)
    w.in_project("filmhead", w.proj_film)
    w.in_project("designer", w.proj_film)
    w.in_project("editor", w.proj_film)
    w.in_dept("editor", w.dept_edit)
    w.in_dept("designer", w.dept_other)
    w.in_dept("videohead", w.dept_video)
    w.in_dept("edithead", w.dept_edit)
    return w
