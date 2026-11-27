from conftest import until
from test_subtasks_ui import SEED, OMAR, calls, tasks_view


def test_update_form_lets_an_editor_change_the_deadline(open_app):
    page = open_app(seed=SEED)
    tasks_view(page)
    page.click('[data-task-row="mt"] [data-action="add-update"]')
    assert page.locator('#updateForm [name="due"]').input_value() == "2026-12-20"
    page.fill('#updateForm [name="update"]', "Pushed back a week")
    page.fill('#updateForm [name="due"]', "2026-12-27")
    page.click("#updateForm .btn.lime")
    until(page, "window.__DATA.tasks.find(t => t.id === 'mt').due_at.startsWith('2026-12-27')")
    sent = calls(page, "update_task_details")
    assert sent and sent[-1]["p_task"] == "mt" and sent[-1]["p_due"] == "2026-12-27T23:59:00"
    until(page, "document.querySelector('[data-task-row=\"mt\"]').innerText.includes('27')")
    assert not page.errors


def test_update_form_without_a_date_change_sends_no_deadline_call(open_app):
    page = open_app(seed=SEED)
    tasks_view(page)
    page.click('[data-task-row="mt"] [data-action="add-update"]')
    page.fill('#updateForm [name="update"]', "Going well")
    page.click("#updateForm .btn.lime")
    until(page, "window.__DATA.tasks.find(t => t.id === 'mt').progress_update === 'Going well'")
    assert not calls(page, "update_task_details")


def test_members_who_cannot_edit_details_get_no_deadline_field(open_app):
    page = open_app(seed=SEED, email="nour@vines.test", uid="m3")
    tasks_view(page)
    page.click('[data-task-row="t1"] [data-action="add-update"]')
    page.wait_for_selector("#updateForm")
    assert page.locator('#updateForm [name="due"]').count() == 0


def test_page_picks_up_new_tasks_and_members_without_a_reload(open_app):
    page = open_app(seed=SEED)
    tasks_view(page)
    assert "Brand new task" not in page.locator("#taskList").inner_text()
    page.evaluate(
        """() => {
          const D = window.__DATA;
          D.tasks.push(Object.assign({}, D.tasks.find(t => t.id === 't1'), {id: 'fresh', title: 'Brand new task', assignee_id: null, status: 'Unassigned'}));
          D.task_projects.push({task_id: 'fresh', project_id: 'p0'});
          D.members.push(Object.assign({}, D.members[1], {id: 'm99', name: 'Zed Newcomer', email: 'zed@vines.test'}));
        }"""
    )
    page.evaluate("window.dispatchEvent(new Event('focus'))")
    until(page, "document.getElementById('taskList').innerText.includes('Brand new task')")
    page.click('.nav button[data-view="members"]')
    until(page, "document.body.innerText.includes('Zed Newcomer')")
    assert not page.errors


def test_refresh_waits_while_a_form_is_open_then_catches_up(open_app):
    page = open_app(seed=SEED)
    tasks_view(page)
    page.click('[data-task-row="mt"] [data-action="add-update"]')
    page.wait_for_selector("#updateForm")
    page.evaluate(
        """() => { const D = window.__DATA; D.tasks.push(Object.assign({}, D.tasks.find(t => t.id === 't1'), {id: 'late', title: 'Late arrival'})); D.task_projects.push({task_id: 'late', project_id: 'p0'}); }"""
    )
    page.evaluate("window.dispatchEvent(new Event('focus'))")
    page.wait_for_timeout(800)
    assert "Late arrival" not in page.locator("#taskList").inner_text()  # form still open: nothing was reloaded
    page.click("#updateForm [data-close-modal]")
    until(page, "document.getElementById('taskList').innerText.includes('Late arrival')", timeout=8000)
