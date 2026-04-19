import os


class Config:
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    REPORT_FOLDER = os.path.join(BASE_DIR, "reports")
    DEMO_FOLDER = os.path.join(BASE_DIR, "demo_samples")
    HISTORY_FILE = os.path.join(BASE_DIR, "history.json")
    ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "pdf"}
