import io
import os
import time
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Any

import cv2
import fitz
import numpy as np
from PIL import Image

from .ocr_service import extract_text_regions


@dataclass
class LoadedDoc:
    image_bgr: np.ndarray
    image_rgb: np.ndarray
    source_type: str


def load_document(path: str) -> LoadedDoc:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        doc = fitz.open(path)
        page = doc.load_page(0)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
        image_rgb = np.array(img)
        image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
        return LoadedDoc(image_bgr=image_bgr, image_rgb=image_rgb, source_type="pdf")

    image_bgr = cv2.imread(path)
    if image_bgr is None:
        raise ValueError("Unable to read the uploaded file.")
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    return LoadedDoc(image_bgr=image_bgr, image_rgb=image_rgb, source_type="image")


def _compute_ela_map(image_bgr: np.ndarray) -> np.ndarray:
    encode_ok, encoded = cv2.imencode(".jpg", image_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
    if not encode_ok:
        return np.zeros(image_bgr.shape[:2], dtype=np.uint8)
    recompressed = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
    diff = cv2.absdiff(image_bgr, recompressed)
    ela_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    ela_norm = cv2.normalize(ela_gray, None, 0, 255, cv2.NORM_MINMAX)
    return ela_norm


def _noise_inconsistency_map(gray: np.ndarray) -> np.ndarray:
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    residual = cv2.absdiff(gray, blur)
    return cv2.normalize(residual, None, 0, 255, cv2.NORM_MINMAX)


def _is_likely_non_text_region(bbox: list[int], width: int, height: int) -> bool:
    x1, y1, x2, y2 = bbox
    region_w = max(1, x2 - x1)
    region_h = max(1, y2 - y1)
    area_ratio = (region_w * region_h) / float(width * height)
    aspect = region_w / float(region_h)

    near_corner = (x1 < width * 0.2 and y1 < height * 0.2) or (x2 > width * 0.8 and y1 < height * 0.2)
    likely_qr = 0.8 <= aspect <= 1.2 and area_ratio < 0.1
    likely_logo = near_corner and area_ratio < 0.15
    return likely_qr or likely_logo


def _region_score(region: np.ndarray) -> float:
    if region.size == 0:
        return 0.0
    return float(np.mean(region) / 255.0)


def analyze_document(path: str, threshold: float = 0.75) -> dict[str, Any]:
    start = time.time()
    loaded = load_document(path)
    image = loaded.image_bgr
    image_rgb = loaded.image_rgb
    h, w = image.shape[:2]

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 80, 160)
    ela_map = _compute_ela_map(image)
    noise_map = _noise_inconsistency_map(gray)

    ocr_regions = extract_text_regions(image_rgb)

    suspicious_regions = []
    reasons = []
    scores = []

    heights = [max(1, r["bbox"][3] - r["bbox"][1]) for r in ocr_regions] or [1]
    baseline_height = float(np.median(heights))

    prev_x2 = None
    spacing_anomalies = 0

    for idx, region in enumerate(ocr_regions):
        x1, y1, x2, y2 = region["bbox"]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)

        if _is_likely_non_text_region([x1, y1, x2, y2], w, h):
            continue

        ela_score = _region_score(ela_map[y1:y2, x1:x2])
        edge_score = _region_score(edges[y1:y2, x1:x2])
        noise_score = _region_score(noise_map[y1:y2, x1:x2])

        height = max(1, y2 - y1)
        font_inconsistency = min(1.0, abs(height - baseline_height) / max(1.0, baseline_height))

        spacing_score = 0.0
        if prev_x2 is not None:
            gap = max(0, x1 - prev_x2)
            if gap > baseline_height * 1.5:
                spacing_score = min(1.0, gap / (baseline_height * 5.0))
                spacing_anomalies += 1
        prev_x2 = x2

        combined = (ela_score * 0.35) + (edge_score * 0.2) + (noise_score * 0.2) + (font_inconsistency * 0.15) + (spacing_score * 0.1)

        if combined > 0.55:
            text = region["text"][:50]
            suspicious_regions.append(
                {
                    "bbox": [x1, y1, x2, y2],
                    "score": round(combined, 3),
                    "snippet": text,
                }
            )

            if font_inconsistency > 0.4:
                reasons.append(f"Font mismatch detected near text: '{text}'")
            if spacing_score > 0.3:
                reasons.append(f"Irregular spacing detected near text: '{text}'")
            if ela_score > 0.45:
                reasons.append(f"Compression artifact anomaly in text region: '{text}'")

        scores.append(combined)

    overall_score = float(np.clip(np.mean(scores) if scores else 0.2, 0.0, 1.0))

    if spacing_anomalies > 2:
        overall_score = min(1.0, overall_score + 0.08)

    forgery_detected = overall_score > threshold
    status = "Forgery Detected" if forgery_detected else "No Forgery Detected"
    forgery_type = "text manipulation" if forgery_detected else "none"

    if not reasons:
        reasons = ["No significant forgery indicators were found in OCR text regions."]

    return {
        "status": status,
        "confidence": round(overall_score * 100, 2),
        "is_forgery": forgery_detected,
        "forgery_type": forgery_type,
        "explanations": reasons[:6],
        "suspicious_regions": suspicious_regions,
        "processing_steps": ["Preprocessing", "OCR", "Detection", "Explanation"],
        "processing_time_ms": int((time.time() - start) * 1000),
        "ocr_regions": len(ocr_regions),
    }


def _extract_text_string(path: str) -> str:
    loaded = load_document(path)
    regions = extract_text_regions(loaded.image_rgb)
    text = " ".join([r["text"] for r in regions])
    return " ".join(text.split())


def compare_documents(path_a: str, path_b: str) -> dict[str, Any]:
    start = time.time()
    doc_a = load_document(path_a)
    doc_b = load_document(path_b)

    img_a = doc_a.image_bgr
    img_b = cv2.resize(doc_b.image_bgr, (img_a.shape[1], img_a.shape[0]))

    diff = cv2.absdiff(img_a, img_b)
    gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 35, 255, cv2.THRESH_BINARY)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    diff_regions = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        if w * h < 120:
            continue
        diff_regions.append([x, y, x + w, y + h])

    changed_pixels = int(np.count_nonzero(thresh))
    total_pixels = int(thresh.size)
    pixel_match = max(0.0, 1.0 - (changed_pixels / max(1, total_pixels)))

    text_a = _extract_text_string(path_a)
    text_b = _extract_text_string(path_b)
    text_similarity = SequenceMatcher(a=text_a, b=text_b).ratio()

    match_percentage = round(((pixel_match * 0.55) + (text_similarity * 0.45)) * 100, 2)

    summary = "Documents are highly similar." if match_percentage > 90 else "Differences detected in content or structure."

    return {
        "match_percentage": match_percentage,
        "number_of_changes": len(diff_regions),
        "summary": summary,
        "difference_regions_doc1": diff_regions,
        "difference_regions_doc2": diff_regions,
        "pixel_match": round(pixel_match * 100, 2),
        "text_similarity": round(text_similarity * 100, 2),
        "processing_time_ms": int((time.time() - start) * 1000),
    }


def _line_group_key(bbox: list[int], bucket_size: int = 24) -> int:
    return int(bbox[1] / max(1, bucket_size))


def _structure_and_text_checks(ocr_regions: list[dict[str, Any]]) -> tuple[list[str], dict[str, Any]]:
    issues: list[str] = []
    metrics = {
        "spacing_anomalies": 0,
        "alignment_mismatches": 0,
        "expected_sections_found": 0,
    }

    if not ocr_regions:
        issues.append("No OCR text regions detected, document structure could not be validated.")
        return issues, metrics

    sorted_regions = sorted(ocr_regions, key=lambda r: (r["bbox"][1], r["bbox"][0]))
    heights = [max(1, r["bbox"][3] - r["bbox"][1]) for r in sorted_regions]
    baseline_h = float(np.median(heights))

    prev_x2 = None
    prev_line = None
    for region in sorted_regions:
        bbox = region["bbox"]
        line_key = _line_group_key(bbox)
        x1, x2 = bbox[0], bbox[2]

        if prev_x2 is not None and prev_line == line_key:
            gap = max(0, x1 - prev_x2)
            if gap > baseline_h * 1.7:
                metrics["spacing_anomalies"] += 1
        prev_x2 = x2
        prev_line = line_key

    line_lefts: dict[int, list[int]] = {}
    for region in sorted_regions:
        lk = _line_group_key(region["bbox"])
        line_lefts.setdefault(lk, []).append(region["bbox"][0])

    representative_lefts = [int(np.median(v)) for v in line_lefts.values() if v]
    if len(representative_lefts) > 2:
        left_std = float(np.std(representative_lefts))
        if left_std > baseline_h * 0.8:
            metrics["alignment_mismatches"] = int(left_std / max(1.0, baseline_h * 0.5))

    joined_text = " ".join(r["text"].lower() for r in sorted_regions)
    expected_tokens = ["name", "title", "date", "id"]
    found = sum(1 for token in expected_tokens if token in joined_text)
    metrics["expected_sections_found"] = found

    if metrics["spacing_anomalies"] > 2:
        issues.append("Text consistency issue: irregular spacing detected across OCR fields.")
    if metrics["alignment_mismatches"] > 0:
        issues.append("Structure validation issue: field alignment appears inconsistent.")
    if found < 2:
        issues.append("Structure validation issue: expected sections like name/title/date are missing.")

    return issues, metrics


def verify_document(path: str, threshold: float = 0.75) -> dict[str, Any]:
    start = time.time()

    # Reuse existing detection pipeline instead of duplicating forgery logic.
    analysis = analyze_document(path, threshold=threshold)
    loaded = load_document(path)
    ocr_regions = extract_text_regions(loaded.image_rgb)

    issues, metrics = _structure_and_text_checks(ocr_regions)

    suspicious_pixels = analysis["confidence"] > 75 or len(analysis.get("suspicious_regions", [])) >= 2
    if suspicious_pixels:
        issues.append("Pixel-level anomaly check: suspicious manipulation evidence detected.")

    risk_score = analysis["confidence"] / 100.0
    risk_score += min(0.25, 0.05 * metrics["spacing_anomalies"])
    risk_score += min(0.2, 0.07 * metrics["alignment_mismatches"])
    if metrics["expected_sections_found"] < 2:
        risk_score += 0.15
    risk_score = float(np.clip(risk_score, 0.0, 1.0))

    if analysis["is_forgery"] or risk_score >= 0.78:
        verification_status = "Forged"
        confidence = round(risk_score * 100, 2)
    elif risk_score >= 0.45 or issues:
        verification_status = "Suspicious"
        confidence = round(max(risk_score, 0.55) * 100, 2)
    else:
        verification_status = "Verified"
        confidence = round((1.0 - risk_score) * 100, 2)

    if verification_status == "Verified":
        summary = "No inconsistencies found in text, structure, or pixel-level verification checks."
    elif verification_status == "Suspicious":
        summary = "Minor inconsistencies detected. Manual review is recommended before acceptance."
    else:
        summary = "Forgery indicators detected in text or structure with suspicious pixel-level manipulation."

    return {
        "status": verification_status,
        "badge": verification_status,
        "confidence": confidence,
        "summary": summary,
        "issues": issues[:8],
        "explanations": [summary] + issues[:5],
        "suspicious_regions": analysis.get("suspicious_regions", []) if verification_status != "Verified" else [],
        "processing_steps": ["Preprocessing", "OCR", "Detection", "Explanation"],
        "verification_details": {
            "text_consistency_checked": True,
            "alignment_checked": True,
            "expected_sections_checked": True,
            "pixel_check_checked": True,
            "ocr_regions": len(ocr_regions),
            "spacing_anomalies": metrics["spacing_anomalies"],
            "alignment_mismatches": metrics["alignment_mismatches"],
            "expected_sections_found": metrics["expected_sections_found"],
        },
        "forgery_type": analysis.get("forgery_type", "none"),
        "is_forgery": verification_status == "Forged",
        "processing_time_ms": int((time.time() - start) * 1000),
    }
