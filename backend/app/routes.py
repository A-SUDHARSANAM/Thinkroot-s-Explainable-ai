import os
import shutil
from datetime import datetime

from flask import Blueprint, current_app, jsonify, request

from .services.forensics_service import analyze_document, compare_documents, verify_document
from .services.history_store import HistoryStore
from .services.report_service import generate_report
from .utils.file_utils import allowed_file, safe_unique_filename

api_bp = Blueprint("api", __name__)


def _history() -> HistoryStore:
    return HistoryStore(current_app.config["HISTORY_FILE"])


@api_bp.post("/upload")
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    if not allowed_file(file.filename, current_app.config["ALLOWED_EXTENSIONS"]):
        return jsonify({"error": "Invalid file type. Use JPG, PNG, or PDF."}), 400

    saved_name, file_id = safe_unique_filename(file.filename)
    target_path = os.path.join(current_app.config["UPLOAD_FOLDER"], saved_name)
    file.save(target_path)

    return jsonify(
        {
            "file_id": file_id,
            "stored_name": saved_name,
            "file_name": file.filename,
            "preview_url": f"/uploads/{saved_name}",
            "uploaded_at": datetime.utcnow().isoformat() + "Z",
        }
    )


@api_bp.get("/demo-files")
def demo_files():
    files = []
    for name in os.listdir(current_app.config["DEMO_FOLDER"]):
        if allowed_file(name, current_app.config["ALLOWED_EXTENSIONS"]):
            files.append({"name": name, "url": f"/demo/{name}"})
    return jsonify({"files": sorted(files, key=lambda x: x["name"])})


@api_bp.post("/upload-demo")
def upload_demo():
    body = request.get_json(silent=True) or {}
    name = body.get("name", "")

    if not name:
        return jsonify({"error": "Missing demo file name."}), 400

    source = os.path.join(current_app.config["DEMO_FOLDER"], os.path.basename(name))
    if not os.path.exists(source):
        return jsonify({"error": "Demo file not found."}), 404

    saved_name, file_id = safe_unique_filename(name)
    target = os.path.join(current_app.config["UPLOAD_FOLDER"], saved_name)
    shutil.copyfile(source, target)

    return jsonify(
        {
            "file_id": file_id,
            "stored_name": saved_name,
            "file_name": os.path.basename(name),
            "preview_url": f"/uploads/{saved_name}",
            "uploaded_at": datetime.utcnow().isoformat() + "Z",
        }
    )


@api_bp.post("/analyze")
def analyze_file():
    body = request.get_json(silent=True) or {}
    stored_name = body.get("stored_name")
    file_name = body.get("file_name", stored_name)

    if not stored_name:
        return jsonify({"error": "stored_name is required."}), 400

    path = os.path.join(current_app.config["UPLOAD_FOLDER"], stored_name)
    if not os.path.exists(path):
        return jsonify({"error": "Uploaded file not found."}), 404

    try:
        analysis = analyze_document(path)
    except Exception as exc:
        return jsonify({"error": f"Analysis failed: {str(exc)}"}), 500

    report_url = None
    try:
        report_name = generate_report(current_app.config["REPORT_FOLDER"], file_name, analysis)
        report_url = f"/reports/{report_name}"
    except Exception as exc:
        current_app.logger.exception("Report generation failed during analyze: %s", exc)

    history_status = "Flagged" if analysis["is_forgery"] else "Accepted"
    if analysis["confidence"] > 90:
        history_status = "Rejected"

    _history().add(
        {
            "file_name": file_name,
            "stored_name": stored_name,
            "status": history_status,
            "processing_time_ms": analysis["processing_time_ms"],
            "confidence": analysis["confidence"],
        }
    )

    return jsonify(
        {
            **analysis,
            "report_url": report_url,
            "preview_url": f"/uploads/{stored_name}",
        }
    )


@api_bp.post("/compare")
def compare_files():
    body = request.get_json(silent=True) or {}
    file_a = body.get("stored_name_a")
    file_b = body.get("stored_name_b")

    if not file_a or not file_b:
        return jsonify({"error": "stored_name_a and stored_name_b are required."}), 400

    path_a = os.path.join(current_app.config["UPLOAD_FOLDER"], file_a)
    path_b = os.path.join(current_app.config["UPLOAD_FOLDER"], file_b)

    if not os.path.exists(path_a) or not os.path.exists(path_b):
        return jsonify({"error": "One or both files are missing."}), 404

    try:
        result = compare_documents(path_a, path_b)
    except Exception as exc:
        return jsonify({"error": f"Comparison failed: {str(exc)}"}), 500

    return jsonify(result)


@api_bp.post("/verify")
def verify_file():
    body = request.get_json(silent=True) or {}
    stored_name = body.get("stored_name")
    file_name = body.get("file_name", stored_name)

    if not stored_name:
        return jsonify({"error": "stored_name is required."}), 400

    path = os.path.join(current_app.config["UPLOAD_FOLDER"], stored_name)
    if not os.path.exists(path):
        return jsonify({"error": "Uploaded file not found."}), 404

    try:
        verification = verify_document(path)
    except Exception as exc:
        return jsonify({"error": f"Verification failed: {str(exc)}"}), 500

    report_url = None
    try:
        report_name = generate_report(current_app.config["REPORT_FOLDER"], file_name, verification)
        report_url = f"/reports/{report_name}"
    except Exception as exc:
        current_app.logger.exception("Report generation failed during verify: %s", exc)

    _history().add(
        {
            "file_name": file_name,
            "stored_name": stored_name,
            "status": verification["status"],
            "processing_time_ms": verification["processing_time_ms"],
            "confidence": verification["confidence"],
            "entry_type": "verification",
        }
    )

    return jsonify(
        {
            **verification,
            "report_url": report_url,
            "preview_url": f"/uploads/{stored_name}",
        }
    )


@api_bp.get("/history")
def get_history():
    search = request.args.get("search")
    entries = _history().all(search=search)
    return jsonify({"entries": entries})


@api_bp.delete("/history")
def clear_history():
    _history().clear()
    return jsonify({"message": "History cleared."})
