from pydantic import BaseModel
from typing import Optional, List
from src.models.models import MaterialType


# Blogger Schemas
class BloggerCreate(BaseModel):
    name: str
    description: Optional[str] = None
    avatar: Optional[str] = None
    color: Optional[str] = None # 前端有传 color 字段

class BloggerUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    avatar: Optional[str] = None
    color: Optional[str] = None # 前端有传 color 字段


# Material Schemas
class MaterialCreate(BaseModel):
    blogger_id: int
    title: str
    content: str
    material_type: MaterialType
    url: Optional[str] = None
    tags: Optional[str] = None

class MaterialUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    material_type: Optional[MaterialType] = None
    url: Optional[str] = None
    tags: Optional[str] = None


# Conversation Schemas
class ConversationCreate(BaseModel):
    blogger_id: int
    title: str

class MessageCreate(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    user_message: str
    style_description: Optional[str] = None # 暂时保留，后续可能从blogger获取
