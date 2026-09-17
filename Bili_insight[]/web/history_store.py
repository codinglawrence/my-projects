"""历史记录持久化。

存储位置：%APPDATA%/BiliInsight/history.json
说明：跨会话保存提取会话，最多保留 50 条（新的在前）。不含任何密钥信息。
"""
from __future__ import annotations

import json
import os
import threading
from pathlib import Path
from typing import Any, Dict, List

MAX_HISTORY = 50


class HistoryStore:
    """历史记录存储（JSON 文件，线程安全）。"""

    def __init__(self) -> None:
        base = os.environ.get("APPDATA") or os.path.expanduser("~/.biliinsight")
        self._path = Path(base) / "BiliInsight" / "history.json"
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()

    def list(self) -> List[Dict[str, Any]]:
        if not self._path.exists():
            return []
        try:
            with open(self._path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data if isinstance(data, list) else []
        except Exception:
            return []

    def add(self, session: Dict[str, Any]) -> None:
        """追加一条会话（按 id 去重，新的在前），并裁剪到上限。"""
        with self._lock:
            items = self.list()
            items = [s for s in items if s.get("id") != session.get("id")]
            items.insert(0, session)
            items = items[:MAX_HISTORY]
            with open(self._path, "w", encoding="utf-8") as f:
                json.dump(items, f, ensure_ascii=False, indent=2)

    def clear(self) -> None:
        with self._lock:
            with open(self._path, "w", encoding="utf-8") as f:
                json.dump([], f, ensure_ascii=False)
