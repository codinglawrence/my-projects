"""
LLM客户端模块
支持多提供商、指数退避重试、成本监控、流式响应
"""

import asyncio
import random
import time
from typing import Optional, Dict, Any, AsyncGenerator, List, Callable
from dataclasses import dataclass, field
from enum import Enum, auto
from abc import ABC, abstractmethod

import tiktoken
from openai import AsyncOpenAI, APIError, RateLimitError, APIConnectionError, APITimeoutError

from config.config import settings
from src.core.exceptions import (
    LLMRateLimitException,
    LLMTimeoutException,
    LLMContentFilterException,
    LLMConnectionException,
    LLMBudgetExceededException,
    LLMTokenLimitException,
    ErrorContext
)
from src.core.logging import log_llm_call, ContextLogger


class LLMProvider(Enum):
    """LLM提供商"""
    OPENAI = auto()
    AZURE = auto()
    ANTHROPIC = auto()
    DEEPSEEK = auto()


@dataclass
class TokenUsage:
    """Token使用统计"""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    
    def __post_init__(self):
        self.total_tokens = self.prompt_tokens + self.completion_tokens


@dataclass
class LLMResponse:
    """LLM响应封装"""
    content: str
    model: str
    usage: TokenUsage
    finish_reason: Optional[str] = None
    latency_ms: float = 0.0
    cost_usd: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class LLMRequest:
    """LLM请求封装"""
    messages: List[Dict[str, str]]
    model: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 2000
    json_mode: bool = False
    stream: bool = False
    timeout: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class CostTracker:
    """
    LLM成本追踪器
    
    实现预算控制和成本监控
    """
    
    # Token价格 (USD per 1K tokens) - 2024年价格
    PRICING = {
        # OpenAI
        "gpt-4o": {"input": 0.005, "output": 0.015},
        "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
        "gpt-4-turbo": {"input": 0.01, "output": 0.03},
        "gpt-4": {"input": 0.03, "output": 0.06},
        "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
        "gpt-3.5-turbo-0125": {"input": 0.0005, "output": 0.0015},
        # DeepSeek
        "deepseek-chat": {"input": 0.00014, "output": 0.00028},
        "deepseek-coder": {"input": 0.00014, "output": 0.00028},
        "deepseek-reasoner": {"input": 0.00055, "output": 0.00219},
    }
    
    def __init__(self):
        self.daily_cost = 0.0
        self.monthly_cost = 0.0
        self.request_count = 0
        self.token_count = 0
        self._lock = asyncio.Lock()
    
    def calculate_cost(self, model: str, prompt_tokens: int, completion_tokens: int) -> float:
        """计算请求成本"""
        # 找到匹配的模型价格
        pricing = None
        for model_prefix, prices in self.PRICING.items():
            if model.startswith(model_prefix):
                pricing = prices
                break
        
        if not pricing:
            # 默认使用gpt-3.5-turbo价格
            pricing = self.PRICING["gpt-3.5-turbo"]
        
        input_cost = (prompt_tokens / 1000) * pricing["input"]
        output_cost = (completion_tokens / 1000) * pricing["output"]
        return input_cost + output_cost
    
    async def record_usage(
        self,
        model: str,
        prompt_tokens: int,
        completion_tokens: int
    ) -> float:
        """记录使用并返回成本"""
        cost = self.calculate_cost(model, prompt_tokens, completion_tokens)
        
        async with self._lock:
            self.daily_cost += cost
            self.monthly_cost += cost
            self.request_count += 1
            self.token_count += prompt_tokens + completion_tokens
        
        return cost
    
    async def check_budget(self) -> None:
        """检查预算是否超限"""
        async with self._lock:
            if self.daily_cost >= settings.LLM.DAILY_BUDGET_USD:
                raise LLMBudgetExceededException(
                    message=f"日度预算已超限: ${self.daily_cost:.4f} / ${settings.LLM.DAILY_BUDGET_USD}",
                    budget_type="daily",
                    current_cost=self.daily_cost,
                    limit=settings.LLM.DAILY_BUDGET_USD
                )
            
            if self.monthly_cost >= settings.LLM.MONTHLY_BUDGET_USD:
                raise LLMBudgetExceededException(
                    message=f"月度预算已超限: ${self.monthly_cost:.4f} / ${settings.LLM.MONTHLY_BUDGET_USD}",
                    budget_type="monthly",
                    current_cost=self.monthly_cost,
                    limit=settings.LLM.MONTHLY_BUDGET_USD
                )
    
    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        return {
            "daily_cost_usd": round(self.daily_cost, 6),
            "monthly_cost_usd": round(self.monthly_cost, 6),
            "daily_budget_usd": settings.LLM.DAILY_BUDGET_USD,
            "monthly_budget_usd": settings.LLM.MONTHLY_BUDGET_USD,
            "request_count": self.request_count,
            "token_count": self.token_count,
            "daily_usage_percent": round(self.daily_cost / settings.LLM.DAILY_BUDGET_USD * 100, 2),
            "monthly_usage_percent": round(self.monthly_cost / settings.LLM.MONTHLY_BUDGET_USD * 100, 2)
        }
    
    async def reset_daily(self) -> None:
        """重置日度统计"""
        async with self._lock:
            self.daily_cost = 0.0
            self.request_count = 0


class BaseLLMProvider(ABC):
    """LLM提供商基类"""
    
    @abstractmethod
    async def complete(self, request: LLMRequest) -> LLMResponse:
        """完成请求"""
        pass
    
    @abstractmethod
    async def stream_complete(self, request: LLMRequest) -> AsyncGenerator[str, None]:
        """流式完成请求"""
        pass
    
    @abstractmethod
    def count_tokens(self, text: str, model: Optional[str] = None) -> int:
        """计算token数"""
        pass


class OpenAIProvider(BaseLLMProvider):
    """OpenAI/DeepSeek提供商实现（DeepSeek兼容OpenAI API格式）"""
    
    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o-mini",
        base_url: Optional[str] = None
    ):
        # 如果提供了base_url，则使用（用于DeepSeek等兼容API）
        if base_url:
            self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        else:
            self.client = AsyncOpenAI(api_key=api_key)
        self.model = model
        self.tokenizer = tiktoken.encoding_for_model("gpt-4")
    
    def count_tokens(self, text: str, model: Optional[str] = None) -> int:
        """计算token数"""
        try:
            encoding = tiktoken.encoding_for_model(model or self.model)
        except KeyError:
            encoding = self.tokenizer
        return len(encoding.encode(text))
    
    async def complete(self, request: LLMRequest) -> LLMResponse:
        """非流式完成"""
        start_time = time.perf_counter()
        
        response = await self.client.chat.completions.create(
            model=request.model or self.model,
            messages=request.messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            response_format={"type": "json_object"} if request.json_mode else None,
            timeout=request.timeout or settings.LLM.REQUEST_TIMEOUT
        )
        
        latency_ms = (time.perf_counter() - start_time) * 1000
        
        usage = TokenUsage(
            prompt_tokens=response.usage.prompt_tokens,
            completion_tokens=response.usage.completion_tokens
        )
        
        return LLMResponse(
            content=response.choices[0].message.content or "",
            model=response.model,
            usage=usage,
            finish_reason=response.choices[0].finish_reason,
            latency_ms=latency_ms,
            metadata={"provider": "openai"}
        )
    
    async def stream_complete(self, request: LLMRequest) -> AsyncGenerator[str, None]:
        """流式完成"""
        response = await self.client.chat.completions.create(
            model=request.model or self.model,
            messages=request.messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stream=True,
            timeout=request.timeout or settings.LLM.REQUEST_TIMEOUT
        )
        
        async for chunk in response:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


class LLMClient:
    """
    生产级LLM客户端
    
    特性：
    - 指数退避重试机制
    - 请求超时控制
    - 流式响应支持
    - 错误分类处理
    - 成本监控和预算控制
    - 多模型降级策略
    - 支持多提供商（OpenAI/DeepSeek等）
    """
    
    def __init__(self):
        # 根据提供商创建主客户端
        primary_base_url = settings.LLM.PRIMARY_BASE_URL
        self.primary_provider = OpenAIProvider(
            api_key=settings.LLM.PRIMARY_API_KEY.get_secret_value(),
            model=settings.LLM.PRIMARY_MODEL,
            base_url=primary_base_url
        )
        
        # 初始化降级提供商
        fallback_key = settings.LLM.FALLBACK_API_KEY
        fallback_base_url = settings.LLM.FALLBACK_BASE_URL
        self.fallback_provider = OpenAIProvider(
            api_key=(fallback_key.get_secret_value() if fallback_key else 
                    settings.LLM.PRIMARY_API_KEY.get_secret_value()),
            model=settings.LLM.FALLBACK_MODEL,
            base_url=fallback_base_url
        )
        
        self.cost_tracker = CostTracker()
        self.max_retries = settings.LLM.MAX_RETRIES
        self.base_delay = settings.LLM.RETRY_BASE_DELAY
        self.max_delay = settings.LLM.RETRY_MAX_DELAY
    
    def _calculate_delay(self, attempt: int) -> float:
        """计算指数退避延迟"""
        delay = self.base_delay * (2 ** attempt)
        jitter = random.uniform(0, delay * 0.1)  # 10%抖动
        return min(delay + jitter, self.max_delay)
    
    def _classify_error(self, error: Exception) -> Exception:
        """分类错误并转换为应用异常"""
        if isinstance(error, RateLimitError):
            retry_after = None
            if hasattr(error, 'headers') and error.headers:
                retry_after = error.headers.get('retry-after')
            return LLMRateLimitException(
                retry_after=float(retry_after) if retry_after else None,
                original_error=error
            )
        elif isinstance(error, APITimeoutError):
            return LLMTimeoutException(original_error=error)
        elif isinstance(error, APIConnectionError):
            return LLMConnectionException(original_error=error)
        elif isinstance(error, APIError):
            error_str = str(error).lower()
            if "content_filter" in error_str or "content filter" in error_str:
                return LLMContentFilterException(original_error=error)
            return error
        return error
    
    async def _execute_with_retry(
        self,
        request: LLMRequest,
        use_fallback: bool = False
    ) -> LLMResponse:
        """带重试的执行"""
        provider = self.fallback_provider if use_fallback else self.primary_provider
        model = request.model or (
            settings.LLM.FALLBACK_MODEL if use_fallback else settings.LLM.PRIMARY_MODEL
        )
        
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                ContextLogger.info(
                    f"LLM请求 | 模型: {model} | 尝试: {attempt + 1}/{self.max_retries}"
                )
                
                response = await provider.complete(request)
                response.model = model  # 记录实际使用的模型
                return response
                
            except Exception as e:
                classified_error = self._classify_error(e)
                last_error = classified_error
                
                # 不可恢复的错误直接抛出
                if isinstance(classified_error, LLMContentFilterException):
                    raise classified_error
                if isinstance(classified_error, LLMBudgetExceededException):
                    raise classified_error
                
                # 检查是否还有重试机会
                if attempt < self.max_retries - 1:
                    delay = self._calculate_delay(attempt)
                    ContextLogger.warning(
                        f"LLM请求失败，{delay:.2f}秒后重试 | 错误: {classified_error}"
                    )
                    await asyncio.sleep(delay)
                else:
                    break
        
        # 所有重试失败
        raise last_error or Exception("Unknown error")
    
    async def complete(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        json_mode: bool = False,
        timeout: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> LLMResponse:
        """
        完成请求（非流式）
        
        Args:
            messages: 消息列表
            model: 模型名称（可选）
            temperature: 温度参数
            max_tokens: 最大token数
            json_mode: 是否使用JSON模式
            timeout: 超时时间
            metadata: 元数据
            
        Returns:
            LLMResponse: 响应对象
        """
        # 检查预算
        await self.cost_tracker.check_budget()
        
        request = LLMRequest(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            json_mode=json_mode,
            timeout=timeout,
            metadata=metadata or {}
        )
        
        start_time = time.perf_counter()
        use_fallback = False
        
        try:
            response = await self._execute_with_retry(request, use_fallback=False)
        except (LLMRateLimitException, LLMTimeoutException, LLMConnectionException):
            # 切换到降级模型
            ContextLogger.warning("切换到降级模型")
            use_fallback = True
            response = await self._execute_with_retry(request, use_fallback=True)
        
        # 计算成本
        cost = await self.cost_tracker.record_usage(
            model=response.model,
            prompt_tokens=response.usage.prompt_tokens,
            completion_tokens=response.usage.completion_tokens
        )
        response.cost_usd = cost
        
        # 记录日志
        log_llm_call(
            model=response.model,
            prompt_tokens=response.usage.prompt_tokens,
            completion_tokens=response.usage.completion_tokens,
            cost_usd=cost,
            duration_ms=response.latency_ms,
            success=True
        )
        
        return response
    
    async def stream_complete(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        timeout: Optional[float] = None
    ) -> AsyncGenerator[str, None]:
        """
        流式完成请求
        
        Args:
            messages: 消息列表
            model: 模型名称
            temperature: 温度参数
            max_tokens: 最大token数
            timeout: 超时时间
            
        Yields:
            str: 内容片段
        """
        await self.cost_tracker.check_budget()
        
        request = LLMRequest(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
            timeout=timeout
        )
        
        provider = self.primary_provider
        actual_model = model or settings.LLM.PRIMARY_MODEL
        
        try:
            async for chunk in provider.stream_complete(request):
                yield chunk
        except Exception as e:
            ContextLogger.error(f"流式请求失败: {e}")
            raise
    
    def count_tokens(self, text: str, model: Optional[str] = None) -> int:
        """计算文本token数"""
        return self.primary_provider.count_tokens(text, model)
    
    def count_message_tokens(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None
    ) -> int:
        """计算消息列表token数"""
        total = 0
        for msg in messages:
            total += self.count_tokens(msg.get("content", ""), model)
            total += 4  # 每条消息的开销
        total += 2  # 回复的开销
        return total
    
    def get_cost_stats(self) -> Dict[str, Any]:
        """获取成本统计"""
        return self.cost_tracker.get_stats()


# 全局LLM客户端实例
# 注意：此模块依赖 config/settings.py（以 LLM_PRIMARY_* 为前缀的复杂配置），
# 当前生效的是 config/config.py。若 settings.LLM 不存在，实例化会优雅降级，
# 不影响其他模块的导入链。
try:
    llm_client = LLMClient()
except (AttributeError, KeyError):
    llm_client = None  # type: ignore[assignment]

