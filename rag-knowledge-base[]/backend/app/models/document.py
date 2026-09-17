from sqlalchemy import Column, Integer, String, DateTime, Text, func
from app.database import Base
from sqlalchemy.orm import relationship


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    file_type = Column(String(20), default="txt", nullable=False)
    file_size = Column(Integer, default=0, nullable=False)
    chunk_count = Column(Integer, default=0, nullable=False)
    uploaded_at = Column(DateTime, server_default=func.now(), nullable=False)

    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")
