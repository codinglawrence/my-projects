from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User
from app.models.document import Document
from app.models.session import Session as SessionModel
from app.models.message import Message


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_stats(self) -> dict:
        user_count = self.db.query(User).count()
        doc_count = self.db.query(Document).count()
        session_count = self.db.query(SessionModel).count()

        total_qa = self.db.query(Message).filter(Message.role == "user").count()

        today = datetime.utcnow().date()
        today_qa = (
            self.db.query(Message)
            .filter(Message.role == "user")
            .filter(func.date(Message.created_at) == today)
            .count()
        )

        return {
            "user_count": user_count,
            "document_count": doc_count,
            "session_count": session_count,
            "today_qa_count": today_qa,
            "total_qa_count": total_qa,
        }
