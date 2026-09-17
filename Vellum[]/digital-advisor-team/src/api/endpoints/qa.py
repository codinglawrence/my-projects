"""
智能问答助手 API

提供类似 Kimi/豆包的问答功能：
- 创建问答助手
- 上传知识库材料
- 多轮对话问答
- 流式响应
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json

from src.services.qa_agent import agent_manager, QAAgent
from src.core.logging import logger

router = APIRouter(prefix="/qa", tags=["智能问答"])


# ============ 数据模型 ============

class CreateAgentRequest(BaseModel):
    """创建Agent请求"""
    name: str
    description: str = ""


class CreateAgentResponse(BaseModel):
    """创建Agent响应"""
    agent_id: str
    name: str
    message: str


class AgentInfo(BaseModel):
    """Agent信息"""
    agent_id: str
    name: str
    description: str
    document_count: int
    conversation_count: int


class DocumentInfo(BaseModel):
    """文档信息"""
    id: str
    source: str
    doc_type: str
    chunk_count: int
    char_count: int
    created_at: str


class CreateConversationRequest(BaseModel):
    """创建对话请求"""
    title: str = ""


class CreateConversationResponse(BaseModel):
    """创建对话响应"""
    conversation_id: str
    title: str


class ChatRequest(BaseModel):
    """对话请求"""
    message: str
    conversation_id: Optional[str] = None
    stream: bool = True


class MessageInfo(BaseModel):
    """消息信息"""
    id: str
    role: str
    content: str
    sources: List[Dict[str, Any]]
    created_at: str


class ConversationInfo(BaseModel):
    """对话信息"""
    id: str
    title: str
    messages: List[MessageInfo]
    created_at: str
    updated_at: str


# ============ API端点 ============

@router.post("/agents", response_model=CreateAgentResponse)
async def create_agent(request: CreateAgentRequest):
    """创建智能问答助手"""
    try:
        agent = agent_manager.create_agent(
            name=request.name,
            description=request.description
        )
        
        return CreateAgentResponse(
            agent_id=agent.agent_id,
            name=agent.name,
            message=f"问答助手 '{agent.name}' 创建成功"
        )
    except Exception as e:
        logger.error(f"创建Agent失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents", response_model=List[AgentInfo])
async def list_agents():
    """列出所有问答助手"""
    try:
        agents = agent_manager.list_agents()
        return [
            AgentInfo(
                agent_id=agent.agent_id,
                name=agent.name,
                description=agent.description,
                document_count=len(agent.documents),
                conversation_count=len(agent.conversations)
            )
            for agent in agents
        ]
    except Exception as e:
        logger.error(f"获取Agent列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents/{agent_id}", response_model=AgentInfo)
async def get_agent(agent_id: str):
    """获取问答助手详情"""
    try:
        agent = agent_manager.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent不存在")
        
        return AgentInfo(
            agent_id=agent.agent_id,
            name=agent.name,
            description=agent.description,
            document_count=len(agent.documents),
            conversation_count=len(agent.conversations)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取Agent失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str):
    """删除问答助手"""
    try:
        agent = agent_manager.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent不存在")
        
        agent_manager.delete_agent(agent_id)
        return {"message": f"Agent '{agent.name}' 已删除"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除Agent失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ 知识库管理 ============

@router.post("/agents/{agent_id}/documents")
async def upload_document(
    agent_id: str,
    file: UploadFile = File(...)
):
    """上传文档到知识库"""
    try:
        agent = agent_manager.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent不存在")
        
        # 读取文件内容
        content = await file.read()
        
        # 添加文档
        doc = agent.add_document(file.filename, content)
        
        return {
            "message": f"文档 '{doc.source}' 上传成功",
            "document": DocumentInfo(
                id=doc.id,
                source=doc.source,
                doc_type=doc.doc_type,
                chunk_count=doc.metadata.get('chunk_count', 0),
                char_count=doc.metadata.get('char_count', 0),
                created_at=doc.created_at
            )
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"上传文档失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agents/{agent_id}/webpages")
async def add_webpage(
    agent_id: str,
    url: str = Form(...),
    html_content: str = Form(...)
):
    """添加网页到知识库"""
    try:
        agent = agent_manager.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent不存在")
        
        # 添加网页
        doc = agent.add_webpage(url, html_content)
        
        return {
            "message": f"网页 '{doc.source}' 添加成功",
            "document": DocumentInfo(
                id=doc.id,
                source=doc.source,
                doc_type=doc.doc_type,
                chunk_count=doc.metadata.get('chunk_count', 0),
                char_count=doc.metadata.get('char_count', 0),
                created_at=doc.created_at
            )
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"添加网页失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents/{agent_id}/documents", response_model=List[DocumentInfo])
async def list_documents(agent_id: str):
    """列出知识库中的所有文档"""
    try:
        agent = agent_manager.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent不存在")
        
        documents = agent.list_documents()
        return [
            DocumentInfo(
                id=doc.id,
                source=doc.source,
                doc_type=doc.doc_type,
                chunk_count=doc.metadata.get('chunk_count', 0),
                char_count=doc.metadata.get('char_count', 0),
                created_at=doc.created_at
            )
            for doc in documents
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取文档列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/agents/{agent_id}/documents/{doc_id}")
async def delete_document(agent_id: str, doc_id: str):
    """删除知识库中的文档"""
    try:
        agent = agent_manager.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent不存在")
        
        agent.delete_document(doc_id)
        return {"message": "文档已删除"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除文档失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ 对话管理 ============

@router.post("/agents/{agent_id}/conversations", response_model=CreateConversationResponse)
async def create_conversation(
    agent_id: str,
    request: CreateConversationRequest
):
    """创建新对话"""
    try:
        agent = agent_manager.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent不存在")
        
        conversation = agent.create_conversation(title=request.title)
        
        return CreateConversationResponse(
            conversation_id=conversation.id,
            title=conversation.title
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建对话失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents/{agent_id}/conversations", response_model=List[ConversationInfo])
async def list_conversations(agent_id: str):
    """列出所有对话"""
    try:
        agent = agent_manager.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent不存在")
        
        return [
            ConversationInfo(
                id=conv.id,
                title=conv.title,
                messages=[
                    MessageInfo(
                        id=msg.id,
                        role=msg.role,
                        content=msg.content,
                        sources=msg.sources,
                        created_at=msg.created_at
                    )
                    for msg in conv.messages
                ],
                created_at=conv.created_at,
                updated_at=conv.updated_at
            )
            for conv in agent.conversations.values()
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取对话列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents/{agent_id}/conversations/{conversation_id}", response_model=ConversationInfo)
async def get_conversation(agent_id: str, conversation_id: str):
    """获取对话详情"""
    try:
        agent = agent_manager.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent不存在")
        
        conversation = agent.conversations.get(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="对话不存在")
        
        return ConversationInfo(
            id=conversation.id,
            title=conversation.title,
            messages=[
                MessageInfo(
                    id=msg.id,
                    role=msg.role,
                    content=msg.content,
                    sources=msg.sources,
                    created_at=msg.created_at
                )
                for msg in conversation.messages
            ],
            created_at=conversation.created_at,
            updated_at=conversation.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取对话失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ 对话问答 ============

@router.post("/agents/{agent_id}/chat")
async def chat(
    agent_id: str,
    request: ChatRequest
):
    """
    对话问答（支持流式响应）
    
    流程：
    1. 接收用户问题
    2. 检索相关知识
    3. 生成回答（流式输出）
    4. 保存对话历史
    """
    try:
        agent = agent_manager.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent不存在")
        
        if request.stream:
            # 流式响应
            async def generate():
                async for chunk in agent.chat(
                    message=request.message,
                    conversation_id=request.conversation_id,
                    stream=True
                ):
                    yield f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"
                yield "data: [DONE]\n\n"
            
            return StreamingResponse(
                generate(),
                media_type="text/event-stream"
            )
        else:
            # 非流式响应
            response = ""
            async for chunk in agent.chat(
                message=request.message,
                conversation_id=request.conversation_id,
                stream=False
            ):
                response = chunk
            
            return {"response": response}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"对话失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agents/{agent_id}/conversations/{conversation_id}/messages")
async def send_message(
    agent_id: str,
    conversation_id: str,
    message: str = Form(...),
    stream: bool = Form(True)
):
    """发送消息（兼容表单提交）"""
    try:
        agent = agent_manager.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent不存在")
        
        if stream:
            async def generate():
                async for chunk in agent.chat(
                    message=message,
                    conversation_id=conversation_id,
                    stream=True
                ):
                    yield chunk
            
            return StreamingResponse(generate(), media_type="text/plain")
        else:
            response = ""
            async for chunk in agent.chat(
                message=message,
                conversation_id=conversation_id,
                stream=False
            ):
                response = chunk
            
            return {"response": response}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"发送消息失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
