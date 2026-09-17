"""
核心模块

提供生产级AI Agent系统的基础设施
"""

from src.core.exceptions import (
    DigitalAdvisorException,
    ErrorCategory,
    ErrorSeverity,
    ErrorContext,
    LLMException,
    LLMRateLimitException,
    LLMTimeoutException,
    LLMContentFilterException,
    LLMConnectionException,
    DatabaseException,
    ResourceNotFoundException,
    ValidationException,
    ConfigurationException,
)

from src.core.logging import (
    setup_logging,
    logger,
    ContextLogger,
)

__all__ = [
    # 异常
    "DigitalAdvisorException",
    "ErrorCategory",
    "ErrorSeverity",
    "ErrorContext",
    "LLMException",
    "LLMRateLimitException",
    "LLMTimeoutException",
    "LLMContentFilterException",
    "LLMConnectionException",
    "DatabaseException",
    "ResourceNotFoundException",
    "ValidationException",
    "ConfigurationException",
    # 日志
    "setup_logging",
    "logger",
    "ContextLogger",
]
