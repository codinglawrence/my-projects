"""密钥提供方抽象与本地实现。

设计目标（见 system-design-desktop）：
- KeyProvider 抽象接口，便于未来接入远程登录（P2）的 RemoteKeyProvider。
- 本期 LocalKeyProvider：优先写入系统凭据管理器（Windows Credential Manager，
  经 keyring 库），失败则回退到 cryptography 加密的本地文件。
- resolve(provider) 优先级：用户设置 key > config.py 内置默认。
- 任何情况下都不把 key 明文落到前端或日志（日志中仅记录是否“已设置”，绝不打印 key 原文）。
"""
from __future__ import annotations

import json
import os
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

try:
    import keyring
    _HAS_KEYRING = True
except Exception:  # pragma: no cover - 依赖缺失时降级到加密文件
    _HAS_KEYRING = False

try:
    from cryptography.fernet import Fernet
    _HAS_CRYPTO = True
except Exception:  # pragma: no cover
    _HAS_CRYPTO = False

import config  # 内置默认 key 来源（仅本地打包，不入仓库）

# 支持的模型供应商
PROVIDERS = ["openai", "deepseek", "siliconflow", "dashscope"]

# 系统凭据 / 加密文件使用的服务名
SERVICE_NAME = "BiliInsight"

# config.py 中各供应商默认 key 的变量名映射
_CONFIG_KEY_MAP = {
    "openai": "OPENAI_API_KEY",
    "deepseek": "DEEPSEEK_API_KEY",
    "siliconflow": "SILICONFLOW_API_KEY",
    "dashscope": "DASHSCOPE_API_KEY",
}


def _appdata_dir() -> Path:
    """返回 %APPDATA%/BiliInsight 目录（不存在则创建）。"""
    base = os.environ.get("APPDATA") or os.path.expanduser("~/.biliinsight")
    path = Path(base) / "BiliInsight"
    path.mkdir(parents=True, exist_ok=True)
    return path


class KeyProvider(ABC):
    """密钥提供方抽象接口。

    未来 RemoteKeyProvider（P2 登录入口）实现同接口即可平滑切换，
    本地 key 作为离线兜底。
    """

    @abstractmethod
    def resolve(self, provider: str) -> str:
        """解析某供应商的有效 key：用户设置优先，否则返回内置默认。"""
        raise NotImplementedError

    @abstractmethod
    def set(self, provider: str, key: str) -> None:
        """保存用户设置 key（落系统凭据 / 加密文件）。"""
        raise NotImplementedError

    @abstractmethod
    def has(self, provider: str) -> bool:
        """是否已存在用户自行设置的 key（不含内置默认占位符）。"""
        raise NotImplementedError


class LocalKeyProvider(KeyProvider):
    """本地密钥存储：keyring（Windows 凭据管理器）为主，加密文件兜底。"""

    def __init__(self) -> None:
        self._dir = _appdata_dir()
        self._enc_file = self._dir / "keys.enc"
        self._fernet_key_file = self._dir / ".fernet"

    # ---------- 加密文件兜底（cryptography） ----------
    def _load_fernet(self) -> "Optional[Fernet]":
        if not _HAS_CRYPTO:
            return None
        try:
            if not self._fernet_key_file.exists():
                key = Fernet.generate_key()
                self._fernet_key_file.write_bytes(key)
                os.chmod(self._fernet_key_file, 0o600)  # 仅当前用户可读写
            return Fernet(self._fernet_key_file.read_bytes())
        except Exception:
            return None

    def _read_file_keys(self) -> dict:
        if not self._enc_file.exists():
            return {}
        fernet = self._load_fernet()
        if not fernet:
            return {}
        try:
            raw = fernet.decrypt(self._enc_file.read_bytes())
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return {}

    def _write_file_keys(self, keys: dict) -> None:
        fernet = self._load_fernet()
        if not fernet:
            raise RuntimeError("加密模块不可用，无法写入本地密钥文件")
        self._enc_file.write_bytes(fernet.encrypt(json.dumps(keys).encode("utf-8")))
        os.chmod(self._enc_file, 0o600)

    # ---------- keyring（Windows 凭据管理器） ----------
    def _from_keyring(self, provider: str) -> "Optional[str]":
        if not _HAS_KEYRING:
            return None
        try:
            return keyring.get_password(SERVICE_NAME, provider)
        except Exception:
            return None

    def _to_keyring(self, provider: str, key: str) -> bool:
        if not _HAS_KEYRING:
            return False
        try:
            keyring.set_password(SERVICE_NAME, provider, key)
            return True
        except Exception:
            return False

    # ---------- 接口实现 ----------
    def resolve(self, provider: str) -> str:
        # 1) keyring 中用户设置的 key（最高优先级）
        stored = self._from_keyring(provider)
        if stored:
            return stored
        # 2) 加密文件中的 key
        file_keys = self._read_file_keys()
        if provider in file_keys and file_keys[provider]:
            return file_keys[provider]
        # 3) 回退到 config.py 内置默认（本期“先用着”）
        return getattr(config, _CONFIG_KEY_MAP.get(provider, ""), "") or ""

    def set(self, provider: str, key: str) -> None:
        # 先尝试 keyring（Windows 凭据管理器），失败则回退加密文件
        if self._to_keyring(provider, key):
            # 同步清除旧的文件兜底，避免双份密钥
            self._remove_file_key(provider)
            return
        keys = self._read_file_keys()
        keys[provider] = key
        self._write_file_keys(keys)

    def has(self, provider: str) -> bool:
        """是否已设置用户自有 key（不含内置默认占位符）。"""
        if self._from_keyring(provider):
            return True
        return provider in self._read_file_keys()

    def _remove_file_key(self, provider: str) -> None:
        keys = self._read_file_keys()
        if provider in keys:
            del keys[provider]
            if keys:
                self._write_file_keys(keys)
            elif self._enc_file.exists():
                self._enc_file.unlink()


# 全局默认实例（供 app.py 直接使用）
default_provider = LocalKeyProvider()
