from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, func
from app.database import Base
from sqlalchemy.orm import relationship


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    citations = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    session = relationship("Session", back_populates="messages")
