from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1)


class MessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    citations: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    items: List[MessageResponse]
    total: int
