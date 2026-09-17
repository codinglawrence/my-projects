from fastapi import FastAPI
from src.api.endpoints import conversation, knowledge_base, crawler, qa
from config.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="数字顾问团系统API - 智能问答助手"
)

# 注册路由
app.include_router(conversation.router)
app.include_router(knowledge_base.router)
app.include_router(crawler.router)
app.include_router(qa.router)  # 新的智能问答API

@app.get("/")
async def root():
    """根路径"""
    return {"message": "数字顾问团系统 API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}
