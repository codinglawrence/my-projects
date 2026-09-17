from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.session_service import SessionService
from app.schemas.session import SessionCreate, SessionResponse, SessionListResponse
from app.schemas.auth import ApiResponse
from app.schemas.chat import MessageResponse, MessageListResponse

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("", response_model=ApiResponse)
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = SessionService(db)
    sessions = svc.get_sessions(current_user.id)
    return ApiResponse(data={
        "items": [SessionResponse.model_validate(s).model_dump() for s in sessions],
        "total": len(sessions),
    })


@router.post("", response_model=ApiResponse)
def create_session(
    req: SessionCreate = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = SessionService(db)
    title = req.title if req else "新会话"
    session = svc.create_session(current_user.id, title)
    return ApiResponse(data=SessionResponse.model_validate(session).model_dump(), message="创建成功")


@router.delete("/{session_id}", response_model=ApiResponse)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = SessionService(db)
    try:
        svc.get_owned_session(session_id, current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    svc.delete_session(session_id)
    return ApiResponse(message="删除成功")


@router.get("/{session_id}/messages", response_model=ApiResponse)
def get_messages(
    session_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = SessionService(db)
    try:
        svc.get_owned_session(session_id, current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    messages, total = svc.get_messages(session_id, page=page, size=size)
    return ApiResponse(data={
        "items": [MessageResponse.model_validate(m).model_dump() for m in messages],
        "total": total,
    })
