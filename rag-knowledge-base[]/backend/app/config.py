import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Force-read .env to bypass any system env var pollution
_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
_ENV_VARS = {}
if _ENV_PATH.exists():
    for line in _ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            _ENV_VARS[key] = val


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = _ENV_VARS.get("DATABASE_URL", "sqlite:///./data/rag_system.db")

    # JWT
    JWT_SECRET_KEY: str = _ENV_VARS.get("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = int(_ENV_VARS.get("JWT_EXPIRE_HOURS", "24"))

    # DeepSeek LLM
    DEEPSEEK_API_KEY: str = _ENV_VARS.get("DEEPSEEK_API_KEY", "")
    DEEPSEEK_BASE_URL: str = _ENV_VARS.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
    DEEPSEEK_MODEL: str = _ENV_VARS.get("DEEPSEEK_MODEL", "deepseek-chat")

    # Aliyun DashScope Embedding
    DASHSCOPE_API_KEY: str = _ENV_VARS.get("DASHSCOPE_API_KEY", "")

    # ChromaDB
    CHROMA_PERSIST_DIR: str = _ENV_VARS.get("CHROMA_PERSIST_DIR", "./data/chroma")

    # RAG params
    CHUNK_SIZE: int = int(_ENV_VARS.get("CHUNK_SIZE", "500"))
    CHUNK_OVERLAP: int = int(_ENV_VARS.get("CHUNK_OVERLAP", "50"))
    TOP_K: int = int(_ENV_VARS.get("TOP_K", "5"))
    RERANK_ENABLED: bool = _ENV_VARS.get("RERANK_ENABLED", "false").lower() == "true"
    HYBRID_SEARCH_ENABLED: bool = _ENV_VARS.get("HYBRID_SEARCH_ENABLED", "false").lower() == "true"

    # Admin
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = _ENV_VARS.get("ADMIN_PASSWORD", "")

    # CORS：允许的前端来源，多个用逗号分隔。
    # 生产环境（nginx 反代）通常设为部署域名；设为 * 则允许任意来源。
    CORS_ORIGINS: str = _ENV_VARS.get("CORS_ORIGINS", "http://localhost:3000")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Override with forced .env values (anti-pollution), preserving declared types.
# Without the type coercion below, string values from .env would clobber the
# typed defaults above (e.g. JWT_EXPIRE_HOURS -> "24" str, breaking timedelta()).
for k, v in _ENV_VARS.items():
    if hasattr(settings, k) and v:
        current = getattr(settings, k)
        if isinstance(current, bool):
            setattr(settings, k, v.strip().lower() in ("1", "true", "yes", "on"))
        elif isinstance(current, int):
            try:
                setattr(settings, k, int(v))
            except (ValueError, TypeError):
                pass
        elif isinstance(current, float):
            try:
                setattr(settings, k, float(v))
            except (ValueError, TypeError):
                pass
        else:
            setattr(settings, k, v)

if not settings.JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY 未设置。请在 .env 文件或环境变量中设置一个安全的密钥。")