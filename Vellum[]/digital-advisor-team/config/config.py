"""应用配置。

全项目唯一的配置入口：``from config.config import settings``。

设计约束：
- 字段名与 .env 中的键名一一对应（``case_sensitive=True``）。
- env_file 用绝对路径，保证从任意工作目录启动都能读到 .env。
- 只保留代码里真正用到的配置项，不预留"将来可能有用"的字段。
"""

from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

# config/config.py -> config/ -> 项目根
PROJECT_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """从环境变量 / .env 加载的运行时配置。"""

    # ---- 数据库 ----
    DATABASE_URL: str

    # ---- 大模型（默认 DeepSeek，兼容 OpenAI 协议）----
    LLM_API_KEY: str
    LLM_BASE_URL: str = "https://api.deepseek.com"
    LLM_MODEL: str = "deepseek-chat"
    LLM_TIMEOUT_SECONDS: int = 60
    LLM_MAX_RETRIES: int = 3

    # ---- 应用 ----
    APP_NAME: str = "数字顾问团"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # ---- 安全 ----
    CORS_ORIGINS: List[str] = ["*"]

    # ---- 爬虫 ----
    CRAWLER_DELAY: int = 1  # 连续请求之间的间隔（秒）

    # ---- 可观测性 ----
    SLOW_QUERY_THRESHOLD_MS: float = 500.0  # 超过该耗时的 DB 查询记为 warning

    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",  # .env 里的额外键（如旧版 LLM_PRIMARY_* ）不报错
    )

    @property
    def data_dir(self) -> Path:
        """数据目录（SQLite 文件、向量库都放这里），不存在时自动创建。"""
        path = PROJECT_ROOT / "data"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def log_dir(self) -> Path:
        """日志目录，不存在时自动创建。"""
        path = PROJECT_ROOT / "logs"
        path.mkdir(parents=True, exist_ok=True)
        return path


settings = Settings()
