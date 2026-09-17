from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class TextEntryRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)


class DocumentResponse(BaseModel):
    id: int
    title: str
    file_type: str
    file_size: int
    chunk_count: int
    uploaded_at: datetime

    class Config:
        from_attributes = True


class DocumentDetailResponse(DocumentResponse):
    content: str
    chunks: Optional[List["ChunkResponse"]] = None


class ChunkResponse(BaseModel):
    id: int
    chunk_index: int
    content: str
    vector_id: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    items: List[DocumentResponse]
    total: int


class RebuildResponse(BaseModel):
    document_count: int
    chunk_count: int
