"""Task division, subtasks, requests, progress and the database-side rules around them."""
import threading
import time
import uuid

import psycopg
import pytest


# -- helpers -----------------------------------------------------------------------------------
def new_main(w, who, projects=(), departments=(), task_type=None):
    """Create a main task through the same insert path the app uses (RLS applies)."""
    tid = uuid.uuid4()
    task_type = task_type or ("Project task" if projects else "Department task" if departments else "Club-wide")
    ok, err = w.try_sql(
        who,
        "insert into public.tasks(id, title, task_type, project_id, department_id, assigned_by) "
        "values (%s, 'Produce 8 Reels', %s, %s, %s, app_private.current_member_id())",
        (tid, task_type, projects[0] if projects and task_type == "Project task" else None,
         departments[0] if departments and task_type == "Department task" else None),
    )
    assert ok, err
    for p in projects:
        assert w.try_sql(who, "insert into public.task_projects(task_id, project_id) values (%s,%s)", (tid, p))[0]
    for d in departments:
        assert w.try_sql(who, "insert into public.task_departments(task_id, department_id) values (%s,%s)", (tid, d))[0]
    return tid


def assign(w, who, task, assignee):
    return w.try_sql(who, "update public.tasks set assignee_id=%s where id=%s", (w.members[assignee]["id"], task))


def divide(w, who, parent, assignee, *, projects=(), departments=(), title="Filming"):
    return w.try_sql(
        who,
        "select public.create_subtask(%s, %s, 'details', %s, null, 'High', %s::uuid[], %s::uuid[])",
        (parent, title, w.members[assignee]["id"], list(projects), list(departments)),
    )


def status_of(w, task):
    return w.q1("select status from public.tasks where id=%s", (task,))


@pytest.fixture()
def film(club):
    """'Produce 8 Reels' in the Film project, created by the President and assigned straight to the
    Film project head. cam/cam2 are in Film and Videography; guest belongs to nothing."""
    w = club
    for key in ("cam", "cam2", "guest"):
        w.member(key)
    for key in ("cam", "cam2"):
        w.in_dept(key, w.dept_video)
        w.in_project(key, w.proj_film)
    w.in_project("edithead", w.proj_film)
    w.main = new_main(w, "president", [w.proj_film])
    ok, err = assign(w, "president", w.main, "filmhead")
    assert ok, err
    return w


# -- hierarchy ---------------------------------------------------------------------------------
def test_executive_assignment_to_a_head_records_division_ownership(film):
    assert film.q1("select division_owner_id from public.tasks where id=%s", (film.main,)) == film.members["filmhead"]["id"]


def test_creator_is_recorded_and_stays(film):
    assert film.q1("select created_by from public.tasks where id=%s", (film.main,)) == film.members["president"]["id"]
    assign(film, "president", film.main, "designer")
    assert film.q1("select created_by from public.tasks where id=%s", (film.main,)) == film.members["president"]["id"]


def test_clients_cannot_insert_subtasks_directly(film):
    ok, _ = film.try_sql(
        "president",
        "insert into public.tasks(id, title, task_type, project_id, assigned_by, parent_task_id) "
        "values (gen_random_uuid(), 'x', 'Project task', %s, app_private.current_member_id(), %s)",
        (film.proj_film, film.main),
    )
    assert not ok


def test_a_subtask_cannot_have_children(film):
    ok, sub = divide(film, "filmhead", film.main, "cam", projects=[film.proj_film])
    assert ok, sub
    sub_id = sub[0][0]
    ok, err = divide(film, "filmhead", sub_id, "cam2", projects=[film.proj_film])
    assert not ok and ("cannot divide" in err.lower() or "further" in err.lower())
    ok, err = divide(film, "president", sub_id, "cam2", projects=[film.proj_film])
    assert not ok


def test_database_blocks_third_level_even_for_the_owner(film):
    sub = divide(film, "filmhead", film.main, "cam", projects=[film.proj_film])[1][0][0]
    other = film.task("Other main", projects=[film.proj_film])
    with pytest.raises(psycopg.Error):
        film.conn.execute("savepoint s")
        film.conn.execute("update public.tasks set parent_task_id=%s where id=%s", (sub, other))
    film.conn.execute("rollback to savepoint s")


def test_a_task_with_subtasks_cannot_become_a_subtask(film):
    divide(film, "filmhead", film.main, "cam", projects=[film.proj_film])
    other = film.task("Other main", projects=[film.proj_film])
    with pytest.raises(psycopg.Error):
        film.conn.execute("savepoint s")
        film.conn.execute("update public.tasks set parent_task_id=%s where id=%s", (other, film.main))
    film.conn.execute("rollback to savepoint s")


# -- division authority -------------------------------------------------------------------------
def test_head_divides_a_task_an_executive_assigned_directly_to_them(film):
    ok, err = divide(film, "filmhead", film.main, "cam", projects=[film.proj_film], departments=[film.dept_video])
    assert ok, err


def test_project_head_divides_a_main_task_they_created(club):
    w = club
    w.member("cam")
    w.in_project("cam", w.proj_film)
    main = new_main(w, "filmhead", [w.proj_film])
    ok, err = divide(w, "filmhead", main, "cam", projects=[w.proj_film])
    assert ok, err


def test_department_head_divides_a_main_task_they_created(club):
    w = club
    w.member("cam")
    w.in_dept("cam", w.dept_video)
    main = new_main(w, "videohead", departments=[w.dept_video])
    ok, err = divide(w, "videohead", main, "cam", departments=[w.dept_video])
    assert ok, err


def test_executives_and_admin_divide_any_main_task(film):
    for who in ("president", "vp", "admin"):
        ok, err = divide(film, who, film.main, "designer", projects=[film.proj_film], title=f"by {who}")
        assert ok, (who, err)


def test_monitoring_a_task_does_not_grant_division(film):
    # The President made a Videography-linked task and gave it to a regular member:
    # the Videography head can see it (monitoring) but not divide it.
    main = new_main(film, "president", [film.proj_film], [film.dept_video])
    assign(film, "president", main, "cam")
    assert film.rows("videohead", "select 1 from public.tasks where id=%s", (main,))
    ok, err = divide(film, "videohead", main, "cam", departments=[film.dept_video])
    assert not ok and "cannot divide" in err.lower()


def test_a_head_cannot_divide_a_task_another_head_assigned_to_them(film):
    # Film head creates a task and hands it to the Editing head: the Editing head did not create it
    # and an executive did not assign it, so division stays with the creator.
    main = new_main(film, "filmhead", [film.proj_film])
    ok, err = assign(film, "filmhead", main, "edithead")
    assert ok, err
    assert film.q1("select division_owner_id from public.tasks where id=%s", (main,)) is None
    ok, err = divide(film, "edithead", main, "editor", projects=[film.proj_film])
    assert not ok and "cannot divide" in err.lower()
    assert divide(film, "filmhead", main, "editor", projects=[film.proj_film])[0]


def test_division_right_moves_when_an_executive_reassigns(film):
    assign(film, "president", film.main, "edithead")
    assert not divide(film, "filmhead", film.main, "cam", projects=[film.proj_film])[0]
    # The Editing head may divide it now, but only hands work to members of their own department.
    assert not divide(film, "edithead", film.main, "cam", projects=[film.proj_film])[0]
    assert divide(film, "edithead", film.main, "editor", projects=[film.proj_film], departments=[film.dept_edit])[0]


def test_regular_member_cannot_divide(film):
    assign(film, "president", film.main, "designer")
    ok, err = divide(film, "designer", film.main, "cam", projects=[film.proj_film])
    assert not ok and "cannot divide" in err.lower()


def test_unrelated_head_cannot_divide(film):
    assert not divide(film, "otherhead", film.main, "cam", projects=[film.proj_film])[0]


# -- assignment scope ----------------------------------------------------------------------------
def test_project_head_cannot_hand_a_subtask_to_someone_outside_their_scope(film):
    ok, err = divide(film, "filmhead", film.main, "outsider", projects=[film.proj_film])
    assert not ok
    ok, err = divide(film, "filmhead", film.main, "guest", departments=[film.dept_other])
    assert not ok


def test_subtask_projects_must_come_from_the_main_task(film):
    ok, err = divide(film, "filmhead", film.main, "cam", projects=[film.proj_other])
    assert not ok and "projects of its main task" in err


def test_subtask_assignee_must_be_active(film):
    film.conn.execute("update public.members set status='On break' where email='cam@vines.test'")
    assert not divide(film, "filmhead", film.main, "cam", projects=[film.proj_film])[0]


def test_executive_can_give_an_unscoped_subtask_to_any_active_member(club):
    w = club
    w.member("guest")
    main = new_main(w, "president")
    ok, sub = divide(w, "president", main, "guest")
    assert ok, sub
    seen = lambda who, tid: bool(w.rows(who, "select 1 from public.tasks where id=%s", (tid,)))
    assert seen("guest", sub[0][0])
    assert seen("guest", main), "a subtask assignee can see the parent for context"
    assert not seen("outsider", sub[0][0])


# -- visibility ----------------------------------------------------------------------------------
def test_visibility_of_subtasks(film):
    sub = divide(film, "filmhead", film.main, "cam", projects=[film.proj_film], departments=[film.dept_edit])[1][0][0]
    seen = lambda who: bool(film.rows(who, "select 1 from public.tasks where id=%s", (sub,)))
    assert seen("filmhead")      # responsible head
    assert seen("president") and seen("admin") and seen("vp")
    assert seen("cam")           # assignee
    assert seen("edithead")      # head of a department linked to the subtask
    assert seen("videohead")     # head of the department the assignee belongs to
    assert not seen("outsider") and not seen("otherhead")


# -- editing, status, completion ------------------------------------------------------------------
def test_assignee_cannot_edit_or_reassign_but_can_report_progress(film):
    sub = divide(film, "filmhead", film.main, "cam", projects=[film.proj_film])[1][0][0]
    assert film.try_sql("cam", "update public.tasks set status='In Progress' where id=%s", (sub,))[0]
    assert not film.try_sql("cam", "update public.tasks set assignee_id=%s where id=%s", (film.members["cam2"]["id"], sub))[0]
    assert not film.try_sql("cam", "update public.tasks set title='x' where id=%s", (sub,))[0]
    assert not film.try_sql("cam", "select public.update_task_details(%s,'new',null,null,false,null)", (sub,))[0]
    assert not film.try_sql("cam", "update public.tasks set status='Completed' where id=%s", (sub,))[0]


def test_department_head_cannot_directly_edit_or_reassign_another_heads_subtask(film):
    sub = divide(film, "filmhead", film.main, "cam", projects=[film.proj_film], departments=[film.dept_video])[1][0][0]
    assert not film.try_sql("videohead", "update public.tasks set assignee_id=%s where id=%s", (film.members["cam2"]["id"], sub))[0]
    assert not film.try_sql("videohead", "select public.update_task_details(%s,'new',null,null,false,'Low')", (sub,))[0]
    assert not film.try_sql("videohead", "update public.tasks set status='Completed' where id=%s", (sub,))[0]
    assert film.q1("select assignee_id from public.tasks where id=%s", (sub,)) == film.members["cam"]["id"]


def test_responsible_head_edits_and_reassigns_inside_their_scope(film):
    sub = divide(film, "filmhead", film.main, "cam", projects=[film.proj_film])[1][0][0]
    assert film.try_sql("filmhead", "select public.update_task_details(%s,'Filming day',null,null,false,'Urgent')", (sub,))[0]
    assert film.q1("select priority from public.tasks where id=%s", (sub,)) == "Urgent"
    assert film.try_sql("filmhead", "update public.tasks set assignee_id=%s where id=%s", (film.members["cam2"]["id"], sub))[0]
    assert not film.try_sql("filmhead", "update public.tasks set assignee_id=%s where id=%s", (film.members["outsider"]["id"], sub))[0]


def test_subtask_completion_does_not_complete_the_main_task(film):
    subs = [divide(film, "filmhead", film.main, who, projects=[film.proj_film], title=t)[1][0][0]
            for who, t in (("cam", "Filming"), ("cam2", "Editing"))]
    for s in subs:
        assert film.try_sql("filmhead", "update public.tasks set status='Completed' where id=%s", (s,))[0]
    assert status_of(film, film.main) != "Completed"
    assert film.try_sql("filmhead", "update public.tasks set status='Completed' where id=%s", (film.main,))[0]


def test_main_task_without_subtasks_is_completed_directly_by_its_responsible_person(film):
    assign(film, "president", film.main, "designer")
    assert film.try_sql("designer", "update public.tasks set status='In Progress' where id=%s", (film.main,))[0]
    assert film.try_sql("designer", "update public.tasks set status='Completed' where id=%s", (film.main,))[0]
    assert not film.try_sql("editor", "update public.tasks set status='Not Started' where id=%s", (film.main,))[0]


def test_progress_counts_completed_subtasks(film):
    subs = [divide(film, "filmhead", film.main, "cam", projects=[film.proj_film], title=f"S{i}")[1][0][0] for i in range(4)]
    film.try_sql("filmhead", "update public.tasks set status='Completed' where id = any(%s::uuid[])", (subs[:3],))
    film.try_sql("cam", "update public.tasks set status='In Progress' where id=%s", (subs[3],))
    total, done, blocked = film.rows("filmhead", "select total, completed, blocked from public.get_task_progress(%s::uuid[])", ([film.main],))[0]
    assert (total, done, blocked) == (4, 3, 0)
    assert 100 * done // total == 75


def test_progress_is_true_even_when_a_viewer_sees_only_some_subtasks(film):
    a = divide(film, "filmhead", film.main, "cam", projects=[film.proj_film], departments=[film.dept_edit], title="A")[1][0][0]
    divide(film, "filmhead", film.main, "cam2", projects=[film.proj_film], title="B")
    film.try_sql("filmhead", "update public.tasks set status='Completed' where id=%s", (a,))
    assert film.rows("filmhead", "select total, completed from public.get_task_progress(%s::uuid[])", ([film.main],))[0] == (2, 1)
    assert film.rows("outsider", "select * from public.get_task_progress(%s::uuid[])", ([film.main],)) == []


# -- dependencies -----------------------------------------------------------------------------------
def test_dependencies_between_sibling_subtasks_and_no_loops(film):
    f, e, r = [divide(film, "filmhead", film.main, "cam", projects=[film.proj_film], title=t)[1][0][0] for t in ("Film", "Edit", "Review")]
    assert film.try_sql("filmhead", "select public.set_subtask_dependencies(%s, %s::uuid[])", (e, [f]))[0]
    assert film.try_sql("filmhead", "select public.set_subtask_dependencies(%s, %s::uuid[])", (r, [e]))[0]
    ok, err = film.try_sql("filmhead", "select public.set_subtask_dependencies(%s, %s::uuid[])", (f, [r]))
    assert not ok and "loop" in err.lower()
    assert not film.try_sql("cam", "select public.set_subtask_dependencies(%s, %s::uuid[])", (r, [f]))[0]
    other = divide(film, "president", film.main, "cam", projects=[film.proj_film], title="x")[1][0][0]
    main2 = new_main(film, "president", [film.proj_film])
    sub2 = divide(film, "president", main2, "cam", projects=[film.proj_film])[1][0][0]
    assert not film.try_sql("president", "select public.set_subtask_dependencies(%s, %s::uuid[])", (sub2, [other]))[0]


# -- requests ------------------------------------------------------------------------------------------
@pytest.fixture()
def sub(film):
    """A Filming subtask created by the Film head for cam (a Videography member)."""
    return divide(film, "filmhead", film.main, "cam", projects=[film.proj_film], departments=[film.dept_video])[1][0][0]


def request_edit(w, who, sub, **changes):
    import json
    return w.try_sql(who, "select public.submit_task_request(%s,'Edit',%s::jsonb,'needs a change')", (sub, json.dumps(changes)))


def request_reassign(w, who, sub, target):
    import json
    return w.try_sql(who, "select public.submit_task_request(%s,'Reassign',%s::jsonb,'cam2 is free')",
                     (sub, json.dumps({"assignee_id": str(w.members[target]["id"])})))


def decide(w, who, request, decision="Approve", note=""):
    return w.try_sql(who, "select public.review_task_request(%s,%s,%s)", (request, decision, note))


def req_status(w, request):
    return w.q1("select status from public.task_requests where id=%s", (request,))


def test_department_head_can_request_an_edit_and_the_responsible_head_is_told(film, sub):
    ok, req = request_edit(film, "videohead", sub, priority="Urgent", title="Filming day 1")
    assert ok, req
    assert req_status(film, req[0][0]) == "Pending"
    assert film.q1("select count(*) from public.notifications where member_id=%s and kind='Edit request'", (film.members["filmhead"]["id"],)) == 1
    assert film.q1("select priority from public.tasks where id=%s", (sub,)) == "High", "nothing applied before approval"


def test_department_head_can_request_a_reassignment_to_a_member_of_their_department(film, sub):
    ok, req = request_reassign(film, "videohead", sub, "cam2")
    assert ok, req
    assert not request_reassign(film, "videohead", sub, "editor")[0], "target must be in the requester's department"


def test_requests_are_limited_to_department_heads_of_the_assignee(film, sub):
    assert not request_edit(film, "edithead", sub, priority="Low")[0]
    assert not request_edit(film, "designer", sub, priority="Low")[0]
    assert not request_edit(film, "cam", sub, priority="Low")[0]
    ok, err = request_edit(film, "filmhead", sub, priority="Low")
    assert not ok and "directly" in err.lower()


def test_approval_applies_the_change_and_keeps_history(film, sub):
    req = request_edit(film, "videohead", sub, priority="Urgent", title="Filming day 1")[1][0][0]
    ok, err = decide(film, "filmhead", req, "Approve", "ok")
    assert ok, err
    assert req_status(film, req) == "Approved"
    assert film.q1("select priority from public.tasks where id=%s", (sub,)) == "Urgent"
    assert film.q1("select title from public.tasks where id=%s", (sub,)) == "Filming day 1"
    events = {r[0] for r in film.conn.execute("select event from public.task_activity where task_id=%s", (sub,)).fetchall()}
    assert {"Subtask created", "Edit requested", "Request approved"} <= events
    assert film.q1("select count(*) from public.notifications where member_id=%s and kind='Request approved'", (film.members["videohead"]["id"],)) == 1
    assert film.q1("select reviewed_by from public.task_requests where id=%s", (req,)) == film.members["filmhead"]["id"]


def test_approving_a_reassignment_moves_the_subtask(film, sub):
    req = request_reassign(film, "videohead", sub, "cam2")[1][0][0]
    assert decide(film, "filmhead", req)[0]
    assert film.q1("select assignee_id from public.tasks where id=%s", (sub,)) == film.members["cam2"]["id"]
    assert status_of(film, sub) == "Not Started"
    assert film.q1("select count(*) from public.notifications where member_id=%s and kind='Subtask assigned' and task_id=%s",
                   (film.members["cam2"]["id"], sub)) + film.q1(
        "select count(*) from public.notifications where member_id=%s and kind='Subtask reassigned' and task_id=%s",
        (film.members["cam2"]["id"], sub)) >= 1


def test_rejection_changes_nothing(film, sub):
    req = request_edit(film, "videohead", sub, priority="Urgent")[1][0][0]
    assert decide(film, "filmhead", req, "Reject", "not now")[0]
    assert req_status(film, req) == "Rejected"
    assert film.q1("select priority from public.tasks where id=%s", (sub,)) == "High"
    assert film.q1("select review_note from public.task_requests where id=%s", (req,)) == "not now"


def test_only_the_responsible_head_or_leadership_can_decide(film, sub):
    req = request_edit(film, "videohead", sub, priority="Urgent")[1][0][0]
    for who in ("videohead", "edithead", "designer", "cam", "otherhead", "outsider"):
        ok, _ = decide(film, who, req)
        assert not ok, who
    assert req_status(film, req) == "Pending"
    assert decide(film, "vp", req)[0]


def test_first_decision_wins_and_later_ones_are_refused(film, sub):
    req = request_edit(film, "videohead", sub, priority="Urgent")[1][0][0]
    assert decide(film, "filmhead", req, "Approve")[0]
    for who, decision in (("president", "Reject"), ("filmhead", "Approve"), ("admin", "Reject")):
        ok, err = decide(film, who, req, decision)
        assert not ok and "already approved" in err.lower(), (who, err)
    assert not film.try_sql("videohead", "select public.cancel_task_request(%s)", (req,))[0]
    assert req_status(film, req) == "Approved"
    assert film.q1("select priority from public.tasks where id=%s", (sub,)) == "Urgent"


def test_a_cancelled_request_cannot_be_approved_and_only_its_sender_cancels(film, sub):
    req = request_edit(film, "videohead", sub, priority="Urgent")[1][0][0]
    assert not film.try_sql("filmhead", "select public.cancel_task_request(%s)", (req,))[0]
    assert film.try_sql("videohead", "select public.cancel_task_request(%s)", (req,))[0]
    ok, err = decide(film, "filmhead", req)
    assert not ok and "already cancelled" in err.lower()
    assert film.q1("select priority from public.tasks where id=%s", (sub,)) == "High"


def test_requests_follow_the_current_responsible_head(film, sub):
    req = request_edit(film, "videohead", sub, priority="Urgent")[1][0][0]
    assert assign(film, "president", film.main, "edithead")[0]
    assert not decide(film, "filmhead", req)[0], "the original creator no longer decides"
    assert decide(film, "edithead", req)[0]


def test_request_visibility(film, sub):
    req = request_edit(film, "videohead", sub, priority="Urgent")[1][0][0]
    visible = lambda who: bool(film.rows(who, "select 1 from public.task_requests where id=%s", (req,)))
    assert visible("videohead") and visible("filmhead") and visible("president") and visible("admin")
    assert not visible("edithead") and not visible("designer") and not visible("cam") and not visible("outsider")


def test_clients_cannot_write_requests_directly(film, sub):
    req = request_edit(film, "videohead", sub, priority="Urgent")[1][0][0]
    assert not film.try_sql("videohead", "update public.task_requests set status='Approved' where id=%s", (req,))[0]
    assert not film.try_sql("videohead", "insert into public.task_requests(task_id, request_type, requested_by, changes) values (%s,'Edit',%s,'{}')", (sub, film.members["videohead"]["id"]))[0]
    assert not film.try_sql("videohead", "delete from public.task_requests where id=%s", (req,))[0]
    assert req_status(film, req) == "Pending"


def test_a_second_pending_request_of_the_same_kind_is_refused(film, sub):
    assert request_edit(film, "videohead", sub, priority="Urgent")[0]
    ok, err = request_edit(film, "videohead", sub, priority="Low")
    assert not ok and "already have a pending" in err


# -- comments, activity, notifications ------------------------------------------------------------------
def test_comments_follow_task_visibility_and_notify_the_team(film, sub):
    assert film.try_sql("cam", "insert into public.task_comments(task_id, author_id, body) values (%s, app_private.current_member_id(), 'Blocked by lighting')", (sub,))[0]
    assert not film.try_sql("outsider", "insert into public.task_comments(task_id, author_id, body) values (%s, app_private.current_member_id(), 'hi')", (sub,))[0]
    assert not film.try_sql("designer", "insert into public.task_comments(task_id, author_id, body) values (%s, %s, 'forged')", (sub, film.members["cam"]["id"]))[0]
    assert len(film.rows("filmhead", "select 1 from public.task_comments where task_id=%s", (sub,))) == 1
    assert film.rows("outsider", "select 1 from public.task_comments where task_id=%s", (sub,)) == []
    assert film.q1("select count(*) from public.notifications where member_id=%s and kind='New comment'", (film.members["filmhead"]["id"],)) == 1


def test_activity_cannot_be_forged_or_edited_by_clients(film, sub):
    assert not film.try_sql("filmhead", "insert into public.task_activity(task_id, event) values (%s,'fake')", (sub,))[0]
    assert not film.try_sql("president", "delete from public.task_activity where task_id=%s", (sub,))[0]
    assert film.rows("cam", "select event from public.task_activity where task_id=%s", (sub,))


def test_status_changes_and_blocks_are_logged_and_notified(film, sub):
    film.try_sql("cam", "update public.tasks set status='Blocked' where id=%s", (sub,))
    events = [r[0] for r in film.conn.execute("select event from public.task_activity where task_id=%s order by created_at", (sub,)).fetchall()]
    assert "Status changed" in events
    assert film.q1("select count(*) from public.notifications where member_id=%s and kind='Subtask blocked'", (film.members["filmhead"]["id"],)) == 1
    assert film.q1("select count(*) from public.notifications where member_id=%s and kind='Subtask blocked'", (film.members["cam"]["id"],)) == 0, "the actor is not notified"


def test_members_only_read_and_mark_their_own_notifications(film, sub):
    mine = film.rows("cam", "select id from public.notifications")
    assert mine and all(True for _ in mine)
    assert film.rows("outsider", "select 1 from public.notifications") == []
    assert film.try_sql("cam", "update public.notifications set read_at = now()")[0]
    assert not film.try_sql("cam", "update public.notifications set title = 'x'")[0]
    assert film.q1("select count(*) from public.notifications where read_at is not null and member_id <> %s", (film.members["cam"]["id"],)) == 0


def test_deadline_notifications_are_sent_once(film, sub):
    film.force("update public.tasks set due_at = now() + interval '3 hours' where id=%s", (sub,))
    assert film.q1("select public.generate_deadline_notifications()") >= 0
    film.q1("select public.generate_deadline_notifications()")
    assert film.q1("select count(*) from public.notifications where kind='Deadline approaching' and task_id=%s", (sub,)) == 1
    film.force("update public.tasks set due_at = now() - interval '2 hours' where id=%s", (sub,))
    film.q1("select public.generate_deadline_notifications()")
    film.q1("select public.generate_deadline_notifications()")
    assert film.q1("select count(*) from public.notifications where kind='Task overdue' and task_id=%s", (sub,)) == 2  # assignee + responsible head


def test_deleting_a_main_task_removes_its_subtasks(film, sub):
    film.try_sql("president", "delete from public.tasks where id=%s", (film.main,))
    assert film.q1("select count(*) from public.tasks where id in (%s,%s)", (film.main, sub)) == 0


def test_only_authorised_people_delete_subtasks(film, sub):
    film.try_sql("cam", "delete from public.tasks where id=%s", (sub,))
    film.try_sql("videohead", "delete from public.tasks where id=%s", (sub,))
    assert film.q1("select count(*) from public.tasks where id=%s", (sub,)) == 1
    film.try_sql("filmhead", "delete from public.tasks where id=%s", (sub,))
    assert film.q1("select count(*) from public.tasks where id=%s", (sub,)) == 0


# -- concurrency: the first decision wins even when two people click at the same moment ------------------
def test_simultaneous_decisions_only_apply_the_first(database):
    import json

    seed = psycopg.connect(database, autocommit=True)

    def q1(sql, params=None):
        return seed.execute(sql, params).fetchone()[0]

    try:
        ids = {}
        for key in ("admin", "president", "filmhead", "videohead", "cam"):
            ids[key] = q1("insert into public.members(name,email,is_club_admin,status) values (%s,%s,%s,'Active') returning id",
                          (key, f"c-{key}@vines.test", key == "admin"))
        dept = q1("insert into public.departments(name) values ('Race Dept') returning id")
        proj = q1("insert into public.projects(name) values ('Race Project') returning id")
        pos = lambda name: q1("select id from public.positions where name=%s", (name,))
        seed.execute("insert into public.member_positions(member_id, position_id) values (%s,%s)", (ids["president"], pos("President")))
        seed.execute("insert into public.member_positions(member_id, position_id, project_id) values (%s,%s,%s)", (ids["filmhead"], pos("Project Head"), proj))
        seed.execute("insert into public.member_positions(member_id, position_id, department_id) values (%s,%s,%s)", (ids["videohead"], pos("Department Head"), dept))
        seed.execute("insert into public.member_departments(member_id, department_id) values (%s,%s)", (ids["cam"], dept))
        for key in ("filmhead", "cam"):
            seed.execute("insert into public.project_assignments(member_id, project_id, allocated_by) values (%s,%s,%s)", (ids[key], proj, ids["admin"]))

        def as_member(conn, key):
            claims = json.dumps({"role": "authenticated", "email": f"c-{key}@vines.test", "sub": str(uuid.uuid4())})
            conn.execute("select set_config('request.jwt.claims', %s, true)", (claims,))
            conn.execute("set local role authenticated")

        main = uuid.uuid4()
        a = psycopg.connect(database)
        as_member(a, "president")
        a.execute("insert into public.tasks(id,title,task_type,project_id,assigned_by) values (%s,'Main','Project task',%s,%s)", (main, proj, ids["president"]))
        a.execute("insert into public.task_projects(task_id, project_id) values (%s,%s)", (main, proj))
        a.execute("update public.tasks set assignee_id=%s where id=%s", (ids["filmhead"], main))
        sub = a.execute("select public.create_subtask(%s,'Sub','',%s,null,'High',%s::uuid[],%s::uuid[])", (main, ids["cam"], [proj], [dept])).fetchone()[0]
        a.commit()

        v = psycopg.connect(database)
        as_member(v, "videohead")
        req = v.execute("select public.submit_task_request(%s,'Edit',%s::jsonb,'')", (sub, json.dumps({"priority": "Urgent"}))).fetchone()[0]
        v.commit()
        v.close()

        first = psycopg.connect(database)
        as_member(first, "filmhead")
        first.execute("select public.review_task_request(%s,'Approve','')", (req,))  # holds the row lock, not committed yet

        result = {}

        def second():
            c = psycopg.connect(database)
            try:
                as_member(c, "president")
                c.execute("select public.review_task_request(%s,'Reject','')", (req,))
                c.commit()
                result["outcome"] = "applied"
            except psycopg.Error as exc:
                result["outcome"] = str(exc).splitlines()[0]
            finally:
                c.close()

        t = threading.Thread(target=second)
        t.start()
        time.sleep(0.6)
        assert t.is_alive(), "the second reviewer should be waiting on the lock"
        first.commit()
        t.join(5)
        assert "already approved" in result["outcome"]
        assert q1("select status from public.task_requests where id=%s", (req,)) == "Approved"
        assert q1("select priority from public.tasks where id=%s", (sub,)) == "Urgent"
        first.close()
        a.close()
    finally:
        seed.execute("truncate public.members, public.departments, public.projects cascade")
        seed.close()
