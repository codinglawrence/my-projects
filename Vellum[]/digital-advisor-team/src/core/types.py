"""
类型定义模块

提供统一的类型定义，增强代码的类型安全性
"""

from typing import Dict, Any, List, Optional, Union, TypedDict
from datetime import datetime


# 基础类型定义
class MessageDict(TypedDict):
    """消息字典类型"""
    role: str
    content: str
    timestamp: str


class ConversationStats(TypedDict):
    """对话统计类型"""
    total_messages: int
    user_messages: int
    assistant_messages: int
    last_active: str


class AgentResponse(TypedDict):
    """Agent响应类型"""
    response: str
    thought: Optional[str]
    action: Optional[str]
    agent_name: str
    context_used: bool
    memory_stats: Dict[str, Any]


class LLMRequest(TypedDict):
    """LLM请求类型"""
    messages: List[Dict[str, str]]
    temperature: float
    max_tokens: int
    json_mode: bool
    stream: bool


class LLMResponse(TypedDict):
    """LLM响应类型"""
    content: str
    usage: Dict[str, int]
    model: str
    finish_reason: Optional[str]


# 数据库相关类型
class BloggerData(TypedDict):
    """博主数据类型"""
    id: int
    name: str
    description: Optional[str]
    avatar: Optional[str]
    color: Optional[str]
    created_at: str
    updated_at: str


class ConversationData(TypedDict):
    """对话数据类型"""
    id: int
    blogger_id: int
    title: str
    created_at: str
    updated_at: str


# RAG相关类型
class MemoryChunkData(TypedDict):
    """记忆片段数据类型"""
    id: str
    content: str
    role: str
    conversation_id: int
    timestamp: str
    metadata: Dict[str, Any]


class RetrievedMemoryData(TypedDict):
    """检索到的记忆数据类型"""
    chunk: MemoryChunkData
    similarity: float
    relevance_score: float


# 配置相关类型
class DatabaseConfig(TypedDict):
    """数据库配置类型"""
    url: str
    echo: bool
    pool_size: int
    max_overflow: int
    pool_recycle: int


class LLMConfig(TypedDict):
    """LLM配置类型"""
    api_key: str
    base_url: str
    model: str
    timeout: int
    max_retries: int


# 错误处理类型
class ErrorInfo(TypedDict):
    """错误信息类型"""
    error: str
    message: str
    severity: str
    retryable: bool
    context: Dict[str, Any]


# 工具函数
def validate_message_dict(data: Dict[str, Any]) -> MessageDict:
    """验证消息字典"""
    required_fields = {'role', 'content', 'timestamp'}
    if not required_fields.issubset(data.keys()):
        raise ValueError(f"消息字典缺少必要字段: {required_fields - set(data.keys())}")
    
    return MessageDict(**data)


def validate_agent_response(data: Dict[str, Any]) -> AgentResponse:
    """验证Agent响应"""
    required_fields = {'response', 'agent_name', 'context_used', 'memory_stats'}
    if not required_fields.issubset(data.keys()):
        raise ValueError(f"Agent响应缺少必要字段: {required_fields - set(data.keys())}")
    
    return AgentResponse(**data)