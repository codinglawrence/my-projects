from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, func
from app.database import Base
from sqlalchemy.orm import relationship


class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    vector_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    document = relationship("Document", back_populates="chunks")
