import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.database import get_db
from app.services.auth_service import AuthService
from app.schemas.auth import RegisterRequest, LoginRequest, ChangePasswordRequest, ApiResponse
from app.middleware.auth import get_current_user

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=ApiResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    auth_svc = AuthService(db)
    try:
        result = auth_svc.register(req.username, req.password)
        return ApiResponse(data={"token": result.token, "user": result.user.model_dump()})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=ApiResponse)
@limiter.limit("5/minute")
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    auth_svc = AuthService(db)
    try:
        result = auth_svc.login(req.username, req.password)
        logger.info("User '%s' logged in successfully.", req.username)
        return ApiResponse(data={"token": result.token, "user": result.user.model_dump()})
    except ValueError as e:
        logger.warning("Failed login attempt for user '%s'.", req.username)
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/password", response_model=ApiResponse)
def change_password(
    req: ChangePasswordRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    auth_svc = AuthService(db)
    try:
        auth_svc.change_password(current_user.id, req.old_password, req.new_password)
        return ApiResponse(message="密码修改成功")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
