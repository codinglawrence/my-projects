"""
日志配置模块
提供结构化日志记录，支持JSON格式和性能追踪
"""

import sys
import time
from typing import Any, Dict, Optional, Callable
from contextvars import ContextVar
from functools import wraps
from dataclasses import asdict

from loguru import logger
import json

from config.config import settings
from src.core.exceptions import DigitalAdvisorException, ErrorContext

# 请求上下文变量
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)
user_id_var: ContextVar[Optional[str]] = ContextVar("user_id", default=None)
operation_var: ContextVar[Optional[str]] = ContextVar("operation", default=None)


class JSONFormatter:
    """JSON日志格式化器"""
    
    def __call__(self, record):
        log_data = {
            "timestamp": record["time"].isoformat(),
            "level": record["level"].name,
            "message": record["message"],
            "module": record["name"],
            "function": record["function"],
            "line": record["line"],
            "request_id": request_id_var.get(),
            "user_id": user_id_var.get(),
            "operation": operation_var.get(),
        }
        
        # 添加额外字段
        if "extra" in record:
            extra = record["extra"]
            if "duration_ms" in extra:
                log_data["duration_ms"] = extra["duration_ms"]
            if "tokens" in extra:
                log_data["tokens"] = extra["tokens"]
            if "cost_usd" in extra:
                log_data["cost_usd"] = extra["cost_usd"]
            if "error" in extra:
                log_data["error"] = extra["error"]
        
        # 添加异常信息
        if record["exception"]:
            exception = record["exception"]
            log_data["exception"] = {
                "type": exception.type.__name__ if exception.type else None,
                "value": str(exception.value) if exception.value else None,
            }
        
        return json.dumps(log_data, ensure_ascii=False, default=str) + "\n"


_LOG_FORMAT = (
    "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "{message}"
)

_configured = False


def setup_logging(force: bool = False):
    """配置 loguru：控制台 + 按天轮转的应用日志 + 单独的错误日志。

    幂等：重复调用不会叠加 handler（main.py 与模块导入期各调一次）。
    日志目录取自 settings.log_dir（绝对路径），避免换工作目录后日志散落各处。

    Args:
        force: 为 True 时强制重建 handler，用于运行期改变日志级别。
    """
    global _configured
    if _configured and not force:
        return logger

    logger.remove()
    log_dir = settings.log_dir
    level = settings.LOG_LEVEL.upper()

    logger.add(sys.stdout, format=_LOG_FORMAT, level=level, colorize=True, enqueue=True)
    logger.add(
        log_dir / "app_{time:YYYY-MM-DD}.log",
        rotation="00:00",
        retention="30 days",
        level=level,
        encoding="utf-8",
        enqueue=True,
    )
    logger.add(
        log_dir / "error_{time:YYYY-MM-DD}.log",
        rotation="00:00",
        retention="30 days",
        level="ERROR",
        encoding="utf-8",
        enqueue=True,
    )

    _configured = True
    return logger


# 导入即可用：任何模块 `from src.core.logging import logger` 都能拿到已配置好的实例
setup_logging()


class ContextLogger:
    """带上下文的日志记录器"""
    
    @staticmethod
    def bind(
        request_id: Optional[str] = None,
        user_id: Optional[str] = None,
        operation: Optional[str] = None
    ):
        """绑定上下文"""
        if request_id:
            request_id_var.set(request_id)
        if user_id:
            user_id_var.set(user_id)
        if operation:
            operation_var.set(operation)
    
    @staticmethod
    def clear():
        """清除上下文"""
        request_id_var.set(None)
        user_id_var.set(None)
        operation_var.set(None)
    
    @staticmethod
    def debug(message: str, **kwargs):
        """调试日志"""
        logger.debug(message, **kwargs)
    
    @staticmethod
    def info(message: str, **kwargs):
        """信息日志"""
        logger.info(message, **kwargs)
    
    @staticmethod
    def warning(message: str, **kwargs):
        """警告日志"""
        logger.warning(message, **kwargs)
    
    @staticmethod
    def error(message: str, **kwargs):
        """错误日志"""
        logger.error(message, **kwargs)
    
    @staticmethod
    def critical(message: str, **kwargs):
        """严重错误日志"""
        logger.critical(message, **kwargs)
    
    @staticmethod
    def exception(message: str, **kwargs):
        """异常日志"""
        logger.exception(message, **kwargs)


# 便捷函数
def log_llm_call(
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    cost_usd: float,
    duration_ms: float,
    success: bool = True
):
    """记录LLM调用日志"""
    total_tokens = prompt_tokens + completion_tokens
    
    if success:
        logger.info(
            f"LLM调用成功 | 模型: {model} | "
            f"Tokens: {prompt_tokens}/{completion_tokens}/{total_tokens} | "
            f"成本: ${cost_usd:.6f} | 耗时: {duration_ms:.2f}ms",
            extra={
                "model": model,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens,
                "cost_usd": cost_usd,
                "duration_ms": duration_ms,
                "event": "llm_call"
            }
        )
    else:
        logger.error(
            f"LLM调用失败 | 模型: {model} | 耗时: {duration_ms:.2f}ms",
            extra={
                "model": model,
                "duration_ms": duration_ms,
                "event": "llm_call_failed"
            }
        )


def log_db_query(
    operation: str,
    table: str,
    duration_ms: float,
    rows_affected: Optional[int] = None,
    success: bool = True
):
    """记录数据库查询日志"""
    extra = {
        "operation": operation,
        "table": table,
        "duration_ms": duration_ms,
        "event": "db_query"
    }
    
    if rows_affected is not None:
        extra["rows_affected"] = rows_affected
    
    if success:
        level = "warning" if duration_ms > settings.SLOW_QUERY_THRESHOLD_MS else "debug"
        getattr(logger, level)(
            f"DB查询 | {operation} | 表: {table} | "
            f"耗时: {duration_ms:.2f}ms" +
            (f" | 影响行数: {rows_affected}" if rows_affected else ""),
            extra=extra
        )
    else:
        logger.error(
            f"DB查询失败 | {operation} | 表: {table} | 耗时: {duration_ms:.2f}ms",
            extra=extra
        )


def log_crawler_request(
    url: str,
    method: str,
    duration_ms: float,
    status_code: Optional[int] = None,
    success: bool = True
):
    """记录爬虫请求日志"""
    extra = {
        "url": url,
        "method": method,
        "duration_ms": duration_ms,
        "event": "crawler_request"
    }
    
    if status_code:
        extra["status_code"] = status_code
    
    if success:
        logger.info(
            f"爬虫请求 | {method} {url} | "
            f"状态: {status_code} | 耗时: {duration_ms:.2f}ms",
            extra=extra
        )
    else:
        logger.error(
            f"爬虫请求失败 | {method} {url} | 耗时: {duration_ms:.2f}ms",
            extra=extra
        )


def log_agent_execution(
    agent_name: str,
    node_name: str,
    duration_ms: float,
    success: bool = True,
    error: Optional[str] = None
):
    """记录Agent执行日志"""
    extra = {
        "agent_name": agent_name,
        "node_name": node_name,
        "duration_ms": duration_ms,
        "event": "agent_execution"
    }
    
    if success:
        logger.info(
            f"Agent执行 | {agent_name}.{node_name} | 耗时: {duration_ms:.2f}ms",
            extra=extra
        )
    else:
        extra["error"] = error
        logger.error(
            f"Agent执行失败 | {agent_name}.{node_name} | "
            f"耗时: {duration_ms:.2f}ms | 错误: {error}",
            extra=extra
        )


def log_error(error: DigitalAdvisorException):
    """记录应用错误"""
    error_dict = error.to_dict()
    
    log_func = {
        "debug": logger.debug,
        "info": logger.info,
        "warning": logger.warning,
        "error": logger.error,
        "critical": logger.critical
    }.get(error.severity.value, logger.error)
    
    log_func(
        f"应用错误 | {error.__class__.__name__}: {error.message}",
        extra={
            "error": error_dict,
            "event": "app_error"
        }
    )


def timed(operation: Optional[str] = None):
    """性能计时装饰器"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            op_name = operation or func.__name__
            start = time.perf_counter()
            
            try:
                result = await func(*args, **kwargs)
                duration = (time.perf_counter() - start) * 1000
                logger.debug(
                    f"操作完成 | {op_name} | 耗时: {duration:.2f}ms",
                    extra={"operation": op_name, "duration_ms": duration}
                )
                return result
            except Exception as e:
                duration = (time.perf_counter() - start) * 1000
                logger.error(
                    f"操作失败 | {op_name} | 耗时: {duration:.2f}ms | 错误: {e}",
                    extra={"operation": op_name, "duration_ms": duration, "error": str(e)}
                )
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            op_name = operation or func.__name__
            start = time.perf_counter()
            
            try:
                result = func(*args, **kwargs)
                duration = (time.perf_counter() - start) * 1000
                logger.debug(
                    f"操作完成 | {op_name} | 耗时: {duration:.2f}ms",
                    extra={"operation": op_name, "duration_ms": duration}
                )
                return result
            except Exception as e:
                duration = (time.perf_counter() - start) * 1000
                logger.error(
                    f"操作失败 | {op_name} | 耗时: {duration:.2f}ms | 错误: {e}",
                    extra={"operation": op_name, "duration_ms": duration, "error": str(e)}
                )
                raise
        
        return async_wrapper if hasattr(func, "__code__") and func.__code__.co_flags & 0x80 else sync_wrapper
    return decorator


# 导出
__all__ = [
    "logger",
    "ContextLogger",
    "setup_logging",
    "log_llm_call",
    "log_db_query",
    "log_crawler_request",
    "log_agent_execution",
    "log_error",
    "timed",
    "request_id_var",
    "user_id_var",
    "operation_var"
]
