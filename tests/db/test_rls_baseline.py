"""Behaviour of the existing permission model, pinned so later migrations can't change it silently."""


def test_admin_flag_reads_as_admin(club):
    ok, rows = club.try_sql("admin", "select app_private.is_admin()")
    assert ok and rows[0][0] is True


def test_executives_are_not_system_admins(club):
    for who in ("president", "vp"):
        assert club.rows(who, "select app_private.is_admin()")[0][0] is False
        assert club.rows(who, "select app_private.is_executive()")[0][0] is True


def test_regular_member_is_neither(club):
    assert club.rows("designer", "select app_private.is_admin(), app_private.is_executive()")[0] == (False, False)


def test_members_cannot_become_admin_by_direct_update(club):
    ok, _ = club.try_sql("designer", "update public.members set is_club_admin = true where email = 'designer@vines.test'")
    assert not ok or club.q1("select is_club_admin from public.members where email='designer@vines.test'") is False


def test_only_admin_creates_departments(club):
    ok, _ = club.try_sql("president", "insert into public.departments(name) values ('Sneaky')")
    assert not ok
    ok, _ = club.try_sql("admin", "insert into public.departments(name) values ('Legit')")
    assert ok


def test_only_admin_creates_projects(club):
    assert not club.try_sql("president", "insert into public.projects(name) values ('Sneaky')")[0]
    assert club.try_sql("admin", "insert into public.projects(name) values ('Legit')")[0]


def test_all_active_members_visible_to_everyone(club):
    visible = {r[0] for r in club.rows("designer", "select email::text from public.members")}
    assert "admin@vines.test" in visible and "outsider@vines.test" in visible


def test_pending_members_are_hidden_from_non_admins(club):
    club.member("ghost", status="Pending invitation")
    seen = {r[0] for r in club.rows("designer", "select email::text from public.members")}
    assert "ghost@vines.test" not in seen
    seen_admin = {r[0] for r in club.rows("admin", "select email::text from public.members")}
    assert "ghost@vines.test" in seen_admin
