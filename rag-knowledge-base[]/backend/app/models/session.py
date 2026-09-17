from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from app.database import Base
from sqlalchemy.orm import relationship


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(100), default="新会话", nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
