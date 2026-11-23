"""Flask application factory for the Vines Club Hub."""

from pathlib import Path

from flask import Flask, Response, jsonify, render_template, request, send_from_directory


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

    @app.get("/")
    def home():
        asset = _worker_asset_response("templates/index.html")
        if asset is not None:
            return asset
        return render_template("index.html")

    @app.get("/static/<path:filename>")
    def static_files(filename: str):
        asset = _worker_asset_response(f"static/{filename}")
        if asset is not None:
            return asset
        return send_from_directory(STATIC_DIR, filename)

    @app.get("/healthz")
    def healthcheck():
        return jsonify(status="ok", app="Vines Club Hub")

    return app
