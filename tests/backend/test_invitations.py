from conftest import GHOST, LAYLA


def test_invitation_needs_sign_in(supabase, post_invite):
    assert post_invite(None, GHOST["email"])[0] == 401


def test_invitation_rejects_non_admin(supabase, post_invite):
    assert post_invite("layla-token", GHOST["email"])[0] == 403


def test_admin_invites_pending_member(supabase, post_invite):
    status, body = post_invite("admin-token", GHOST["email"])
    assert status == 202 and body["ok"] is True
    assert any(call.startswith("POST /rest/v1/invitations") for call in supabase.log)
    assert "POST /auth/v1/invite" in supabase.calls()


def test_already_active_member_is_a_conflict(supabase, post_invite):
    assert post_invite("admin-token", LAYLA["email"])[0] == 409


def test_unknown_profile_is_not_found(supabase, post_invite):
    assert post_invite("admin-token", "nobody@vines.test")[0] == 404


def test_email_provider_failure_returns_502_and_cleans_up(supabase, post_invite):
    supabase.reset(fail="POST /auth/v1/invite")
    status, body = post_invite("admin-token", GHOST["email"])
    assert status == 502 and "boom" in body["error"]
    assert any(call.startswith("DELETE /rest/v1/invitations") for call in supabase.log)


def test_resend_replaces_a_stale_login_and_invites_again(supabase, post_invite):
    supabase.login_exists = True
    supabase.auth_users = [{"id": "stale-1", "email": GHOST["email"]}]
    status, body = post_invite("admin-token", GHOST["email"])
    assert status == 202 and body["ok"] is True
    assert "DELETE /auth/v1/admin/users/stale-1" in supabase.calls()
    assert supabase.calls().count("POST /auth/v1/invite") == 2
