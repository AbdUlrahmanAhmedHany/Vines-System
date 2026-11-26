"""Functional browser tests.

The real Flask app is served on a local port and driven by Playwright. Supabase is
replaced inside the page by tests/e2e/shim.js (an in-memory stand-in that also
answers /api/config and the invitation routes), so the suite needs no network or
credentials. Tests read and change the mock database through window.__DATA.
"""
import threading
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright
from werkzeug.serving import make_server

SHIM = (Path(__file__).with_name("shim.js")).read_text()


@pytest.fixture(scope="session")
def base_url():
    from app import create_app

    server = make_server("127.0.0.1", 0, create_app(), threaded=True)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{server.server_port}"
    server.shutdown()


@pytest.fixture(scope="session")
def browser():
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--no-sandbox"])
        yield b
        b.close()


@pytest.fixture()
def open_app(browser, base_url):
    """open_app(email="admin@vines.test", uid="m0", positions=("President",), width=1440) -> page"""
    contexts = []

    def _open(email="admin@vines.test", uid="m0", positions=(), width=1440, height=900, route="/"):
        shim = SHIM.replace("email: ADMIN,", f'email: "{email}",', 1).replace('id: "m0", aud', f'id: "{uid}", aud', 1)
        rows = ",".join(
            '{id:"mp%d",member_id:"%s",position_id:"%s",department_id:null,project_id:null,assigned_by:null}' % (i, uid, pos)
            for i, pos in enumerate(positions)
        )
        if rows:
            shim = shim.replace("member_positions: [],", f"member_positions: [{rows}],", 1)
        context = browser.new_context(viewport={"width": width, "height": height})
        contexts.append(context)
        context.add_init_script(shim)
        page = context.new_page()
        page.errors = []
        page.on("pageerror", lambda e: page.errors.append(str(e)))
        page.native_dialogs = []
        page.on("dialog", lambda d: (page.native_dialogs.append(d.message), d.dismiss()))
        page.goto(base_url + route)
        page.wait_for_selector("#appShell:not(.hidden)")
        return page

    yield _open
    for context in contexts:
        context.close()


PRESIDENT = "pos1"
VICE_PRESIDENT = "pos2"
