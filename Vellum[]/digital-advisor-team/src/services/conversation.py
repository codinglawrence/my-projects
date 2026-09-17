from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from loguru import logger
from src.models.models import Conversation, Message, Blogger
from src.services.style_learning import style_learner


class ConversationManager:
    """对话管理模块"""
    
    async def create_conversation(self, db: AsyncSession, blogger_id: int, title: str) -> Conversation:
        """创建新对话"""
        logger.info(f"创建新对话，博主ID: {blogger_id}, 标题: {title}")
        
        conversation = Conversation(
            blogger_id=blogger_id,
            title=title
        )
        
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        
        logger.info(f"对话创建成功，ID: {conversation.id}")
        return conversation
    
    async def add_message(self, db: AsyncSession, conversation_id: int, role: str, content: str) -> Message:
        """添加消息"""
        logger.info(f"添加消息，对话ID: {conversation_id}, 角色: {role}")
        
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        
        db.add(message)
        await db.commit()
        await db.refresh(message)
        
        logger.info(f"消息添加成功，ID: {message.id}")
        return message
    
    async def get_conversation(self, db: AsyncSession, conversation_id: int) -> Optional[Conversation]:
        """获取对话"""
        result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
        return result.scalar_one_or_none()
    
    async def get_conversations_by_blogger(self, db: AsyncSession, blogger_id: int) -> List[Conversation]:
        """获取博主的所有对话"""
        result = await db.execute(select(Conversation).where(Conversation.blogger_id == blogger_id).order_by(Conversation.updated_at.desc()))
        return result.scalars().all()
    
    async def get_messages(self, db: AsyncSession, conversation_id: int) -> List[Message]:
        """获取对话的所有消息"""
        result = await db.execute(select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at))
        return result.scalars().all()
    
    async def generate_response(self, db: AsyncSession, conversation_id: int, user_message: str, style_description: str) -> str:
        """生成回复"""
        logger.info(f"生成回复，对话ID: {conversation_id}")
        
        # 先获取对话信息
        conversation = await self.get_conversation(db, conversation_id)
        if not conversation:
            raise ValueError("对话不存在")
        blogger_id = conversation.blogger_id
        
        # 获取对话历史
        messages = await self.get_messages(db, conversation_id)
        
        # 构建上下文
        context = []
        for msg in messages:
            context.append({"role": msg.role, "content": msg.content})
        
        # 生成回复
        response = await style_learner.generate_response(
            blogger_id=blogger_id,
            style_description=style_description,
            user_message=user_message,
            context=context
        )
        
        # 添加回复消息
        await self.add_message(db, conversation_id, "assistant", response)
        
        return response
    
    async def generate_stream_response(self, db: AsyncSession, conversation_id: int, user_message: str, style_description: str) -> Any:
        """流式生成回复"""
        logger.info(f"流式生成回复，对话ID: {conversation_id}")
        
        # 先获取对话信息
        conversation = await self.get_conversation(db, conversation_id)
        if not conversation:
            raise ValueError("对话不存在")
        blogger_id = conversation.blogger_id
        
        # 获取对话历史
        messages = await self.get_messages(db, conversation_id)
        
        # 构建上下文
        context = []
        for msg in messages:
            context.append({"role": msg.role, "content": msg.content})
        
        # 流式生成回复
        full_response_content = ""
        async for chunk in style_learner.generate_stream_response(
            blogger_id=blogger_id,
            style_description=style_description,
            user_message=user_message,
            context=context
        ):
            full_response_content += chunk
            yield chunk
        
        # 收集完整回复并添加到数据库
        await self.add_message(db, conversation_id, "assistant", full_response_content)


# 全局对话管理实例
conversation_manager = ConversationManager()
