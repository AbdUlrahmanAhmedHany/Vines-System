from conftest import until


def test_alerts_become_a_centred_popup(open_app):
    page = open_app()
    page.evaluate("alert('Profile saved.'); alert('Could not send the invitation: limit reached.')")
    page.wait_for_selector("#popup.open")
    box = page.eval_on_selector(".popup-card", "e=>{const r=e.getBoundingClientRect();return [r.x+r.width/2, r.y+r.height/2]}")
    assert abs(box[0] - 720) < 30 and abs(box[1] - 450) < 60
    assert page.inner_text("#popupText") == "Profile saved."
    page.click("#popupOk")
    until(page, "document.querySelector('#popupText').innerText.includes('Could not send')")
    assert page.eval_on_selector("#popup", "e=>e.classList.contains('error')")
    page.keyboard.press("Escape")
    until(page, "!document.querySelector('#popup').classList.contains('open')")
    assert page.native_dialogs == []


def test_calendar_views_and_task_details(open_app):
    page = open_app()
    page.evaluate(
        """()=>{const d=new Date(); const k=n=>{const x=new Date(d.getFullYear(),d.getMonth(),n);
        return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
        window.__DATA.tasks.slice(0,3).forEach((t,i)=>{t.due_at=k(3+i*4)+'T00:00:00Z'})}"""
    )
    page.click('.nav button[data-view="calendar"]')
    page.wait_for_selector(".cal-grid.month")
    page.evaluate("document.querySelector('#calendarToday').click()")
    assert page.eval_on_selector_all(".cal-cell.today", "e=>e.length") == 1
    page.click(".cal-chip >> nth=0")
    page.wait_for_selector("#modal.open")
    body = page.inner_text("#modalBody").lower()
    assert "description" in body and "assigned to" in body
    assert "&amp;" not in page.inner_text("#modalTitle")
    page.click("#modalBody [data-close-modal]")
    page.click('[data-cal-view="week"]')
    assert page.eval_on_selector_all(".cal-col", "e=>e.length") == 7
    page.click('[data-cal-view="day"]')
    assert page.is_visible(".cal-dayview")
    page.check("#calendarMine")
    assert page.is_visible("#calendarBoard")
    assert not page.errors


def test_calendar_has_no_horizontal_scroll_on_a_phone(open_app):
    page = open_app(width=390, height=780)
    page.click('.nav button[data-view="calendar"]')
    page.wait_for_selector("#calendarBoard")
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1")
