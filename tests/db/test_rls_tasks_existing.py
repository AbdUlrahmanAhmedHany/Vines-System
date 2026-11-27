"""Existing task permissions (before the subtask system) pinned as regression tests."""


def make_project_task(club, who, project):
    ok, res = club.try_sql(
        who,
        "insert into public.tasks(id, title, task_type, project_id, assigned_by) "
        "values (gen_random_uuid(), 'T', 'Project task', %s, app_private.current_member_id())",
        (project,),
    )
    return ok, res


def test_project_head_creates_tasks_in_own_project_only(club):
    assert make_project_task(club, "filmhead", club.proj_film)[0]
    assert not make_project_task(club, "filmhead", club.proj_other)[0]


def test_regular_member_cannot_create_tasks(club):
    assert not make_project_task(club, "designer", club.proj_film)[0]


def test_executives_create_club_wide_tasks(club):
    for who in ("president", "vp", "admin"):
        ok, _ = club.try_sql(
            who,
            "insert into public.tasks(title, task_type, assigned_by) values ('Club', 'Club-wide', app_private.current_member_id())",
        )
        assert ok, who


def test_department_head_creates_department_tasks_in_own_department_only(club):
    sql = (
        "insert into public.tasks(title, task_type, department_id, assigned_by) "
        "values ('D', 'Department task', %s, app_private.current_member_id())"
    )
    assert club.try_sql("videohead", sql, (club.dept_video,))[0]
    assert not club.try_sql("videohead", sql, (club.dept_edit,))[0]


def test_tasks_are_created_unassigned(club):
    ok, _ = club.try_sql(
        "president",
        "insert into public.tasks(title, task_type, assigned_by, assignee_id) "
        "values ('X','Club-wide', app_private.current_member_id(), app_private.current_member_id())",
    )
    assert not ok


def test_project_head_assigns_only_inside_own_project(club):
    tid = club.task("Film task", projects=[club.proj_film])
    assert club.try_sql("filmhead", "update public.tasks set assignee_id=%s where id=%s", (club.members["designer"]["id"], tid))[0]
    ok, err = club.try_sql("filmhead", "update public.tasks set assignee_id=%s where id=%s", (club.members["outsider"]["id"], tid))
    assert not ok and "active member" in err.lower()


def test_head_of_another_project_cannot_assign(club):
    tid = club.task("Film task", projects=[club.proj_film])
    ok, _ = club.try_sql("otherhead", "update public.tasks set assignee_id=%s where id=%s", (club.members["designer"]["id"], tid))
    assert not ok or club.q1("select assignee_id from public.tasks where id=%s", (tid,)) is None


def test_executives_assign_across_scopes(club):
    tid = club.task("Film task", projects=[club.proj_film])
    for who in ("president", "vp", "admin"):
        club.force("update public.tasks set assignee_id=null, status='Unassigned' where id=%s", (tid,))
        ok, _ = club.try_sql(who, "update public.tasks set assignee_id=%s where id=%s", (club.members["editor"]["id"], tid))
        assert ok, who


def test_only_authorised_people_can_complete_a_task(club):
    tid = club.task("Film task", projects=[club.proj_film], assignee="designer")
    # A member who is neither the responsible person nor a head cannot complete it.
    ok, err = club.try_sql("editor", "update public.tasks set status='Completed' where id=%s", (tid,))
    assert not ok
    # The linked project head and the responsible assignee (section 10 of the spec) can.
    assert club.try_sql("filmhead", "update public.tasks set status='Completed' where id=%s", (tid,))[0]


def test_assignee_can_report_progress(club):
    tid = club.task("Film task", projects=[club.proj_film], assignee="designer")
    assert club.try_sql("designer", "update public.tasks set status='In Progress' where id=%s", (tid,))[0]


def test_task_visibility(club):
    tid = club.task("Film task", projects=[club.proj_film])
    seen = lambda who: bool(club.rows(who, "select 1 from public.tasks where id=%s", (tid,)))
    assert seen("designer") and seen("filmhead") and seen("president") and seen("admin")
    assert not seen("outsider") and not seen("otherhead")


def test_task_titles_are_immutable_for_clients(club):
    tid = club.task("Film task", projects=[club.proj_film])
    ok, _ = club.try_sql("filmhead", "update public.tasks set title='Hacked' where id=%s", (tid,))
    assert not ok


def test_only_executives_and_admin_delete_tasks(club):
    tid = club.task("Film task", projects=[club.proj_film])
    club.try_sql("filmhead", "delete from public.tasks where id=%s", (tid,))
    assert club.q1("select count(*) from public.tasks where id=%s", (tid,)) == 1
    club.try_sql("president", "delete from public.tasks where id=%s", (tid,))
    assert club.q1("select count(*) from public.tasks where id=%s", (tid,)) == 0
