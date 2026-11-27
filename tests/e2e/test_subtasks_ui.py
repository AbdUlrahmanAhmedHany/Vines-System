import json

from conftest import DEPARTMENT_HEAD, PROJECT_HEAD, until

SEED = """
const base = {task_type:"Project task", project_id:"p0", department_id:null, assigned_by:"m0", priority:"High", due_at:"2026-12-20T23:59:00", progress_update:"", description:""};
DATA.tasks.push(
  Object.assign({}, base, {id:"mt", title:"Produce 8 Reels", assignee_id:"m2", created_by:"m0", division_owner_id:"m2", parent_task_id:null, status:"In Progress"}),
  Object.assign({}, base, {id:"st1", title:"Filming", assignee_id:"m3", created_by:"m2", parent_task_id:"mt", status:"Completed"}),
  Object.assign({}, base, {id:"st2", title:"Editing", assignee_id:"m6", created_by:"m2", parent_task_id:"mt", status:"In Progress"}),
  Object.assign({}, base, {id:"st3", title:"Publishing", assignee_id:"m3", created_by:"m2", parent_task_id:"mt", status:"Not Started"})
);
DATA.task_projects.push({task_id:"mt",project_id:"p0"},{task_id:"st1",project_id:"p0"},{task_id:"st2",project_id:"p0"},{task_id:"st3",project_id:"p0"});
DATA.task_departments.push({task_id:"st1",department_id:"d0"});
DATA.task_dependencies.push({task_id:"st3", depends_on_task_id:"st2"});
"""
PENDING = """DATA.task_requests.push({id:"r0", task_id:"st2", request_type:"Edit", requested_by:"m6", changes:{priority:"Urgent"}, reason:"Deadline moved", status:"Pending", created_at:"2026-11-25T10:00:00Z", reviewed_by:null, reviewed_at:null, review_note:""});"""

OMAR = dict(email="omar@vines.test", uid="m2", positions=[PROJECT_HEAD], position_scopes={PROJECT_HEAD: {"project": '"p0"'}})
LAYLA = dict(email="layla@vines.test", uid="m1", positions=[DEPARTMENT_HEAD], position_scopes={DEPARTMENT_HEAD: {"department": '"d0"'}})


def tasks_view(page):
    page.click('.nav button[data-view="tasks"]')
    page.wait_for_selector("#taskList .task:not(.header)")


def calls(page, name):
    return [c[2] for c in page.evaluate("window.__calls || []") if c[0] == "rpc" and c[1] == name]


def test_main_task_shows_progress_and_expands_to_its_subtasks(open_app):
    page = open_app(seed=SEED)
    tasks_view(page)
    row = page.locator('[data-task-row="mt"]')
    assert "1 of 3 done (33%)" in row.inner_text()
    assert page.locator(".task.subtask").count() == 0
    page.click('[data-action="toggle-subtasks"][data-id="mt"]')
    assert page.locator(".task.subtask").count() == 3
    assert "Waiting on 1" in page.locator('[data-task-row="st3"]').inner_text()
    page.click('[data-action="toggle-subtasks"][data-id="mt"]')
    assert page.locator(".task.subtask").count() == 0
    assert not page.errors


def test_only_main_tasks_offer_division_and_only_to_those_allowed(open_app):
    admin = open_app(seed=SEED)
    tasks_view(admin)
    admin.click('[data-action="toggle-subtasks"][data-id="mt"]')
    assert admin.locator('[data-action="divide-task"]').count() == 4  # every main task, no subtask
    assert admin.locator(".task.subtask [data-action=divide-task]").count() == 0

    head = open_app(seed=SEED, **OMAR)
    tasks_view(head)
    assert head.locator('[data-task-row="mt"] [data-action="divide-task"]').count() == 1  # assigned to him by the admin
    assert head.locator('[data-task-row="t1"] [data-action="divide-task"]').count() == 0  # he only runs it, did not create it

    member = open_app(seed=SEED, email="nour@vines.test", uid="m3")
    tasks_view(member)
    assert member.locator('[data-action="divide-task"]').count() == 0


def test_dividing_a_task_sends_the_subtask_and_shows_it(open_app):
    page = open_app(seed=SEED, **OMAR)
    tasks_view(page)
    page.click('[data-task-row="mt"] [data-action="divide-task"]')
    page.wait_for_selector("#divideForm")
    page.fill("#divideForm [name=title]", "Thumbnails")
    page.select_option("#subAssignee", label="Nour Samir")
    page.click("#divideForm .btn.lime")
    until(page, "document.querySelectorAll('.task.subtask').length === 4")
    sent = calls(page, "create_subtask")[0]
    assert sent["p_parent"] == "mt" and sent["p_title"] == "Thumbnails" and sent["p_assignee"] == "m3"
    assert sent["p_project_ids"] == ["p0"]
    assert "Thumbnails" in page.inner_text("#taskList")


def test_details_show_progress_dependencies_and_history_sections(open_app):
    page = open_app(seed=SEED)
    tasks_view(page)
    page.click('[data-task-row="mt"] [data-action="open-task"]')
    page.wait_for_selector(".task-detail")
    text = page.inner_text("#modalBody")
    assert "1 of 3 done (33%)" in text and "does not complete the main task" in text
    for heading in ("subtasks", "requests", "comments", "activity"):
        assert heading in text.lower()
    assert "Filming" in text and "Editing" in text and "Publishing" in text
    page.click('.task-detail [data-action="open-task"][data-id="st3"]')
    until(page, "document.querySelector('#modalBody').innerText.includes('Waiting on Editing')")
    assert "Part of" in page.inner_text("#modalBody")


def test_department_head_requests_a_change_instead_of_editing(open_app):
    page = open_app(seed=SEED, **LAYLA)
    tasks_view(page)
    page.click('[data-action="toggle-subtasks"][data-id="mt"]')
    row = page.locator('[data-task-row="st3"]')
    assert row.locator('[data-action="assign-task"]').count() == 0  # no direct reassignment
    row.locator('[data-action="open-task"]').click()
    page.wait_for_selector('[data-action="request-change"]')
    assert page.locator('[data-action="edit-task-details"]').count() == 0
    page.click('[data-action="request-change"]')
    page.check('#requestForm [value="Reassign"]')
    page.select_option('#requestForm [name="assignee"]', label="Mariam Tarek")
    page.fill("#requestForm [name=reason]", "Mariam has time this week")
    page.click("#requestForm .btn.lime")
    page.wait_for_selector("#popup.open")
    assert "Nothing changes until" in page.inner_text("#popupText")
    sent = calls(page, "submit_task_request")[0]
    assert sent["p_type"] == "Reassign" and sent["p_changes"] == {"assignee_id": "m5"}
    assert sent["p_task"] == "st3"


def test_responsible_head_reviews_requests_with_a_confirmation(open_app):
    page = open_app(seed=SEED + PENDING, **OMAR)
    tasks_view(page)
    assert "1 request waiting for you" in page.inner_text("#taskSummary")
    page.click('#taskRequests [data-action="review-request"][data-decision="Approve"]')
    page.wait_for_selector("#popup.open")
    assert "Approve this edit request" in page.inner_text("#popupText")
    assert "theirs counts and yours is ignored" in page.inner_text("#popupText")
    page.click("#popupCancel")
    assert calls(page, "review_task_request") == []
    page.click('#taskRequests [data-action="review-request"][data-decision="Approve"]')
    page.click("#popupOk")
    until(page, "!document.querySelector('#taskRequests [data-decision]')")
    sent = calls(page, "review_task_request")[0]
    assert sent["p_request"] == "r0" and sent["p_decision"] == "Approve"
    assert page.evaluate("window.__DATA.tasks.find(t=>t.id==='st2').priority") == "Urgent"


def test_a_request_someone_else_already_decided_is_refused_and_the_screen_refreshes(open_app):
    page = open_app(seed=SEED + PENDING, **OMAR)
    tasks_view(page)
    # While this page still shows the request as pending, another person decides first.
    page.evaluate("window.__DATA.task_requests[0].status = 'Approved'")
    page.click('#taskRequests [data-action="review-request"][data-decision="Reject"]')
    page.click("#popupOk")
    until(page, "document.querySelector('#popupText').innerText.includes('already approved')")
    assert "Nothing was changed" in page.inner_text("#popupText")
    page.click("#popupOk")
    until(page, "!document.querySelector('#taskRequests [data-decision]')")
    assert page.evaluate("window.__DATA.task_requests[0].status") == "Approved"
    assert page.evaluate("window.__DATA.tasks.find(t=>t.id==='st2').priority") == "High"


def test_confirming_a_main_task_warns_about_open_subtasks(open_app):
    page = open_app(seed=SEED, **OMAR)
    tasks_view(page)
    page.select_option('[data-task-row="mt"] [data-task-status]', "Completed")
    page.wait_for_selector("#popup.open")
    assert "2 subtasks are not completed yet" in page.inner_text("#popupText")
    page.click("#popupCancel")
    assert page.evaluate("window.__DATA.tasks.find(t=>t.id==='mt').status") == "In Progress"
    page.select_option('[data-task-row="mt"] [data-task-status]', "Completed")
    page.click("#popupOk")
    until(page, "window.__DATA.tasks.find(t=>t.id==='mt').status === 'Completed'")


def test_starting_a_waiting_subtask_warns(open_app):
    page = open_app(seed=SEED)
    tasks_view(page)
    page.click('[data-action="toggle-subtasks"][data-id="mt"]')
    page.select_option('[data-task-row="st3"] [data-task-status]', "In Progress")
    page.wait_for_selector("#popup.open")
    assert "waiting on Editing" in page.inner_text("#popupText")
    page.click("#popupCancel")
    assert page.evaluate("window.__DATA.tasks.find(t=>t.id==='st3').status") == "Not Started"


def test_notifications_bell_lists_unread_and_opens_the_task(open_app):
    seed = SEED + """DATA.notifications.push(
      {id:"n1", kind:"Subtask assigned", title:"You were given a subtask: Editing", body:"", task_id:"st2", created_at:new Date().toISOString(), read_at:null},
      {id:"n2", kind:"New comment", title:"New comment on Filming", body:"Looks great", task_id:"st1", created_at:new Date().toISOString(), read_at:null});"""
    page = open_app(seed=seed)
    assert page.inner_text("#notifCount") == "2"
    page.click("#notifBtn")
    assert page.locator(".notif.unread").count() == 2
    page.click('.notif[data-id="n1"]')
    page.wait_for_selector(".task-detail")
    assert page.inner_text("#modalTitle") == "Editing"
    assert page.inner_text("#notifCount") == "1"
    assert page.evaluate("window.__DATA.notifications.find(n=>n.id==='n1').read_at") is not None
    page.click("#modalBody [data-close-modal]")
    page.click("#notifBtn")
    page.click("#notifReadAll")
    assert "hidden" in page.get_attribute("#notifCount", "class")


def test_the_new_task_screens_work_on_a_phone(open_app):
    page = open_app(seed=SEED + PENDING, width=390, height=800, **OMAR)
    tasks_view(page)
    page.click('[data-action="toggle-subtasks"][data-id="mt"]')
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1")
    assert not page.errors
