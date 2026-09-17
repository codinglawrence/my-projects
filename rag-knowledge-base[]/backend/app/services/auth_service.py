from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User
from app.schemas.auth import UserResponse, TokenResponse

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, username: str, password: str) -> TokenResponse:
        existing = self.db.query(User).filter(User.username == username).first()
        if existing:
            raise ValueError("用户名已存在")

        user = User(
            username=username,
            password_hash=pwd_context.hash(password),
            role="user",
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        token = self._create_token(user.id, user.role)
        return TokenResponse(token=token, user=self._user_to_response(user))

    def login(self, username: str, password: str) -> TokenResponse:
        user = self.db.query(User).filter(User.username == username).first()
        if not user:
            raise ValueError("用户名或密码错误")
        if not pwd_context.verify(password, user.password_hash):
            raise ValueError("用户名或密码错误")

        token = self._create_token(user.id, user.role)
        return TokenResponse(token=token, user=self._user_to_response(user))

    def change_password(self, user_id: int, old_password: str, new_password: str):
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("用户不存在")
        if not pwd_context.verify(old_password, user.password_hash):
            raise ValueError("旧密码错误")

        user.password_hash = pwd_context.hash(new_password)
        self.db.commit()

    def get_current_user(self, token: str) -> User:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            user_id_str = payload.get("sub")
            user_id: int = int(user_id_str) if user_id_str else None
            if user_id is None:
                raise ValueError("无效的凭据")
        except JWTError:
            raise ValueError("无效的凭据")

        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("用户不存在")
        return user

    def _create_token(self, user_id: int, role: str) -> str:
        expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRE_HOURS)
        payload = {"sub": str(user_id), "role": role, "exp": expire}
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    @staticmethod
    def _user_to_response(user: User) -> UserResponse:
        return UserResponse(
            id=user.id,
            username=user.username,
            role=user.role,
            created_at=user.created_at,
        )
