"""
智能 Agent 服务（RAG 增强版）

提供真正的 Agent 能力：
- RAG 记忆管理（向量检索 + 长期记忆）
- 推理能力（ReAct 模式）
- 工具调用
- 个性化回复
"""

import json
from typing import Dict, Any, List, Optional, AsyncGenerator
from dataclasses import dataclass, field
from datetime import datetime

from src.llm.client import llm_client
from src.core.logging import logger
from src.services.rag_service import RAGMemory


@dataclass
class AgentThought:
    """Agent 思考过程"""
    thought: str
    action: Optional[str] = None
    action_input: Optional[str] = None
    observation: Optional[str] = None
    final_answer: Optional[str] = None


class SmartAgent:
    """
    智能 Agent（RAG 增强版）
    
    具备以下能力：
    1. RAG 记忆 - 向量检索 + 长期记忆，强大的上下文能力
    2. 推理能力 - 使用 ReAct 模式进行思考-行动-观察
    3. 个性化 - 根据博主风格调整回复
    4. 主动交互 - 主动提问、澄清、建议
    """
    
    def __init__(self, blogger_id: int, blogger_name: str, style_description: str):
        self.blogger_id = blogger_id
        self.blogger_name = blogger_name
        self.style_description = style_description
        
        # 使用 RAG 记忆系统
        self.rag_memory = RAGMemory()
        
        # 用户画像
        self.user_profile: Dict[str, Any] = {
            "interests": [],
            "preferences": {},
            "conversation_count": 0,
            "last_topics": []
        }
        
    async def think(self, user_message: str, context: str = "") -> AgentThought:
        """
        思考过程（ReAct 模式）
        
        Thought -> Action -> Observation -> Final Answer
        """
        # 构建系统提示
        system_prompt = f"""你是 {self.blogger_name}，一个有个性的 AI 助手。

你的风格：{self.style_description}

**回答原则（重要）：**
1. **优先使用【个人知识库材料】中的信息** - 这是用户上传的专属内容，权重最高
2. **知识库材料不足时**，可以使用你的预训练知识补充，但要明确区分
3. **保持个人风格** - 模仿知识库材料中的表达方式和观点
4. **如果材料中没有相关信息**，诚实告知，不要编造

你必须使用以下格式进行思考：

Thought: 分析用户的问题，思考如何回答。考虑：
1. 用户的核心意图是什么？
2. 【个人知识库材料】中有什么相关信息？（优先）
3. 是否需要结合你的预训练知识补充？
4. 你需要调用什么行动？

Action: 选择行动（respond/search/ask_clarify/recall_memory/none）
- respond: 直接回答用户
- search: 需要搜索知识库
- ask_clarify: 需要用户澄清问题
- recall_memory: 需要回忆更多历史信息
- none: 不需要行动

Action Input: 行动的具体内容

Observation: 行动的结果（如果需要）

Final Answer: 最终给用户的回复。要求：
1. **优先基于【个人知识库材料】回答**
2. 保持你的个性和风格
3. 如果引用了材料内容，自然融入回答
4. 材料不足时可以补充预训练知识，但要说明
5. 主动、有洞察力

记住：
- 你是一个有记忆、有性格的 Agent，不是简单的聊天机器人
- **个人知识库材料是最高优先级信息源**
- 利用提供的上下文给出个性化回答
- 如果不确定，主动提问
- 保持对话的连贯性"""

        # 构建用户提示
        user_prompt = f"""【相关上下文】
{context if context else "（无相关历史上下文）"}

【用户画像】
- 对话次数: {self.user_profile['conversation_count']}
- 兴趣领域: {', '.join(self.user_profile['interests']) if self.user_profile['interests'] else '未知'}
- 最近话题: {', '.join(self.user_profile['last_topics'][-3:]) if self.user_profile['last_topics'] else '无'}

【当前消息】
用户: {user_message}

请按照格式思考并回答："""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        # 调用 LLM
        response = await llm_client.chat_completion(messages, temperature=0.7)
        content = response.get("content", "")
        
        # 解析思考过程
        return self._parse_thought(content)
    
    def _parse_thought(self, content: str) -> AgentThought:
        """解析思考内容"""
        thought = ""
        action = None
        action_input = None
        observation = None
        final_answer = None
        
        lines = content.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if line.startswith('Thought:'):
                current_section = 'thought'
                thought = line[8:].strip()
            elif line.startswith('Action:'):
                current_section = 'action'
                action = line[7:].strip()
            elif line.startswith('Action Input:'):
                current_section = 'action_input'
                action_input = line[13:].strip()
            elif line.startswith('Observation:'):
                current_section = 'observation'
                observation = line[12:].strip()
            elif line.startswith('Final Answer:'):
                current_section = 'final_answer'
                final_answer = line[13:].strip()
            elif current_section and line:
                if current_section == 'thought':
                    thought += ' ' + line
                elif current_section == 'final_answer':
                    final_answer += ' ' + line
        
        return AgentThought(
            thought=thought,
            action=action,
            action_input=action_input,
            observation=observation,
            final_answer=final_answer
        )
    
    async def respond(
        self,
        user_message: str,
        conversation_id: int,
        load_history: bool = True
    ) -> Dict[str, Any]:
        """
        生成回复（完整的 Agent 流程，带 RAG）
        """
        logger.info(f"Agent {self.blogger_name} 处理消息: {user_message[:50]}...")
        
        # 1. 检索相关上下文（RAG）- 混合模式：个人材料 + 对话历史
        context = ""
        if load_history:
            context = await self.rag_memory.retrieve_relevant_context(
                query=user_message,
                conversation_id=conversation_id,
                blogger_id=self.blogger_id,  # 传入博主ID以检索个人知识库
                top_k=5,
                include_short_term=True
            )
        
        # 2. 思考
        thought = await self.think(user_message, context)
        
        # 3. 执行行动
        if thought.action == "ask_clarify":
            response = thought.action_input or thought.final_answer or "能详细说说你的问题吗？"
        elif thought.action == "recall_memory":
            # 检索更多记忆
            more_context = await self.rag_memory.retrieve_relevant_context(
                query=thought.action_input or user_message,
                conversation_id=conversation_id,
                top_k=10,
                include_short_term=False
            )
            # 重新思考
            thought = await self.think(user_message, context + "\n" + more_context)
            response = thought.final_answer or thought.thought
        else:
            response = thought.final_answer or thought.thought
        
        # 4. 更新记忆（RAG）
        self.rag_memory.add_message(
            role="user",
            content=user_message,
            conversation_id=conversation_id,
            metadata={"thought": thought.thought, "action": thought.action}
        )
        self.rag_memory.add_message(
            role="assistant",
            content=response,
            conversation_id=conversation_id,
            metadata={"agent_name": self.blogger_name}
        )
        
        # 5. 更新用户画像
        self.user_profile['conversation_count'] += 1
        # 提取关键词（简化版）
        keywords = self._extract_keywords(user_message)
        self.user_profile['last_topics'].extend(keywords)
        self.user_profile['last_topics'] = self.user_profile['last_topics'][-10:]
        
        return {
            "response": response,
            "thought": thought.thought,
            "action": thought.action,
            "agent_name": self.blogger_name,
            "context_used": bool(context),
            "memory_stats": self.rag_memory.get_stats()
        }
    
    def _extract_keywords(self, text: str) -> List[str]:
        """提取关键词（简化版）"""
        # 这里可以使用更复杂的 NLP 方法
        # 简化版：提取较长的名词短语
        words = text.split()
        keywords = [w for w in words if len(w) > 2 and not w in ['的', '了', '是', '我', '你', '在', '有']]
        return keywords[:3]
    
    async def stream_respond(self, user_message: str, conversation_id: int) -> AsyncGenerator[str, None]:
        """
        流式生成回复
        """
        result = await self.respond(user_message, conversation_id)
        
        # 模拟流式输出
        response = result["response"]
        words = response.split()
        
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
    
    def clear_memory(self, conversation_id: Optional[int] = None):
        """清除记忆"""
        self.rag_memory.clear_memory(conversation_id)
        if not conversation_id:
            self.user_profile = {
                "interests": [],
                "preferences": {},
                "conversation_count": 0,
                "last_topics": []
            }


class AgentManager:
    """Agent 管理器"""
    
    def __init__(self):
        self.agents: Dict[int, SmartAgent] = {}
    
    def get_or_create_agent(self, blogger_id: int, blogger_name: str, style_description: str) -> SmartAgent:
        """获取或创建 Agent"""
        if blogger_id not in self.agents:
            self.agents[blogger_id] = SmartAgent(
                blogger_id=blogger_id,
                blogger_name=blogger_name,
                style_description=style_description
            )
        return self.agents[blogger_id]
    
    def clear_agent(self, blogger_id: int):
        """清除 Agent（当需要重置记忆时）"""
        if blogger_id in self.agents:
            self.agents[blogger_id].clear_memory()
            del self.agents[blogger_id]


# 全局 Agent 管理器
agent_manager = AgentManager()
