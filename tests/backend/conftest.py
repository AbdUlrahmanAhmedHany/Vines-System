"""Backend tests run the real Flask app against a fake Supabase HTTP server that records every call."""
import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

import pytest

ADMIN = {"id": "11111111-1111-4111-8111-111111111111", "email": "admin@vines.test", "is_club_admin": True, "status": "Active"}
LAYLA = {"id": "22222222-2222-4222-8222-222222222222", "email": "layla@vines.test", "is_club_admin": False, "status": "Active"}
OTHER_ADMIN = {"id": "33333333-3333-4333-8333-333333333333", "email": "boss@vines.test", "is_club_admin": True, "status": "Active"}
GHOST = {"id": "44444444-4444-4444-8444-444444444444", "email": "ghost@vines.test", "is_club_admin": False, "status": "Pending invitation"}
LATE = {"id": "55555555-5555-4555-8555-555555555555", "email": "late@vines.test", "is_club_admin": False, "status": "Active"}
MEMBERS = [ADMIN, LAYLA, OTHER_ADMIN, GHOST, LATE]
TOKENS = {"admin-token": ADMIN["email"], "layla-token": LAYLA["email"]}


class FakeSupabase:
    def __init__(self):
        self.log = []
        self.fail = None
        self.login_exists = False
        self.auth_users = []
        self.reset()

    def reset(self, fail=None):
        self.log = []
        self.fail = fail
        self.login_exists = False
        # 250 filler users push LATE onto the second admin-users page; GHOST has no login at all.
        filler = [{"id": f"f{i}", "email": f"user{i}@x.test"} for i in range(250)]
        self.auth_users = filler + [
            {"id": "auth-admin", "email": ADMIN["email"]},
            {"id": "auth-layla", "email": LAYLA["email"]},
            {"id": "auth-late", "email": LATE["email"]},
        ]

    def calls(self):
        return [entry.split("?")[0] for entry in self.log]


def _handler(fake):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def send(self, status, body=None):
            raw = b"" if body is None else json.dumps(body).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)

        def handle_any(self):
            url = urlparse(self.path)
            q = {k: v[0] for k, v in parse_qs(url.query).items()}
            length = int(self.headers.get("Content-Length") or 0)
            if length:
                self.rfile.read(length)
            path = url.path
            if path == "/auth/v1/user":
                token = (self.headers.get("Authorization") or "").replace("Bearer ", "")
                email = TOKENS.get(token)
                return self.send(200, {"id": "u", "email": email}) if email else self.send(401, {})
            fake.log.append(f"{self.command} {path}" + (("?" + url.query) if url.query else ""))
            if fake.fail and fake.fail in f"{self.command} {path}":
                return self.send(500, {"message": "boom"})
            if path == "/rest/v1/members" and self.command == "GET":
                rows = MEMBERS
                if "email" in q:
                    rows = [m for m in rows if m["email"].lower() == q["email"].replace("ilike.", "").lower()]
                if "id" in q:
                    rows = [m for m in rows if m["id"] == q["id"].replace("eq.", "")]
                return self.send(200, rows)
            if path == "/auth/v1/invite" and fake.login_exists:
                return self.send(422, {"error_code": "email_exists", "msg": "A user with this email address has already been registered"})
            if path.startswith("/auth/v1/admin/users/") and self.command == "DELETE":
                fake.login_exists = False
                return self.send(200, {})
            if path == "/auth/v1/invite":
                return self.send(200, {"id": "new"})
            if path == "/auth/v1/resend":
                return self.send(500, {"msg": "Error sending confirmation email"})
            if path == "/auth/v1/admin/users" and self.command == "GET":
                page, per = int(q["page"]), int(q["per_page"])
                return self.send(200, {"users": fake.auth_users[(page - 1) * per : page * per]})
            return self.send(204)

        do_GET = do_POST = do_PATCH = do_DELETE = handle_any

    return Handler


@pytest.fixture(scope="session")
def fake_server():
    fake = FakeSupabase()
    server = HTTPServer(("127.0.0.1", 0), _handler(fake))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    fake.url = f"http://127.0.0.1:{server.server_port}"
    yield fake
    server.shutdown()


@pytest.fixture()
def supabase(fake_server, monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", fake_server.url)
    monkeypatch.setenv("SUPABASE_SECRET_KEY", "secret")
    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY", "publishable")
    fake_server.reset()
    return fake_server


@pytest.fixture()
def client(supabase):
    from app import create_app

    return create_app().test_client()


@pytest.fixture()
def post_invite(client):
    def call(token, email):
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        response = client.post("/api/invitations", json={"email": email}, headers=headers)
        return response.status_code, (response.get_json() or {})

    return call
