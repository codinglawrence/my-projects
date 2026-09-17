from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.database import init_db
from app.init_admin import init_admin
from app.api.auth import router as auth_router, limiter as auth_limiter
from app.api.session import router as session_router
from app.api.chat import router as chat_router
from app.api.knowledge import router as knowledge_router
from app.api.dashboard import router as dashboard_router
from app.middleware.auth import get_current_user
from app.schemas.auth import ApiResponse, UserResponse
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    init_admin()
    yield


app = FastAPI(
    title="RAG 企业级知识库问答系统",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = auth_limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS 来源可配置（见 config.CORS_ORIGINS）。
# 注意：allow_credentials=True 时 allow_origins 不能是通配符 "*"，
# 因此 * 模式下关闭 credentials，具体来源模式下保持 credentials 开启。
_cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
_cors_allow_all = "*" in _cors_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _cors_allow_all else _cors_origins,
    allow_credentials=False if _cors_allow_all else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(session_router)
app.include_router(chat_router)
app.include_router(knowledge_router)
app.include_router(dashboard_router)


@app.get("/api/user/me")
def get_me(user=Depends(get_current_user)):
    return ApiResponse(data=UserResponse.model_validate(user).model_dump())


@app.get("/health")
def health_check():
    return {"status": "ok"}

