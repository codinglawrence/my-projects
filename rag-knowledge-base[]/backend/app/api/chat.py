import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.session_service import SessionService
from app.services.rag_service import RAGService
from app.schemas.chat import SendMessageRequest
from app.schemas.auth import ApiResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/sessions", tags=["chat"])


@router.post("/{session_id}/send")
async def send_message(
    session_id: int,
    req: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = SessionService(db)
    rag_svc = RAGService()

    try:
        svc.get_owned_session(session_id, current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    svc.add_message(session_id, role="user", content=req.content)

    message_count = svc.get_messages(session_id, page=1, size=1)[1]
    if message_count == 1:
        svc.auto_name_session(session_id, req.content)

    async def event_stream():
        full_answer = ""
        citations = []
        error_msg = None

        try:
            async for sse_data in rag_svc.generate_answer(session_id, req.content, db):
                full_answer += _extract_content(sse_data)
                data_line = sse_data.strip()
                if data_line.startswith("data: "):
                    try:
                        payload = json.loads(data_line[6:])
                        if payload.get("type") == "done":
                            citations = payload.get("citations", [])
                        elif payload.get("type") == "error":
                            error_msg = payload.get("message", "生成失败")
                    except json.JSONDecodeError:
                        pass
                yield sse_data

            citations_json = json.dumps(citations, ensure_ascii=False) if citations else None
            # On LLM error, persist the error text instead of an empty message.
            content = error_msg if error_msg else full_answer
            svc.add_message(
                session_id,
                role="assistant",
                content=content,
                citations=citations_json,
            )
        except (ConnectionError, TimeoutError, ValueError, RuntimeError) as e:
            logger.error("SSE stream error for session %d: %s", session_id, str(e))
            error_data = json.dumps({"type": "error", "message": str(e)}, ensure_ascii=False)
            yield f"data: {error_data}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


def _extract_content(sse_data: str) -> str:
    data_line = sse_data.strip()
    if data_line.startswith("data: "):
        try:
            payload = json.loads(data_line[6:])
            if payload.get("type") == "chunk":
                return payload.get("content", "")
        except json.JSONDecodeError:
            pass
    return ""


@router.get("/{session_id}/suggestions", response_model=ApiResponse)
def get_suggestions(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = SessionService(db)
    try:
        svc.get_owned_session(session_id, current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    rag_svc = RAGService()
    suggestions = rag_svc.get_question_suggestions(5)
    return ApiResponse(data={"suggestions": suggestions})
