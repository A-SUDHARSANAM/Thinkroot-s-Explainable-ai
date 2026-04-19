import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.exceptions import HTTPException, RequestEntityTooLarge

from .config import Config
from .routes import api_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(app.config["REPORT_FOLDER"], exist_ok=True)
    os.makedirs(app.config["DEMO_FOLDER"], exist_ok=True)

    CORS(app)
    app.register_blueprint(api_bp, url_prefix="/api")

    @app.get("/")
    def index():
        return jsonify(
            {
                "service": "Explainable Document Forensics AI Backend",
                "status": "running",
                "api_base": "/api",
                "endpoints": [
                    "POST /api/upload",
                    "POST /api/analyze",
                    "POST /api/verify",
                    "POST /api/compare",
                    "GET /api/history",
                    "DELETE /api/history",
                ],
            }
        )

    @app.get("/health")
    def health():
        return jsonify({"ok": True})

    @app.get("/uploads/<path:filename>")
    def serve_upload(filename: str):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    @app.get("/reports/<path:filename>")
    def serve_report(filename: str):
        return send_from_directory(app.config["REPORT_FOLDER"], filename)

    @app.get("/demo/<path:filename>")
    def serve_demo(filename: str):
        return send_from_directory(app.config["DEMO_FOLDER"], filename)

    @app.errorhandler(RequestEntityTooLarge)
    def file_too_large(_error):
        return jsonify({"error": "File is too large. Maximum upload size is 10MB."}), 413

    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        # Keep API responses consistent for frontend error handling.
        return jsonify({"error": error.description or "Request failed."}), error.code

    return app
