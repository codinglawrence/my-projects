"""
LLM 客户端

特性：
- 指数退避重试（最多 3 次）
- 请求超时控制（可配置）
- 正常 / 流式双通道
- 错误分类处理（RateLimit / Timeout / Connection / API）
- JSON 输出模式
- 单例全局实例

调用约定
----------
所有调用方统一用模块级 ``llm_client`` 单例：

    from src.llm.client import llm_client

    result = await llm_client.chat_completion(messages, ...)
    # result: {"content": str, "usage": dict, "model": str, "finish_reason": str | None}

    async for chunk in llm_client.chat_stream(messages, ...):
        # chunk: str

流式别名：
    chat_stream          —— qa_agent.py 使用
    stream_chat_completion —— style_learning.py 使用（历史名称，等价）
"""

import asyncio
import random
from typing import Dict, Any, Optional, AsyncGenerator

from loguru import logger
from openai import (
    AsyncOpenAI,
    APIError,
    RateLimitError,
    APIConnectionError,
    APITimeoutError,
)

from config.config import settings
from src.core.exceptions import (
    LLMException,
    LLMRateLimitException,
    LLMTimeoutException,
    LLMConnectionException,
    ErrorSeverity,
)


class LLMClient:
    """增强版 LLM 客户端。"""

    def __init__(self):
        self._client: Optional[AsyncOpenAI] = None
        self.model = settings.LLM_MODEL
        self.max_retries = settings.LLM_MAX_RETRIES
        self.timeout = settings.LLM_TIMEOUT_SECONDS

    @property
    def client(self) -> AsyncOpenAI:
        """懒加载：首调时才初始化 HTTP 连接。"""
        if self._client is None:
            self._client = AsyncOpenAI(
                api_key=settings.LLM_API_KEY,
                base_url=settings.LLM_BASE_URL,
                max_retries=0,  # 关闭内置重试，使用自定义逻辑
            )
        return self._client

    # ---- 重试 / 错误分类 -------------------------------------------

    async def _exponential_backoff(self, attempt: int) -> None:
        delay = min(2 ** attempt + random.uniform(0, 1), 60)
        logger.info(f"LLM 重试延迟: {delay:.2f}s (attempt {attempt + 1})")
        await asyncio.sleep(delay)

    @staticmethod
    def _classify_error(error: Exception) -> LLMException:
        if isinstance(error, RateLimitError):
            return LLMRateLimitException(
                f"API 限流: {error}",
                provider="DeepSeek",
                context={"retry_after": "unknown"},
            )
        elif isinstance(error, (APIConnectionError, APITimeoutError)):
            return LLMTimeoutException(
                f"连接/超时: {error}",
                provider="DeepSeek",
            )
        elif isinstance(error, APIError):
            return LLMException(
                f"API 错误: {error}",
                error_type="api_error",
                provider="DeepSeek",
                severity=ErrorSeverity.ERROR,
            )
        return LLMException(
            f"未知错误: {error}",
            error_type="unknown",
            provider="DeepSeek",
            severity=ErrorSeverity.CRITICAL,
        )

    # ---- 核心方法 ------------------------------------------------

    async def chat_completion(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        json_mode: bool = False,
    ) -> Dict[str, Any]:
        """非流式聊天完成，含指数退避重试。

        返回：{"content", "usage", "model", "finish_reason"}
        这是本项目所有同步调用方统一的数据契约。
        """
        last_error: Optional[Exception] = None

        for attempt in range(self.max_retries):
            try:
                logger.debug(
                    f"LLM 请求 (attempt {attempt + 1}/{self.max_retries})",
                )

                # response_format=None 传参无害，但省略更干净
                extra: Dict[str, Any] = {}
                if json_mode:
                    extra["response_format"] = {"type": "json_object"}

                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    timeout=self.timeout,
                    **extra,
                )
                return self._parse_normal_response(response)

            except (RateLimitError, APIConnectionError, APITimeoutError, APIError) as e:
                last_error = self._classify_error(e)
                logger.warning(f"LLM 错误: {last_error}")

                if attempt < self.max_retries - 1 and last_error.retryable:
                    await self._exponential_backoff(attempt)
                    continue
                raise last_error

            except Exception as e:
                last_error = self._classify_error(e)
                logger.error(f"LLM 未知错误: {last_error}")
                raise last_error

        raise last_error or LLMException("LLM 请求失败（无具体错误）")

    # ---- 流式 ------------------------------------------------

    async def chat_stream(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        json_mode: bool = False,
    ) -> AsyncGenerator[str, None]:
        """流式聊天完成。

        注意：流式不支持指数退避重试（生成器无法在内部重试），
        失败会直接抛异常，由调用方自行决定重试策略。
        """
        extra: Dict[str, Any] = {}
        if json_mode:
            extra["response_format"] = {"type": "json_object"}

        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
                timeout=self.timeout,
                **extra,
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except (RateLimitError, APIConnectionError, APITimeoutError, APIError) as e:
            raise self._classify_error(e) from e
        except Exception as e:
            raise self._classify_error(e) from e

    # 历史别名：style_learning.py 使用
    stream_chat_completion = chat_stream

    # ---- 内部 --------------------------------------------------

    @staticmethod
    def _parse_normal_response(response) -> Dict[str, Any]:
        try:
            choice = response.choices[0]
            return {
                "content": choice.message.content or "",
                "usage": response.usage.model_dump() if response.usage else {},
                "model": response.model,
                "finish_reason": choice.finish_reason,
            }
        except (AttributeError, IndexError) as e:
            raise LLMException(f"响应解析错误: {e}") from e

    async def close(self):
        if self._client is not None:
            self._client = None
            logger.info("LLM 客户端已关闭")


# ---- 单例 --------------------------------------------------

_global_llm_client: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    global _global_llm_client
    if _global_llm_client is None:
        _global_llm_client = LLMClient()
    return _global_llm_client


async def close_llm_client():
    global _global_llm_client
    if _global_llm_client is not None:
        await _global_llm_client.close()
        _global_llm_client = None


# 全局单例 —— 所有模块 from src.llm.client import llm_client 即用
llm_client = get_llm_client()
