"""
系统异常定义模块
提供统一的异常层次结构和错误分类
"""

from enum import Enum, auto
from typing import Optional, Dict, Any, List
from dataclasses import dataclass


class ErrorCategory(Enum):
    """错误分类"""
    NETWORK = auto()          # 网络错误
    AUTHENTICATION = auto()   # 认证错误
    AUTHORIZATION = auto()    # 授权错误
    VALIDATION = auto()       # 校验错误
    RESOURCE = auto()         # 资源错误
    RATE_LIMIT = auto()       # 限流错误
    TIMEOUT = auto()          # 超时错误
    CONTENT_FILTER = auto()   # 内容过滤错误
    INTERNAL = auto()         # 内部错误
    EXTERNAL_SERVICE = auto() # 外部服务错误
    CONFIGURATION = auto()    # 配置错误


class ErrorSeverity(Enum):
    """错误严重程度"""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class ErrorContext:
    """错误上下文信息"""
    operation: str                    # 操作名称
    user_id: Optional[str] = None     # 用户ID
    request_id: Optional[str] = None  # 请求ID
    extra: Optional[Dict[str, Any]] = None  # 额外信息
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "operation": self.operation,
            "user_id": self.user_id,
            "request_id": self.request_id,
            "extra": self.extra or {}
        }


class DigitalAdvisorException(Exception):
    """全项目异常基类。

    所有子类都通过 ``super().__init__(message, category=..., severity=...,
    recoverable=...)`` 传参，因此基类必须同时接受这三个关键字。

    命名说明：``retryable`` 是规范名，``recoverable`` 是历史别名，二者等价；
    传任意一个都可以，读取时统一用 ``exc.retryable``。

    未知关键字不会抛 TypeError，而是收进 ``self.details``。
    异常构造发生在错误处理路径上，此处再抛异常只会掩盖真正的故障原因。
    """

    #: 子类可覆盖的默认值，避免每个子类都重复写一遍
    default_category: ErrorCategory = ErrorCategory.INTERNAL
    default_severity: ErrorSeverity = ErrorSeverity.ERROR
    default_retryable: bool = False

    def __init__(
        self,
        message: str,
        *,
        category: Optional[ErrorCategory] = None,
        severity: Optional[ErrorSeverity] = None,
        retryable: Optional[bool] = None,
        recoverable: Optional[bool] = None,
        context: Optional[Any] = None,
        **details: Any,
    ):
        super().__init__(message)
        self.message = message
        self.category = category if category is not None else self.default_category
        self.severity = severity if severity is not None else self.default_severity

        if retryable is None:
            retryable = recoverable if recoverable is not None else self.default_retryable
        self.retryable = bool(retryable)

        self.context = self._normalize_context(context)
        self.details = details

    @staticmethod
    def _normalize_context(context: Optional[Any]) -> Dict[str, Any]:
        """context 允许传 dict、ErrorContext 或 None，统一成 dict。"""
        if context is None:
            return {}
        if isinstance(context, ErrorContext):
            return context.to_dict()
        if isinstance(context, dict):
            return context
        return {"value": str(context)}

    @property
    def recoverable(self) -> bool:
        """``retryable`` 的只读别名，兼容旧调用方。"""
        return self.retryable

    def to_dict(self) -> Dict[str, Any]:
        """序列化为字典，供日志记录与 API 错误响应使用。"""
        payload = {
            "error": self.__class__.__name__,
            "message": self.message,
            "category": self.category.name,
            "severity": self.severity.value,
            "retryable": self.retryable,
            "context": self.context,
        }
        if self.details:
            payload["details"] = {k: str(v) for k, v in self.details.items()}
        return payload

    def __str__(self) -> str:
        return self.message


# ==================== LLM相关异常 ====================

class LLMException(DigitalAdvisorException):
    """LLM基础异常"""
    
    def __init__(
        self, 
        message: str, 
        error_type: str = "unknown",
        provider: str = "unknown",
        **kwargs
    ):
        super().__init__(message, **kwargs)
        self.error_type = error_type
        self.provider = provider
        
    def to_dict(self) -> Dict[str, Any]:
        result = super().to_dict()
        result.update({
            "error_type": self.error_type,
            "provider": self.provider
        })
        return result


class LLMRateLimitException(LLMException):
    """LLM速率限制异常"""
    
    def __init__(
        self,
        message: str = "LLM API速率限制",
        retry_after: Optional[float] = None,
        **kwargs
    ):
        super().__init__(
            message=message,
            category=ErrorCategory.RATE_LIMIT,
            severity=ErrorSeverity.WARNING,
            recoverable=True,
            **kwargs
        )
        self.retry_after = retry_after


class LLMTimeoutException(LLMException):
    """LLM超时异常"""
    
    def __init__(self, message: str = "LLM请求超时", **kwargs):
        super().__init__(
            message=message,
            category=ErrorCategory.TIMEOUT,
            severity=ErrorSeverity.ERROR,
            recoverable=True,
            **kwargs
        )


class LLMContentFilterException(LLMException):
    """LLM内容过滤异常"""
    
    def __init__(
        self,
        message: str = "内容被过滤",
        filter_type: Optional[str] = None,
        **kwargs
    ):
        super().__init__(
            message=message,
            category=ErrorCategory.CONTENT_FILTER,
            severity=ErrorSeverity.WARNING,
            recoverable=False,
            **kwargs
        )
        self.filter_type = filter_type


class LLMConnectionException(LLMException):
    """LLM连接异常"""
    
    def __init__(self, message: str = "LLM API连接失败", **kwargs):
        super().__init__(
            message=message,
            category=ErrorCategory.NETWORK,
            severity=ErrorSeverity.ERROR,
            recoverable=True,
            **kwargs
        )


class LLMBudgetExceededException(LLMException):
    """LLM预算超限异常"""
    
    def __init__(
        self,
        message: str = "LLM预算已超限",
        budget_type: str = "daily",
        current_cost: float = 0.0,
        limit: float = 0.0,
        **kwargs
    ):
        super().__init__(
            message=message,
            category=ErrorCategory.RESOURCE,
            severity=ErrorSeverity.ERROR,
            recoverable=False,
            **kwargs
        )
        self.budget_type = budget_type
        self.current_cost = current_cost
        self.limit = limit


class LLMTokenLimitException(LLMException):
    """LLM Token限制异常"""
    
    def __init__(
        self,
        message: str = "Token数量超过限制",
        current_tokens: int = 0,
        max_tokens: int = 0,
        **kwargs
    ):
        super().__init__(
            message=message,
            category=ErrorCategory.VALIDATION,
            severity=ErrorSeverity.ERROR,
            recoverable=False,
            **kwargs
        )
        self.current_tokens = current_tokens
        self.max_tokens = max_tokens


# ==================== 数据库相关异常 ====================

class DatabaseException(DigitalAdvisorException):
    """数据库基础异常"""
    pass


class DatabaseConnectionException(DatabaseException):
    """数据库连接异常"""
    
    def __init__(self, message: str = "数据库连接失败", **kwargs):
        super().__init__(
            message=message,
            category=ErrorCategory.NETWORK,
            severity=ErrorSeverity.CRITICAL,
            recoverable=True,
            **kwargs
        )


class DatabaseQueryException(DatabaseException):
    """数据库查询异常"""
    
    def __init__(
        self,
        message: str = "数据库查询失败",
        query: Optional[str] = None,
        **kwargs
    ):
        super().__init__(
            message=message,
            category=ErrorCategory.INTERNAL,
            severity=ErrorSeverity.ERROR,
            recoverable=True,
            **kwargs
        )
        self.query = query


class ResourceNotFoundException(DatabaseException):
    """资源未找到异常"""
    
    def __init__(
        self,
        resource_type: str,
        resource_id: Any,
        **kwargs
    ):
        super().__init__(
            message=f"{resource_type} (ID: {resource_id}) 未找到",
            category=ErrorCategory.RESOURCE,
            severity=ErrorSeverity.WARNING,
            recoverable=False,
            **kwargs
        )
        self.resource_type = resource_type
        self.resource_id = resource_id


class DuplicateResourceException(DatabaseException):
    """资源重复异常"""
    
    def __init__(
        self,
        resource_type: str,
        identifier: str,
        **kwargs
    ):
        super().__init__(
            message=f"{resource_type} (标识: {identifier}) 已存在",
            category=ErrorCategory.RESOURCE,
            severity=ErrorSeverity.WARNING,
            recoverable=False,
            **kwargs
        )


# ==================== 爬虫相关异常 ====================

class CrawlerException(DigitalAdvisorException):
    """爬虫基础异常"""
    pass


class CrawlerNetworkException(CrawlerException):
    """爬虫网络异常"""
    
    def __init__(
        self,
        message: str = "爬虫网络请求失败",
        url: Optional[str] = None,
        status_code: Optional[int] = None,
        **kwargs
    ):
        super().__init__(
            message=message,
            category=ErrorCategory.NETWORK,
            severity=ErrorSeverity.WARNING,
            recoverable=True,
            **kwargs
        )
        self.url = url
        self.status_code = status_code


class CrawlerParseException(CrawlerException):
    """爬虫解析异常"""
    
    def __init__(
        self,
        message: str = "页面解析失败",
        url: Optional[str] = None,
        **kwargs
    ):
        super().__init__(
            message=message,
            category=ErrorCategory.VALIDATION,
            severity=ErrorSeverity.WARNING,
            recoverable=False,
            **kwargs
        )
        self.url = url


class CrawlerRobotsException(CrawlerException):
    """爬虫robots.txt限制异常"""
    
    def __init__(
        self,
        message: str = "被robots.txt禁止访问",
        url: Optional[str] = None,
        **kwargs
    ):
        super().__init__(
            message=message,
            category=ErrorCategory.AUTHORIZATION,
            severity=ErrorSeverity.WARNING,
            recoverable=False,
            **kwargs
        )
        self.url = url


# ==================== 配置相关异常 ====================

class ConfigurationException(DigitalAdvisorException):
    """配置异常"""
    
    def __init__(
        self,
        message: str = "配置错误",
        config_key: Optional[str] = None,
        **kwargs
    ):
        super().__init__(
            message=message,
            severity=ErrorSeverity.CRITICAL,
            **kwargs
        )
        self.config_key = config_key


# ==================== 验证相关异常 ====================

class ValidationException(DigitalAdvisorException):
    """验证异常"""
    
    def __init__(
        self,
        message: str = "数据验证失败",
        errors: Optional[List[Dict[str, Any]]] = None,
        **kwargs
    ):
        super().__init__(
            message=message,
            severity=ErrorSeverity.WARNING,
            **kwargs
        )
        self.errors = errors or []


class ResourceException(DigitalAdvisorException):
    """资源异常"""
    
    def __init__(
        self,
        message: str = "资源错误",
        resource_type: Optional[str] = None,
        **kwargs
    ):
        super().__init__(
            message=message,
            severity=ErrorSeverity.ERROR,
            **kwargs
        )
        self.resource_type = resource_type


# ==================== Agent相关异常 ====================

class AgentException(DigitalAdvisorException):
    """Agent基础异常"""
    pass


class AgentNodeException(AgentException):
    """Agent节点异常"""
    
    def __init__(
        self,
        node_name: str,
        message: str = "节点执行失败",
        node_output: Optional[Any] = None,
        **kwargs
    ):
        super().__init__(
            message=f"节点 {node_name}: {message}",
            severity=ErrorSeverity.ERROR,
            **kwargs
        )
        self.node_name = node_name
        self.node_output = node_output


class AgentStateException(AgentException):
    """Agent状态异常"""
    
    def __init__(self, message: str = "Agent状态错误", **kwargs):
        super().__init__(
            message=message,
            severity=ErrorSeverity.ERROR,
            **kwargs
        )


class ToolException(DigitalAdvisorException):
    """工具执行异常"""
    
    def __init__(
        self,
        tool_name: str,
        message: str = "工具执行失败",
        **kwargs
    ):
        super().__init__(
            message=f"工具 {tool_name}: {message}",
            severity=ErrorSeverity.ERROR,
            **kwargs,
        )
        self.tool_name = tool_name


# ==================== 历史别名 ====================
# 基类曾用名 BaseAppException，限流/超时异常曾用名不带 LLM 前缀。
# 项目内仍有模块（src/core/nodes.py、src/core/monitoring.py、tests/）按旧名导入，
# 保留别名以免 ImportError；新代码请直接用规范名。

BaseAppException = DigitalAdvisorException
RateLimitException = LLMRateLimitException
TimeoutException = LLMTimeoutException
