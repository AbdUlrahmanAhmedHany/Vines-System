"""Flask application factory for the Vines Club Hub."""

from pathlib import Path
import json
import hashlib
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

from flask import Flask, Response, abort, jsonify, render_template, request, send_from_directory


STATIC_DIR = Path(__file__).parent / "static"


def _worker_asset_response(path: str) -> Response | None:
    """Fetch a file from the Workers Static Assets binding when deployed there."""
    workers_env = request.environ.get("workers.env")
    if workers_env is None:
        return None

    from pyodide.ffi import run_sync

    asset = run_sync(workers_env.ASSETS.fetch(f"https://assets.local/{path}"))
    body = run_sync(asset.bytes())
    response = Response(body, status=asset.status)
    content_type = asset.headers.get("content-type")
    if content_type:
        response.headers["Content-Type"] = content_type
    return response


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)

    def app_page():
        asset = _worker_asset_response("templates/index.html")
        if asset is not None:
            return asset
        return render_template("index.html")

    # "/" is the hub and "/login" is the sign-in page. Both serve the same shell;
    # the page decides which screen to show once it has checked the session.
    @app.get("/")
    def home():
        return app_page()

    @app.get("/login")
    def login_page():
        return app_page()

    @app.get("/static/<path:filename>")
    def static_files(filename: str):
        # The Worker fetches this path from the assets store, where "..", "%2e"
        # and backslashes could climb out of /static (for example to the backend
        # source), so only plain relative file paths are accepted.
        if (
            not filename
            or "%" in filename
            or "\\" in filename
            or "\x00" in filename
            or any(part in ("", ".", "..") for part in filename.split("/"))
        ):
            abort(404)
        asset = _worker_asset_response(f"static/{filename}")
        if asset is not None:
            return asset
        return send_from_directory(STATIC_DIR, filename)

    @app.get("/healthz")
    def healthcheck():
        return jsonify(status="ok", app="Vines Club Hub")

    @app.get("/api/config")
    def public_config():
        workers_env = request.environ.get("workers.env")

        def setting(name: str) -> str:
            if workers_env is not None:
                value = getattr(workers_env, name, None)
                if value:
                    return str(value)
            return os.environ.get(name, "")

        return jsonify(
            supabaseUrl=setting("SUPABASE_URL"),
            supabasePublishableKey=setting("SUPABASE_PUBLISHABLE_KEY"),
        )

    def worker_setting(name: str) -> str:
        workers_env = request.environ.get("workers.env")
        if workers_env is not None:
            value = getattr(workers_env, name, None)
            if value:
                return str(value)
        return os.environ.get(name, "")

    def upstream(path: str, method: str, key: str, bearer: str, body=None):
        base_url = worker_setting("SUPABASE_URL").rstrip("/")
        if not base_url or not key:
            raise RuntimeError("Supabase server settings are not configured.")
        headers = {
            "apikey": key,
            "Authorization": f"Bearer {bearer or key}",
            "Accept": "application/json",
        }
        payload = None
        if body is not None:
            headers["Content-Type"] = "application/json"
            payload = json.dumps(body).encode("utf-8")
        url = f"{base_url}/{path}"
        workers_env = request.environ.get("workers.env")
        if workers_env is not None:
            from js import Object, fetch
            from pyodide.ffi import run_sync, to_js

            options = {"method": method, "headers": headers}
            if payload is not None:
                options["body"] = payload.decode("utf-8")
            response = run_sync(
                fetch(url, to_js(options, dict_converter=Object.fromEntries))
            )
            text = run_sync(response.text())
            try:
                data = json.loads(text) if text else None
            except ValueError:
                data = {"message": "Supabase returned an unreadable response."}
            return int(response.status), data

        req = Request(url, data=payload, headers=headers, method=method)
        try:
            with urlopen(req, timeout=15) as response:
                text = response.read().decode("utf-8")
                return response.status, json.loads(text) if text else None
        except HTTPError as error:
            text = error.read().decode("utf-8", errors="replace")
            try:
                data = json.loads(text) if text else None
            except ValueError:
                data = {"message": "Supabase rejected the request."}
            return error.code, data
        except (URLError, TimeoutError) as error:
            raise RuntimeError("Could not reach Supabase.") from error

    def authenticated_user(secret: str):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None, None
        token = auth_header[7:].strip()
        if not token:
            return None, None
        status, user = upstream("auth/v1/user", "GET", secret, token)
        if status != 200 or not isinstance(user, dict) or not user.get("email"):
            return None, None
        return token, user

    @app.post("/api/invitations")
    def send_member_invitation():
        secret = worker_setting("SUPABASE_SECRET_KEY")
        if not secret:
            return jsonify(error="Invitation sending is not configured on the server."), 503
        try:
            token, user = authenticated_user(secret)
            if not token:
                return jsonify(error="Sign in again before sending an invitation."), 401
            email = str((request.get_json(silent=True) or {}).get("email", "")).strip().lower()
            if not email or "@" not in email:
                return jsonify(error="Enter a valid member email address."), 400

            # Verify the signed-in caller independently from the member being invited.
            # Looking up the target email here would never find the admin when inviting
            # somebody else, causing valid administrators to be rejected.
            admin_email = str(user["email"]).strip().lower()
            admin_query = urlencode({
                "select": "id,email,is_club_admin,status",
                "email": f"ilike.{admin_email}",
                "limit": "2",
            })
            status, admin_profiles = upstream(
                f"rest/v1/members?{admin_query}", "GET", secret, secret
            )
            if status != 200 or not isinstance(admin_profiles, list):
                return jsonify(error="Could not verify the system admin profile."), 502
            admins = [
                profile for profile in admin_profiles
                if str(profile.get("email", "")).strip().lower() == admin_email
                and profile.get("is_club_admin") is True
                and profile.get("status") == "Active"
            ]
            if len(admins) != 1:
                return jsonify(error="Only the active system admin can send invitations."), 403


            query = urlencode({"select": "id,email,status", "email": f"ilike.{email}", "limit": "2"})
            status, targets = upstream(f"rest/v1/members?{query}", "GET", secret, secret)
            if status != 200 or not isinstance(targets, list):
                return jsonify(error="Could not verify the target member profile."), 502
            targets = [m for m in targets if str(m.get("email", "")).lower() == email]
            if len(targets) != 1:
                return jsonify(error="Create exactly one member profile for this email first."), 404
            if targets[0].get("status") != "Pending invitation":
                return jsonify(error="This profile is not waiting for an invitation."), 409

            invite_hash = hashlib.sha256(secrets.token_bytes(32)).hexdigest()
            expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
            invite_status, _ = upstream(
                "rest/v1/invitations",
                "POST",
                secret,
                secret,
                {
                    "member_id": targets[0]["id"],
                    "token_hash": invite_hash,
                    "expires_at": expires_at,
                    "created_by": admins[0]["id"],
                },
            )
            if invite_status not in (200, 201, 204):
                return jsonify(error="Could not prepare the invitation record."), 502

            redirect_to = f"{request.url_root.rstrip('/')}/?flow=invite"
            invite_path = "auth/v1/invite?" + urlencode({"redirect_to": redirect_to})
            invite_status, result = upstream(
                invite_path, "POST", secret, secret, {"email": email}
            )
            if invite_status not in (200, 201):
                invite_status, result = upstream(
                    "auth/v1/resend",
                    "POST",
                    secret,
                    secret,
                    {
                        "type": "signup",
                        "email": email,
                        "options": {"emailRedirectTo": redirect_to},
                    },
                )
            if invite_status not in (200, 201):
                delete_query = urlencode({"token_hash": f"eq.{invite_hash}"})
                upstream(
                    f"rest/v1/invitations?{delete_query}",
                    "DELETE",
                    secret,
                    secret,
                )
                reason = ""
                if isinstance(result, dict):
                    reason = str(
                        result.get("msg") or result.get("error_description") or result.get("message") or ""
                    ).strip()[:160]
                detail = f" ({reason})" if reason else ""
                return jsonify(
                    error=f"Supabase could not send the invitation email{detail}. Check the Auth email (SMTP) settings in Supabase."
                ), 502
            return jsonify(ok=True, email=email), 202
        except RuntimeError as error:
            return jsonify(error=str(error)), 503

    @app.after_request
    def security_headers(response: Response) -> Response:
        # Only this site's own scripts may run, and the page may only talk to
        # this site and the configured Supabase project.
        connect = ["'self'"]
        images = ["'self'", "data:"]
        parsed = urlparse(worker_setting("SUPABASE_URL").strip())
        if parsed.scheme in ("http", "https") and parsed.netloc:
            connect.append(f"{parsed.scheme}://{parsed.netloc}")
            # Profile photos are served from the project's public storage bucket.
            images.append(f"{parsed.scheme}://{parsed.netloc}")
        policy = "; ".join(
            [
                "default-src 'self'",
                "script-src 'self'",
                "style-src 'self'",
                "style-src-attr 'unsafe-inline'",
                f"img-src {' '.join(images)}",
                "font-src 'self'",
                f"connect-src {' '.join(connect)}",
                "object-src 'none'",
                "base-uri 'none'",
                "form-action 'self'",
                "frame-ancestors 'none'",
            ]
        )
        headers = response.headers
        headers.setdefault("Content-Security-Policy", policy)
        headers.setdefault("X-Content-Type-Options", "nosniff")
        headers.setdefault("X-Frame-Options", "DENY")
        headers.setdefault("Referrer-Policy", "no-referrer")
        headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        headers.setdefault(
            "Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()"
        )
        if request.is_secure or request.headers.get("X-Forwarded-Proto", "") == "https":
            headers.setdefault("Strict-Transport-Security", "max-age=31536000")
        # Pages and API answers are never stored, so signing out and pressing
        # Back cannot bring a cached hub or response back.
        if response.mimetype == "text/html" or request.path.startswith("/api/"):
            headers["Cache-Control"] = "no-store"
        return response

    @app.post("/api/remove-member")
    def remove_member():
        """Remove a member from the club: login, profile and what depends on it.

        Only the active system admin may call this. It cannot remove the admin
        themselves or any other system admin.
        """
        secret = worker_setting("SUPABASE_SECRET_KEY")
        if not secret:
            return jsonify(error="Member removal is not configured on the server."), 503
        try:
            token, user = authenticated_user(secret)
            if not token:
                return jsonify(error="Sign in again before removing a member."), 401
            try:
                member_id = str(uuid.UUID(str((request.get_json(silent=True) or {}).get("memberId", "")).strip()))
            except ValueError:
                return jsonify(error="Choose a member to remove."), 400

            admin_email = str(user["email"]).lower()
            query = urlencode({"select": "id,email,is_club_admin,status", "email": f"ilike.{admin_email}", "limit": "2"})
            status, profiles = upstream(f"rest/v1/members?{query}", "GET", secret, secret)
            if status != 200 or not isinstance(profiles, list):
                return jsonify(error="Could not verify the member profile."), 502
            admins = [
                profile for profile in profiles
                if str(profile.get("email", "")).lower() == admin_email
                and profile.get("is_club_admin") is True
                and profile.get("status") == "Active"
            ]
            if not admins:
                return jsonify(error="Only the active system admin can remove members."), 403
            admin_id = admins[0]["id"]

            query = urlencode({"select": "id,email,is_club_admin", "id": f"eq.{member_id}", "limit": "1"})
            status, targets = upstream(f"rest/v1/members?{query}", "GET", secret, secret)
            if status != 200 or not isinstance(targets, list):
                return jsonify(error="Could not verify the member to remove."), 502
            if not targets:
                return jsonify(error="This member no longer exists."), 404
            target = targets[0]
            if target["id"] == admin_id:
                return jsonify(error="You cannot remove yourself."), 409
            if target.get("is_club_admin") is True:
                return jsonify(error="Revoke this member's system access before removing them."), 409

            # 1. Delete the login first so the person loses access straight away.
            email = str(target.get("email", "")).strip().lower()
            auth_id = None
            for page in range(1, 21):
                status, listing = upstream(
                    f"auth/v1/admin/users?page={page}&per_page=200", "GET", secret, secret
                )
                if status != 200 or not isinstance(listing, dict):
                    return jsonify(error="Could not look up this member's login. Nothing was removed."), 502
                users = listing.get("users") or []
                match = next((u for u in users if str(u.get("email", "")).lower() == email), None)
                if match:
                    auth_id = match.get("id")
                    break
                if len(users) < 200:
                    break
            if auth_id:
                status, _ = upstream(f"auth/v1/admin/users/{auth_id}", "DELETE", secret, secret)
                if status not in (200, 204, 404):
                    return jsonify(error="Could not delete this member's login. Nothing was removed."), 502

            # 2. Clear what would block deleting the profile. Their own tasks and
            #    updates are deleted; records they created for others move to the admin.
            by_member = lambda column: urlencode({column: f"eq.{member_id}"})
            steps = [
                ("tasks assigned to them", "DELETE", f"rest/v1/tasks?{by_member('assignee_id')}", None),
                ("their progress updates", "DELETE", f"rest/v1/task_updates?{by_member('author_id')}", None),
                ("tasks they assigned", "PATCH", f"rest/v1/tasks?{by_member('assigned_by')}", {"assigned_by": admin_id}),
                ("project allocations they made", "PATCH", f"rest/v1/project_assignments?{by_member('allocated_by')}", {"allocated_by": admin_id}),
                ("invitations they created", "PATCH", f"rest/v1/invitations?{by_member('created_by')}", {"created_by": admin_id}),
                ("their profile", "DELETE", f"rest/v1/members?{by_member('id')}", None),
            ]
            for label, method, path, body in steps:
                status, _ = upstream(path, method, secret, secret, body)
                if status not in (200, 204):
                    return jsonify(error=f"Could not remove {label}. Their login was already deleted; try removing them again."), 502
            return jsonify(ok=True), 200
        except RuntimeError as error:
            return jsonify(error=str(error)), 503

    @app.post("/api/activate-invited-member")
    def activate_invited_member():
        secret = worker_setting("SUPABASE_SECRET_KEY")
        if not secret:
            return jsonify(error="Account activation is not configured on the server."), 503
        try:
            token, user = authenticated_user(secret)
            if not token:
                return jsonify(error="Open your invitation link and sign in again."), 401
            email = str(user.get("email", "")).strip().lower()
            query = urlencode({"select": "id,status", "email": f"ilike.{email}", "limit": "2"})
            status, profiles = upstream(f"rest/v1/members?{query}", "GET", secret, secret)
            if status != 200 or not isinstance(profiles, list):
                return jsonify(error="Could not verify your member profile."), 502
            profiles = [m for m in profiles if m.get("status") == "Pending invitation"]
            if len(profiles) != 1:
                return jsonify(error="No unique pending member profile matches this account."), 409
            member_id = profiles[0]["id"]
            now = datetime.now(timezone.utc).isoformat()
            query = urlencode(
                {
                    "select": "token_hash",
                    "member_id": f"eq.{member_id}",
                    "accepted_at": "is.null",
                    "expires_at": f"gt.{now}",
                    "order": "created_at.desc",
                    "limit": "1",
                }
            )
            status, invitations = upstream(
                f"rest/v1/invitations?{query}", "GET", secret, secret
            )
            if status != 200 or not isinstance(invitations, list) or not invitations:
                return jsonify(error="This invitation is missing or expired. Ask the system admin for a new one."), 403
            query = urlencode({"id": f"eq.{member_id}", "status": "eq.Pending invitation"})
            status, _ = upstream(
                f"rest/v1/members?{query}",
                "PATCH",
                secret,
                secret,
                {"status": "Active"},
            )
            if status not in (200, 204):
                return jsonify(error="Could not activate the invited member."), 502
            token_hash = invitations[0]["token_hash"]
            query = urlencode({"token_hash": f"eq.{token_hash}"})
            upstream(
                f"rest/v1/invitations?{query}",
                "PATCH",
                secret,
                secret,
                {"accepted_at": now},
            )
            return jsonify(ok=True), 200
        except RuntimeError as error:
            return jsonify(error=str(error)), 503

    return app
