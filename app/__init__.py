"""Flask application factory for the Vines Club Hub."""

from flask import Flask, jsonify, render_template


def create_app() -> Flask:
    app = Flask(__name__)

    @app.get("/")
    def home():
        return render_template("index.html")

    @app.get("/healthz")
    def healthcheck():
        return jsonify(status="ok", app="Vines Club Hub")

    return app
