import json
import os
from datetime import datetime
from typing import Any


class HistoryStore:
    def __init__(self, history_file: str):
        self.history_file = history_file
        self._ensure_file()

    def _ensure_file(self) -> None:
        if not os.path.exists(self.history_file):
            with open(self.history_file, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _read(self) -> list[dict[str, Any]]:
        self._ensure_file()
        with open(self.history_file, "r", encoding="utf-8") as f:
            return json.load(f)

    def _write(self, entries: list[dict[str, Any]]) -> None:
        with open(self.history_file, "w", encoding="utf-8") as f:
            json.dump(entries, f, indent=2)

    def add(self, item: dict[str, Any]) -> None:
        entries = self._read()
        item["timestamp"] = datetime.utcnow().isoformat() + "Z"
        entries.insert(0, item)
        self._write(entries)

    def all(self, search: str | None = None) -> list[dict[str, Any]]:
        entries = self._read()
        if not search:
            return entries
        needle = search.lower()
        return [e for e in entries if needle in e.get("file_name", "").lower()]

    def clear(self) -> None:
        self._write([])
