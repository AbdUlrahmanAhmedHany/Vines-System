"""Cloudflare Workers entry point for the Flask application."""

from workers import wsgi

from app import create_app


Default = wsgi.entrypoint(create_app())
