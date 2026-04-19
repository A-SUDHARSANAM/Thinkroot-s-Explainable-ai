from typing import Any

import easyocr
import numpy as np


_reader: easyocr.Reader | None = None


def get_reader() -> easyocr.Reader:
    global _reader
    if _reader is None:
        _reader = easyocr.Reader(["en"], gpu=False)
    return _reader


def extract_text_regions(image_rgb: np.ndarray) -> list[dict[str, Any]]:
    reader = get_reader()
    results = reader.readtext(image_rgb)
    parsed = []
    for bbox, text, confidence in results:
        xs = [point[0] for point in bbox]
        ys = [point[1] for point in bbox]
        x1, y1, x2, y2 = int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys))
        parsed.append(
            {
                "bbox": [x1, y1, x2, y2],
                "text": text,
                "confidence": float(confidence),
            }
        )
    return parsed
