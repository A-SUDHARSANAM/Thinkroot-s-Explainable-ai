import os
import uuid
from typing import Tuple


def allowed_file(filename: str, allowed_extensions: set[str]) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions


def safe_unique_filename(filename: str) -> Tuple[str, str]:
    ext = filename.rsplit(".", 1)[1].lower()
    uid = uuid.uuid4().hex
    generated = f"{uid}.{ext}"
    return generated, uid


def is_pdf(path: str) -> bool:
    return os.path.splitext(path)[1].lower() == ".pdf"
