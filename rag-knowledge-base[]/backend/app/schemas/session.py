from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SessionCreate(BaseModel):
    title: Optional[str] = "新会话"


class SessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SessionListResponse(BaseModel):
    items: List[SessionResponse]
    total: int
