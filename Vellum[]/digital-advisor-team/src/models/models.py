from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from src.db.base import Base


class MaterialType(str, enum.Enum):
    """材料类型"""
    VIDEO = "video"
    ARTICLE = "article"
    BOOK = "book"
    AUDIO = "audio"
    OTHER = "other"


class Blogger(Base):
    """博主模型"""
    __tablename__ = "bloggers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    avatar = Column(String(255), nullable=True)
    color = Column(String(7), nullable=True, default="#2A6F7A") # 新增颜色字段，用于前端展示
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    materials = relationship("Material", back_populates="blogger", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="blogger", cascade="all, delete-orphan")


class Material(Base):
    """材料模型"""
    __tablename__ = "materials"
    
    id = Column(Integer, primary_key=True, index=True)
    blogger_id = Column(Integer, ForeignKey("bloggers.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    type = Column(SQLEnum(MaterialType), nullable=False)
    url = Column(String(255), nullable=True)
    tags = Column(String(255), nullable=True)  # 逗号分隔的标签
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    blogger = relationship("Blogger", back_populates="materials")


class Conversation(Base):
    """对话历史模型"""
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    blogger_id = Column(Integer, ForeignKey("bloggers.id"), nullable=False)
    title = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    blogger = relationship("Blogger", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    """对话消息模型"""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role = Column(String(50), nullable=False)  # user 或 assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    conversation = relationship("Conversation", back_populates="messages")
