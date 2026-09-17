"""
博主风格模拟Agent

基于工程化架构实现的数字顾问团核心Agent
"""

from typing import Dict, Any, Optional, List
from dataclasses import dataclass

from src.core import (
    BaseAgent, AgentConfig, Workflow,
    BaseNode, NodeConfig, NodeResult, NodeType,
    LLMNode, FunctionNode,
    node_registry, tool_registry,
    AgentState, ConversationState,
    llm_client,
    node, tool,
    logger
)
from src.core.nodes import DecisionNode


@dataclass
class BloggerProfile:
    """博主档案"""
    id: str
    name: str
    description: str
    style_description: Optional[str] = None
    expertise_areas: List[str] = None
    common_phrases: List[str] = None
    
    def __post_init__(self):
        if self.expertise_areas is None:
            self.expertise_areas = []
        if self.common_phrases is None:
            self.common_phrases = []


class StyleAnalysisNode(BaseNode):
    """风格分析节点"""
    
    def __init__(self):
        super().__init__(NodeConfig(
            name="analyze_style",
            description="分析博主风格",
            max_retries=2,
            timeout=60.0
        ))
    
    async def _execute(self, state: AgentState, **inputs) -> Dict[str, Any]:
        """执行风格分析"""
        materials = inputs.get("materials", [])
        
        if not materials:
            return {"style_description": "通用风格", "confidence": 0.5}
        
        # 构建分析提示
        material_text = "\n\n".join([
            f"标题: {m.get('title', '')}\n内容: {m.get('content', '')[:500]}"
            for m in materials[:3]
        ])
        
        messages = [
            {
                "role": "system",
                "content": "你是一个风格分析专家。分析以下内容，提取语言风格特征。"
            },
            {
                "role": "user",
                "content": f"分析以下博主内容的风格特征：\n\n{material_text}\n\n"
                          f"请描述：1.语言风格 2.常用表达方式 3.专业领域 4.语气特点"
            }
        ]
        
        response = await llm_client.complete(
            messages=messages,
            temperature=0.3,
            max_tokens=1000
        )
        
        return {
            "style_description": response.content,
            "confidence": 0.85,
            "tokens_used": response.usage.total_tokens,
            "cost_usd": response.cost_usd
        }


class ResponseGenerationNode(BaseNode):
    """回复生成节点"""
    
    def __init__(self):
        super().__init__(NodeConfig(
            name="generate_response",
            description="生成符合博主风格的回复",
            max_retries=3,
            timeout=45.0,
            fallback_value={"content": "抱歉，我现在无法回答这个问题。"}
        ))
    
    async def _execute(self, state: AgentState, **inputs) -> Dict[str, Any]:
        """执行回复生成"""
        user_message = inputs.get("user_message", "")
        
        # 优先使用风格分析节点的输出，否则使用原始输入中的风格描述
        style_analysis_output = inputs.get("analyze_style_output", {})
        style_description = style_analysis_output.get("style_description") or inputs.get("style_description", "")
        
        # 如果没有风格描述，使用博主描述作为备选
        if not style_description:
            style_description = inputs.get("blogger_description", "通用博主风格")
        
        context = inputs.get("context", [])
        
        # 构建系统提示
        system_prompt = f"""你是一个风格模仿专家。请严格按照以下风格特征回复用户：

{style_description}

重要规则：
1. 完全模仿上述风格，包括用词、语气和表达方式
2. 保持专业性和准确性
3. 如果不知道答案，诚实说明
4. 不要添加任何"作为AI"或"根据我的分析"等表述
5. 直接以该博主的口吻回答
"""
        
        # 构建消息
        messages = [{"role": "system", "content": system_prompt}]
        
        # 添加上下文
        for ctx in context[-5:]:  # 最近5条
            messages.append({
                "role": ctx.get("role", "user"),
                "content": ctx.get("content", "")
            })
        
        # 添加当前消息
        messages.append({"role": "user", "content": user_message})
        
        # 调用LLM
        response = await llm_client.complete(
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )
        
        return {
            "content": response.content,
            "style_applied": True,
            "tokens_used": response.usage.total_tokens,
            "cost_usd": response.cost_usd
        }


class ContextEnrichmentNode(BaseNode):
    """上下文增强节点"""
    
    def __init__(self):
        super().__init__(NodeConfig(
            name="enrich_context",
            description="增强对话上下文",
            max_retries=1,
            timeout=10.0
        ))
    
    async def _execute(self, state: AgentState, **inputs) -> Dict[str, Any]:
        """执行上下文增强"""
        user_message = inputs.get("user_message", "")
        history = inputs.get("conversation_history", [])
        
        # 提取关键信息
        enriched = {
            "user_intent": self._extract_intent(user_message),
            "topic": self._extract_topic(user_message),
            "urgency": self._assess_urgency(user_message),
            "context_summary": self._summarize_context(history)
        }
        
        return enriched
    
    def _extract_intent(self, message: str) -> str:
        """提取用户意图"""
        # 简化实现，实际可用NLP
        if any(kw in message for kw in ["怎么", "如何", "怎样"]):
            return "seeking_advice"
        elif any(kw in message for kw in ["为什么", "什么原因"]):
            return "seeking_explanation"
        elif any(kw in message for kw in ["谢谢", "感谢"]):
            return "expressing_gratitude"
        return "general_inquiry"
    
    def _extract_topic(self, message: str) -> str:
        """提取主题"""
        # 简化实现
        return "general"
    
    def _assess_urgency(self, message: str) -> str:
        """评估紧急程度"""
        if any(kw in message for kw in ["急", "马上", "立刻", "紧急"]):
            return "high"
        return "normal"
    
    def _summarize_context(self, history: List[Dict]) -> str:
        """总结上下文"""
        if not history:
            return "新对话"
        return f"已有 {len(history)} 轮对话"


class QualityCheckNode(BaseNode):
    """质量检查节点"""
    
    def __init__(self):
        super().__init__(NodeConfig(
            name="quality_check",
            description="检查回复质量",
            max_retries=1,
            timeout=10.0,
            skip_on_error=True
        ))
    
    async def _execute(self, state: AgentState, **inputs) -> Dict[str, Any]:
        """执行质量检查"""
        response_content = inputs.get("generate_response_output", {}).get("content", "")
        style_description = inputs.get("style_description", "")
        
        checks = {
            "length_ok": len(response_content) >= 10,
            "has_content": len(response_content.strip()) > 0,
            "no_ai_phrases": not any(
                phrase in response_content
                for phrase in ["作为AI", "我是AI", "根据我的训练", "我没有个人"]
            ),
            "appropriate_length": 10 <= len(response_content) <= 4000
        }
        
        score = sum(checks.values()) / len(checks)
        
        return {
            "checks": checks,
            "score": score,
            "passed": score >= 0.75,
            "suggestions": self._generate_suggestions(checks)
        }
    
    def _generate_suggestions(self, checks: Dict[str, bool]) -> List[str]:
        """生成改进建议"""
        suggestions = []
        if not checks.get("no_ai_phrases"):
            suggestions.append("避免使用AI相关表述")
        if not checks.get("appropriate_length"):
            suggestions.append("调整回复长度")
        return suggestions


class BloggerAgent(BaseAgent):
    """
    博主风格模拟Agent
    
    完整的工作流：
    1. 上下文增强 -> 分析用户意图和主题
    2. 风格分析 -> 分析博主风格（如有材料）
    3. 回复生成 -> 生成符合风格的回复
    4. 质量检查 -> 检查回复质量
    """
    
    def __init__(self):
        config = AgentConfig(
            name="blogger_agent",
            description="模拟博主风格的对话Agent",
            max_iterations=10,
            enable_checkpoints=True,
            checkpoint_interval=3,
            auto_retry=True,
            max_errors=2
        )
        super().__init__(config)
        
        # 注册自定义节点
        self._register_nodes()
    
    def _register_nodes(self) -> None:
        """注册所有节点"""
        nodes = [
            ContextEnrichmentNode(),
            StyleAnalysisNode(),
            ResponseGenerationNode(),
            QualityCheckNode()
        ]
        
        for node in nodes:
            node_registry.register(node)
    
    def define_workflow(self) -> Workflow:
        """定义工作流"""
        workflow = Workflow(name="blogger_conversation")
        
        # 添加节点
        workflow.add_node("enrich_context", ["analyze_style"])
        workflow.add_node("analyze_style", ["generate_response"])
        workflow.add_node("generate_response", ["quality_check"])
        workflow.add_node("quality_check", [])  # 结束节点
        
        return workflow
    
    async def chat(
        self,
        blogger_profile: BloggerProfile,
        user_message: str,
        conversation_history: Optional[List[Dict]] = None,
        materials: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        进行对话
        
        Args:
            blogger_profile: 博主档案
            user_message: 用户消息
            conversation_history: 对话历史
            materials: 博主材料
            
        Returns:
            对话结果
        """
        input_data = {
            "blogger_id": blogger_profile.id,
            "blogger_name": blogger_profile.name,
            "blogger_description": blogger_profile.description,
            "style_description": blogger_profile.style_description,
            "user_message": user_message,
            "conversation_history": conversation_history or [],
            "materials": materials or []
        }
        
        result = await self.run(input_data)
        
        return {
            "response": result.get("generate_response", {}).get("content", ""),
            "quality_score": result.get("quality_check", {}).get("score", 0),
            "style_applied": result.get("generate_response", {}).get("style_applied", False),
            "metadata": {
                "tokens_used": result.get("generate_response", {}).get("tokens_used", 0),
                "cost_usd": result.get("generate_response", {}).get("cost_usd", 0)
            }
        }


# 使用装饰器定义的简单工具
@tool(name="search_blogger_content", description="搜索博主相关内容")
async def search_blogger_content(blogger_id: str, query: str, limit: int = 5) -> List[Dict]:
    """搜索博主相关内容"""
    # 这里应该集成实际的数据库查询
    logger.info(f"搜索博主内容: blogger_id={blogger_id}, query={query}")
    return [
        {"title": f"相关内容 {i}", "content": f"关于 {query} 的内容..."}
        for i in range(limit)
    ]


@tool(name="extract_style_keywords", description="提取风格关键词")
async def extract_style_keywords(text: str) -> List[str]:
    """提取风格关键词"""
    # 简化实现
    keywords = []
    if "幽默" in text or "搞笑" in text:
        keywords.append("humorous")
    if "专业" in text or "深入" in text:
        keywords.append("professional")
    if "简单" in text or "通俗" in text:
        keywords.append("simple")
    return keywords


# 使用装饰器定义的简单节点
@node(name="log_conversation", description="记录对话日志")
async def log_conversation(state: AgentState, **inputs) -> Dict[str, Any]:
    """记录对话"""
    logger.info(
        f"对话记录: agent={state.agent_name}, "
        f"node={state.current_node}"
    )
    return {"logged": True}


# 便捷函数
def create_blogger_agent() -> BloggerAgent:
    """创建博主Agent实例"""
    return BloggerAgent()
