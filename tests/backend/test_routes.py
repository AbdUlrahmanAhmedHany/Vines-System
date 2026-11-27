import pytest


def test_health_check(client):
    body = client.get("/healthz").get_json()
    assert body["status"] == "ok"


def test_public_config_exposes_only_public_values(client):
    response = client.get("/api/config")
    text = response.get_data(as_text=True)
    assert response.status_code == 200
    assert "publishable" in text
    assert "secret" not in text.replace("publishable", "")


@pytest.mark.parametrize("path", ["/", "/login"])
def test_app_shell_is_served(client, path):
    response = client.get(path)
    assert response.status_code == 200 and b"<html" in response.data.lower()


@pytest.mark.parametrize(
    "path",
    ["/static/../__init__.py", "/static/%2e%2e/__init__.py", "/static/..%5c__init__.py", "/static//etc/passwd", "/static/./js/app.js"],
)
def test_static_route_blocks_path_traversal(client, path):
    assert client.get(path).status_code in (308, 400, 404)


def test_static_assets_are_served(client):
    assert client.get("/static/css/styles.css").status_code == 200


@pytest.mark.parametrize("route", ["/api/invitations", "/api/remove-member", "/api/activate-invited-member"])
def test_admin_routes_reject_anonymous_callers(client, route):
    assert client.post(route, json={}).status_code in (401, 403)
