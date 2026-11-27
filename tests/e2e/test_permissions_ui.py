from conftest import PRESIDENT, until


def go(page, view):
    page.click(f'.nav button[data-view="{view}"]')
    page.wait_for_timeout(250)


def test_president_who_is_not_admin_gets_executive_controls_only(open_app):
    page = open_app(email="nour@vines.test", uid="m3", positions=[PRESIDENT])
    assert not page.is_visible("#adminNav")
    assert not page.is_visible("#addDept") and not page.is_visible("#addProject")
    go(page, "members")
    actions = page.eval_on_selector_all("#memberList [data-action]", "e=>[...new Set(e.map(x=>x.dataset.action))]")
    assert actions == []
    go(page, "tasks")
    assert page.is_visible("#addTaskBtn")
    page.click("#addTaskBtn")
    page.wait_for_selector("#taskForm")
    assert page.is_visible("#clubWideTask")
    assert not page.errors


def test_president_creates_a_club_wide_task(open_app):
    page = open_app(email="nour@vines.test", uid="m3", positions=[PRESIDENT])
    go(page, "tasks")
    page.click("#addTaskBtn")
    page.wait_for_selector("#taskForm")
    page.fill("#taskForm input[name=title]", "Club meeting prep")
    page.check("#clubWideTask")
    page.click("#taskForm .btn.lime")
    until(page, "document.querySelector('#taskList').innerText.includes('Club meeting prep')")
    assert "Club-wide" in page.inner_text("#taskList")
    assert page.native_dialogs == []


def test_club_wide_cannot_be_mixed_with_a_project(open_app):
    page = open_app(email="nour@vines.test", uid="m3", positions=[PRESIDENT])
    go(page, "tasks")
    page.click("#addTaskBtn")
    page.wait_for_selector("#taskForm")
    page.fill("#taskForm input[name=title]", "Mixed")
    page.check("#clubWideTask")
    page.check('#taskForm input[name="projects"] >> nth=0')
    page.click("#taskForm .btn.lime")
    page.wait_for_selector("#popup.open")
    assert "cannot also belong" in page.inner_text("#popupText")


def test_regular_member_has_no_management_controls(open_app):
    page = open_app(email="nour@vines.test", uid="m3")
    assert not page.is_visible("#addTaskBtn")
    assert not page.is_visible("#adminNav")


def test_admin_sees_administration_and_member_actions(open_app):
    page = open_app()
    assert page.is_visible("#adminNav")
    go(page, "members")
    actions = page.eval_on_selector_all("#memberList [data-action]", "e=>[...new Set(e.map(x=>x.dataset.action))]")
    assert "edit-member" in actions and "toggle-system-access" in actions
