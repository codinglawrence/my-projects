"""
系统配置管理模块（已废弃 ⚠️）

本文件为实验性 Agent 框架（src/core/ + src/agents/）配套的复杂配置，
需要 LLM_PRIMARY_API_KEY / DB_URL / REDIS_* 等环境变量，与当前 .env 不兼容。

当前项目唯一生效的配置入口是 **config/config.py**（``from config.config import settings``）。

保留原因：源码存档，供后续框架复用时参考。请勿 import 或修改。
"""

from typing import List, Optional, Literal
from functools import lru_cache
from pydantic import Field, field_validator, SecretStr, RedisDsn, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class LLMSettings(BaseSettings):
    """LLM配置"""
    model_config = SettingsConfigDict(
        env_prefix="LLM_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    # 主要模型配置
    PRIMARY_PROVIDER: Literal["openai", "azure", "anthropic", "deepseek"] = Field(
        default="deepseek",
        description="主要LLM提供商"
    )
    PRIMARY_MODEL: str = Field(
        default="deepseek-chat",
        description="主要模型名称"
    )
    PRIMARY_API_KEY: SecretStr = Field(
        description="主要API密钥"
    )
    PRIMARY_BASE_URL: Optional[str] = Field(
        default="https://api.deepseek.com",
        description="主要API基础URL"
    )
    
    # 备用模型配置（降级策略）
    FALLBACK_PROVIDER: Literal["openai", "azure", "anthropic", "deepseek"] = Field(
        default="deepseek",
        description="降级模型提供商"
    )
    FALLBACK_MODEL: str = Field(
        default="deepseek-chat",
        description="降级模型名称"
    )
    FALLBACK_API_KEY: Optional[SecretStr] = Field(
        default=None,
        description="降级模型API密钥"
    )
    FALLBACK_BASE_URL: Optional[str] = Field(
        default="https://api.deepseek.com",
        description="降级API基础URL"
    )
    
    # 请求参数
    DEFAULT_TEMPERATURE: float = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
        description="默认温度参数"
    )
    DEFAULT_MAX_TOKENS: int = Field(
        default=2000,
        ge=1,
        le=8192,
        description="默认最大token数"
    )
    REQUEST_TIMEOUT: float = Field(
        default=30.0,
        ge=1.0,
        description="请求超时时间(秒)"
    )
    
    # 重试配置
    MAX_RETRIES: int = Field(
        default=3,
        ge=1,
        le=10,
        description="最大重试次数"
    )
    RETRY_BASE_DELAY: float = Field(
        default=1.0,
        ge=0.1,
        description="重试基础延迟(秒)"
    )
    RETRY_MAX_DELAY: float = Field(
        default=60.0,
        ge=1.0,
        description="重试最大延迟(秒)"
    )
    
    # 成本预算控制
    MONTHLY_BUDGET_USD: float = Field(
        default=100.0,
        ge=0.0,
        description="月度预算(美元)"
    )
    DAILY_BUDGET_USD: float = Field(
        default=10.0,
        ge=0.0,
        description="日度预算(美元)"
    )
    
    @field_validator("FALLBACK_API_KEY")
    @classmethod
    def set_fallback_key(cls, v: Optional[SecretStr], info) -> Optional[SecretStr]:
        """如果未设置备用密钥，使用主密钥"""
        if v is None:
            values = info.data
            return values.get("PRIMARY_API_KEY")
        return v


class DatabaseSettings(BaseSettings):
    """数据库配置"""
    model_config = SettingsConfigDict(
        env_prefix="DB_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    URL: str = Field(
        default="sqlite+aiosqlite:///./data/digital_advisor.db",
        description="数据库连接URL (支持 PostgreSQL 和 SQLite)"
    )
    POOL_SIZE: int = Field(
        default=10,
        ge=1,
        le=100,
        description="连接池大小"
    )
    MAX_OVERFLOW: int = Field(
        default=20,
        ge=0,
        le=100,
        description="连接池溢出限制"
    )
    POOL_TIMEOUT: float = Field(
        default=30.0,
        ge=1.0,
        description="连接池超时(秒)"
    )
    POOL_RECYCLE: int = Field(
        default=3600,
        ge=300,
        description="连接回收时间(秒)"
    )
    ECHO: bool = Field(
        default=False,
        description="是否打印SQL语句"
    )


class RedisSettings(BaseSettings):
    """Redis配置"""
    model_config = SettingsConfigDict(
        env_prefix="REDIS_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    URL: Optional[RedisDsn] = Field(
        default=None,
        description="Redis连接URL"
    )
    ENABLED: bool = Field(
        default=False,
        description="是否启用Redis"
    )
    TTL_SECONDS: int = Field(
        default=3600,
        ge=60,
        description="缓存TTL(秒)"
    )


class CrawlerSettings(BaseSettings):
    """爬虫配置"""
    model_config = SettingsConfigDict(
        env_prefix="CRAWLER_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    DELAY_SECONDS: float = Field(
        default=1.0,
        ge=0.0,
        description="爬取间隔(秒)"
    )
    MAX_CONCURRENT: int = Field(
        default=5,
        ge=1,
        le=50,
        description="最大并发数"
    )
    REQUEST_TIMEOUT: float = Field(
        default=30.0,
        ge=1.0,
        description="请求超时(秒)"
    )
    MAX_RETRIES: int = Field(
        default=3,
        ge=0,
        le=10,
        description="最大重试次数"
    )
    USER_AGENT: str = Field(
        default="DigitalAdvisorBot/1.0",
        description="User-Agent"
    )
    RESPECT_ROBOTS_TXT: bool = Field(
        default=True,
        description="是否遵守robots.txt"
    )


class MonitoringSettings(BaseSettings):
    """监控配置"""
    model_config = SettingsConfigDict(
        env_prefix="MONITOR_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    ENABLED: bool = Field(
        default=True,
        description="是否启用监控"
    )
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO",
        description="日志级别"
    )
    LOG_FORMAT: Literal["json", "text"] = Field(
        default="text",
        description="日志格式"
    )
    METRICS_PORT: int = Field(
        default=9090,
        ge=1024,
        le=65535,
        description="指标端口"
    )
    TRACING_ENABLED: bool = Field(
        default=False,
        description="是否启用分布式追踪"
    )
    SLOW_QUERY_THRESHOLD_MS: float = Field(
        default=1000.0,
        ge=100.0,
        description="慢查询阈值(毫秒)"
    )


class SecuritySettings(BaseSettings):
    """安全配置"""
    model_config = SettingsConfigDict(
        env_prefix="SECURITY_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    SECRET_KEY: SecretStr = Field(
        default=SecretStr("dev-secret-key-change-in-production"),
        description="应用密钥"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30,
        ge=5,
        description="访问令牌过期时间(分钟)"
    )
    RATE_LIMIT_PER_MINUTE: int = Field(
        default=60,
        ge=10,
        description="每分钟请求限制"
    )
    ALLOWED_HOSTS: List[str] = Field(
        default=["*"],
        description="允许的主机"
    )
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:8080"],
        description="CORS允许来源"
    )
    
    @field_validator("ALLOWED_HOSTS", "CORS_ORIGINS", mode="before")
    @classmethod
    def parse_list(cls, v):
        """解析逗号分隔的字符串为列表"""
        if isinstance(v, str):
            return [item.strip() for item in v.split(",")]
        return v


class FeatureFlags(BaseSettings):
    """功能开关"""
    model_config = SettingsConfigDict(
        env_prefix="FEATURE_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    STREAMING_ENABLED: bool = Field(
        default=True,
        description="是否启用流式响应"
    )
    CACHE_ENABLED: bool = Field(
        default=True,
        description="是否启用缓存"
    )
    STYLE_LEARNING_ENABLED: bool = Field(
        default=True,
        description="是否启用风格学习"
    )
    KNOWLEDGE_BASE_ENABLED: bool = Field(
        default=True,
        description="是否启用知识库"
    )


class Settings(BaseSettings):
    """系统主配置"""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    # 应用信息
    APP_NAME: str = Field(
        default="数字顾问团",
        description="应用名称"
    )
    APP_VERSION: str = Field(
        default="1.0.0",
        description="应用版本"
    )
    DEBUG: bool = Field(
        default=False,
        description="调试模式"
    )
    ENVIRONMENT: Literal["development", "staging", "production"] = Field(
        default="development",
        description="运行环境"
    )
    
    # 子配置
    LLM: LLMSettings = Field(default_factory=LLMSettings)
    DB: DatabaseSettings = Field(default_factory=DatabaseSettings)
    REDIS: RedisSettings = Field(default_factory=RedisSettings)
    CRAWLER: CrawlerSettings = Field(default_factory=CrawlerSettings)
    MONITOR: MonitoringSettings = Field(default_factory=MonitoringSettings)
    SECURITY: SecuritySettings = Field(default_factory=SecuritySettings)
    FEATURE: FeatureFlags = Field(default_factory=FeatureFlags)
    
    @property
    def is_production(self) -> bool:
        """是否为生产环境"""
        return self.ENVIRONMENT == "production"
    
    @property
    def is_development(self) -> bool:
        """是否为开发环境"""
        return self.ENVIRONMENT == "development"


@lru_cache()
def get_settings() -> Settings:
    """
    获取配置单例
    
    使用lru_cache确保配置只加载一次，提高性能
    """
    return Settings()


# 全局配置实例
settings = get_settings()
