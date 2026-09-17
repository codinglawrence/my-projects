"""
Agent 模块（实验性框架，当前不可用 ⚠️）

BloggerAgent 依赖 **src/core/** 自研框架（agent/nodes/state/tools），
该框架在导入期依赖 config/settings.py（已废弃），运行时存在多处未完缺陷
（工作流边不连接、工具 schema 自省错误、pydantic v1 写法），目前无法正常执行。

当前项目实际使用的 Agent 是 **src/services/agent_service.py** 中的 SmartAgent
（ReAct 模式 + RAG 记忆），通过 conversation.py / qa.py API 对外暴露。

保留原因：框架源码存档，供后续重构参考。
"""

from src.agents.blogger_agent import (
    BloggerAgent,
    BloggerProfile,
    create_blogger_agent,
    StyleAnalysisNode,
    ResponseGenerationNode,
    ContextEnrichmentNode,
    QualityCheckNode,
)

__all__ = [
    "BloggerAgent",
    "BloggerProfile",
    "create_blogger_agent",
    "StyleAnalysisNode",
    "ResponseGenerationNode",
    "ContextEnrichmentNode",
    "QualityCheckNode",
]
