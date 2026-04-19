import os
import re
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def generate_report(report_folder: str, file_name: str, analysis: dict) -> str:
    os.makedirs(report_folder, exist_ok=True)

    base_name = os.path.splitext(os.path.basename(file_name or "document"))[0]
    # Keep filesystem-safe report names only.
    safe_base = re.sub(r"[^A-Za-z0-9_-]", "_", base_name).strip("_") or "document"
    report_name = f"{safe_base}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.pdf"
    report_path = os.path.join(report_folder, report_name)

    c = canvas.Canvas(report_path, pagesize=A4)
    width, height = A4

    y = height - 40
    c.setFont("Helvetica-Bold", 16)
    c.drawString(40, y, "Explainable Document Forensics Report")

    y -= 28
    c.setFont("Helvetica", 11)
    c.drawString(40, y, f"File: {file_name}")
    y -= 18
    c.drawString(40, y, f"Status: {analysis.get('status')}")
    y -= 18
    c.drawString(40, y, f"Confidence: {analysis.get('confidence')}%")
    y -= 18
    c.drawString(40, y, f"Type: {analysis.get('forgery_type')}")
    y -= 24

    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, y, "Explanations:")
    y -= 18
    c.setFont("Helvetica", 10)
    for line in analysis.get("explanations", []):
        if y < 80:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 10)
        c.drawString(50, y, f"- {line[:110]}")
        y -= 15

    y -= 10
    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, y, "Suspicious Regions:")
    y -= 18
    c.setFont("Helvetica", 10)

    for region in analysis.get("suspicious_regions", [])[:20]:
        if y < 80:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 10)
        c.drawString(50, y, f"- BBox {region.get('bbox')} | score={region.get('score')}")
        y -= 15

    c.save()
    return report_name
