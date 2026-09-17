from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
from src.db.database import get_db
from src.services.conversation import conversation_manager
from src.models.models import Conversation, Message
from src.api.schemas import ConversationCreate, MessageCreate, ChatRequest

router = APIRouter(prefix="/conversation", tags=["conversations"])


@router.post("/conversations", response_model=Dict[str, Any])
async def create_conversation(conversation_data: ConversationCreate, db: AsyncSession = Depends(get_db)):
    """创建新对话"""
    try:
        conversation = await conversation_manager.create_conversation(db, **conversation_data.dict())
        return {
            "id": conversation.id,
            "blogger_id": conversation.blogger_id,
            "title": conversation.title,
            "created_at": conversation.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bloggers/{blogger_id}/conversations", response_model=List[Dict[str, Any]])
async def get_conversations_by_blogger(blogger_id: int, db: AsyncSession = Depends(get_db)):
    """获取博主的所有对话"""
    try:
        conversations = await conversation_manager.get_conversations_by_blogger(db, blogger_id)
        return [
            {
                "id": conv.id,
                "title": conv.title,
                "created_at": conv.created_at,
                "updated_at": conv.updated_at
            }
            for conv in conversations
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}/messages", response_model=List[Dict[str, Any]])
async def get_messages(conversation_id: int, db: AsyncSession = Depends(get_db)):
    """获取对话的所有消息"""
    try:
        messages = await conversation_manager.get_messages(db, conversation_id)
        return [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at
            }
            for msg in messages
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations/{conversation_id}/messages", response_model=Dict[str, Any])
async def add_message(conversation_id: int, message_data: MessageCreate, db: AsyncSession = Depends(get_db)):
    """添加消息"""
    try:
        message = await conversation_manager.add_message(db, conversation_id, **message_data.dict())
        return {
            "id": message.id,
            "role": message.role,
            "content": message.content,
            "created_at": message.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations/{conversation_id}/chat", response_model=Dict[str, Any])
async def generate_response(conversation_id: int, chat_request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """生成 RAG Agent 回复"""
    try:
        # 获取对话信息
        from src.models.models import Blogger
        from sqlalchemy import select
        
        conversation = await conversation_manager.get_conversation(db, conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="对话不存在")
        
        # 获取博主信息
        result = await db.execute(select(Blogger).where(Blogger.id == conversation.blogger_id))
        blogger = result.scalar_one_or_none()
        if not blogger:
            raise HTTPException(status_code=404, detail="博主不存在")
        
        # 使用 RAG 增强的 Agent 生成回复
        from src.services.agent_service import agent_manager
        
        agent = agent_manager.get_or_create_agent(
            blogger_id=blogger.id,
            blogger_name=blogger.name,
            style_description=chat_request.style_description or blogger.description or "通用风格"
        )
        
        # 生成回复（RAG Agent 会自动管理记忆）
        result = await agent.respond(
            user_message=chat_request.user_message,
            conversation_id=conversation_id,
            load_history=True
        )
        
        # 保存消息到数据库
        await conversation_manager.add_message(db, conversation_id, "user", chat_request.user_message)
        await conversation_manager.add_message(db, conversation_id, "assistant", result["response"])
        
        return {
            "response": result["response"],
            "thought": result.get("thought"),
            "action": result.get("action"),
            "agent_name": result.get("agent_name"),
            "context_used": result.get("context_used", False),
            "memory_stats": result.get("memory_stats", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}/memory-stats", response_model=Dict[str, Any])
async def get_memory_stats(conversation_id: int, db: AsyncSession = Depends(get_db)):
    """获取对话的记忆统计信息"""
    try:
        from src.services.agent_service import agent_manager
        
        conversation = await conversation_manager.get_conversation(db, conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="对话不存在")
        
        agent = agent_manager.get_or_create_agent(
            blogger_id=conversation.blogger_id,
            blogger_name="",
            style_description=""
        )
        
        return {
            "conversation_id": conversation_id,
            "memory_stats": agent.rag_memory.get_stats(),
            "user_profile": agent.user_profile
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
