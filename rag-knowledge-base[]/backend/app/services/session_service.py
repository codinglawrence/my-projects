from typing import List, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.session import Session as SessionModel
from app.models.message import Message


class SessionService:
    def __init__(self, db: Session):
        self.db = db

    def get_owned_session(self, session_id: int, user_id: int) -> SessionModel:
        session = self.db.query(SessionModel).filter(
            SessionModel.id == session_id,
            SessionModel.user_id == user_id,
        ).first()
        if not session:
            raise PermissionError("会话不存在或无权访问")
        return session

    def create_session(self, user_id: int, title: str = "新会话") -> SessionModel:
        session = SessionModel(user_id=user_id, title=title)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_sessions(self, user_id: int) -> List[SessionModel]:
        return (
            self.db.query(SessionModel)
            .filter(SessionModel.user_id == user_id)
            .order_by(SessionModel.updated_at.desc())
            .all()
        )

    def delete_session(self, session_id: int):
        session = self.db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if session:
            self.db.delete(session)
            self.db.commit()

    def get_messages(
        self, session_id: int, page: int = 1, size: int = 50
    ) -> Tuple[List[Message], int]:
        query = self.db.query(Message).filter(Message.session_id == session_id)
        total = query.count()
        items = (
            query.order_by(Message.created_at.asc())
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )
        return items, total

    def add_message(
        self, session_id: int, role: str, content: str, citations: str = None
    ) -> Message:
        msg = Message(
            session_id=session_id,
            role=role,
            content=content,
            citations=citations,
        )
        self.db.add(msg)

        session = self.db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if session:
            session.updated_at = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(msg)
        return msg

    def auto_name_session(self, session_id: int, first_message: str):
        session = self.db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if session and session.title == "新会话":
            name = first_message[:20].replace("\n", " ").strip()
            if name:
                session.title = name
                self.db.commit()

    def get_history_for_prompt(self, session_id: int, limit: int = 10) -> str:
        """Get recent messages formatted as history for RAG prompt."""
        messages = (
            self.db.query(Message)
            .filter(Message.session_id == session_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
            .all()
        )
        messages = list(reversed(messages))
        lines = []
        for msg in messages:
            role_label = "用户" if msg.role == "user" else "助手"
            lines.append(f"{role_label}：{msg.content[:300]}")
        return "\n".join(lines)
