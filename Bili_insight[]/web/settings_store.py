"""用户偏好持久化。

存储位置：%APPDATA%/BiliInsight/prefs.json
说明：仅持久化非敏感偏好（provider / 温度 / 最大 token / 最大视频数 / 保存路径）。
API Key 不在此处，交由 KeyProvider 落系统凭据 / 加密文件（满足“不进 localStorage、不进前端代码”）。
"""
from __future__ import annotations

import json
import os
import threading
from pathlib import Path
from typing import Any, Dict

import config

# 偏好字段白名单（API Key 绝不在内）
_PREFS_FIELDS = ("provider", "temperature", "max_tokens", "max_videos", "save_path")

DEFAULT_PREFS: Dict[str, Any] = {
    "provider": getattr(config, "MODEL_TYPE", "dashscope"),
    "temperature": getattr(config, "TEMPERATURE", 0.3),
    "max_tokens": getattr(config, "MAX_TOKENS", 1024),
    "max_videos": getattr(config, "MAX_VIDEOS", 100),
    "save_path": getattr(config, "SAVE_PATH", "results"),
}


class SettingsStore:
    """用户偏好存储（JSON 文件，线程安全）。"""

    def __init__(self) -> None:
        base = os.environ.get("APPDATA") or os.path.expanduser("~/.biliinsight")
        self._path = Path(base) / "BiliInsight" / "prefs.json"
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()

    def load(self) -> Dict[str, Any]:
        """读取偏好；文件不存在或损坏时返回默认值。"""
        if not self._path.exists():
            return dict(DEFAULT_PREFS)
        try:
            with open(self._path, "r", encoding="utf-8") as f:
                data = json.load(f)
            merged = dict(DEFAULT_PREFS)
            merged.update({k: v for k, v in data.items() if k in _PREFS_FIELDS})
            return merged
        except Exception:
            return dict(DEFAULT_PREFS)

    def save(self, prefs: Dict[str, Any]) -> None:
        """合并并写入偏好（忽略白名单外字段，尤其忽略 key）。"""
        merged = dict(DEFAULT_PREFS)
        merged.update({k: v for k, v in prefs.items() if k in _PREFS_FIELDS})
        with self._lock:
            with open(self._path, "w", encoding="utf-8") as f:
                json.dump(merged, f, ensure_ascii=False, indent=2)
