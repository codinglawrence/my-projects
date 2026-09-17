"""
数字顾问团系统 - 主入口

生产级AI Agent平台入口点
"""

import asyncio
import sys
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# 项目根目录。用 __file__ 推导而非硬编码绝对路径，
# 保证项目被移动/克隆到任意位置后仍可直接 `python main.py` 启动。
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

FRONTEND_DIR = PROJECT_ROOT / "frontend"

from config.config import settings  # noqa: E402  (需在 sys.path 就绪后导入)
from src.core.logging import setup_logging, logger  # noqa: E402
from src.api.endpoints import conversation, knowledge_base, crawler, qa  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动
    logger.info(f"🚀 启动 {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"环境: {settings.ENVIRONMENT}")
    
    yield
    
    # 关闭
    logger.info("🛑 关闭应用...")


def create_app() -> FastAPI:
    """创建FastAPI应用"""
    # 配置日志
    setup_logging()
    
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="生产级数字顾问团AI Agent系统",
        lifespan=lifespan
    )
    
    # CORS中间件
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # 注册业务 API 路由
    app.include_router(conversation.router)
    app.include_router(knowledge_base.router)
    app.include_router(crawler.router)
    app.include_router(qa.router)

    @app.get("/health", tags=["system"])
    async def health_check():
        """存活探针：供负载均衡 / 容器编排调用。"""
        return {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    @app.get("/system/status", tags=["system"])
    async def system_status():
        """运行时概况。"""
        return {
            "status": "running",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "frontend_available": FRONTEND_DIR.is_dir(),
        }

    _mount_frontend(app)
    return app


def _mount_frontend(app: FastAPI) -> None:
    """把 frontend/ 挂成静态站点。

    必须在所有 API 路由注册之后调用：Starlette 按注册顺序匹配，
    挂在 "/" 的 StaticFiles 是兜底项，否则会吞掉 /conversation、/qa 等接口。
    html=True 让 "/" 自动返回 index.html。
    """
    if not FRONTEND_DIR.is_dir():
        logger.warning(f"前端目录不存在，仅提供 API：{FRONTEND_DIR}")

        @app.get("/")
        async def _api_only_root():
            return {
                "app": settings.APP_NAME,
                "version": settings.APP_VERSION,
                "status": "running",
                "message": "前端文件未找到，请检查 frontend 目录",
            }

        return

    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")


# 创建应用实例
app = create_app()


DEMO_QUESTIONS = (
    "你好，能介绍一下自己吗？",
    "人工智能会取代程序员吗？",
    "如何学习AI技术？",
)


async def demo() -> None:
    """命令行演示：直接驱动 SmartAgent 走完 RAG 检索 → ReAct 思考 → 回复。

    需要 .env 中配置有效的 LLM_API_KEY，否则会在第一轮就报错。
    """
    from src.services.agent_service import agent_manager

    setup_logging()
    separator = "=" * 60

    print(f"\n{separator}\n{settings.APP_NAME} - 命令行演示\n{separator}\n")

    agent = agent_manager.get_or_create_agent(
        blogger_id=-1,  # 负数 ID：仅用于演示，不与数据库中的真实博主冲突
        blogger_name="科技博主小明",
        style_description="语言轻松幽默，喜欢用类比解释复杂概念，常说「简单来说」「打个比方」",
    )
    print(f"[博主] {agent.blogger_name}\n[风格] {agent.style_description}\n")

    demo_conversation_id = -1
    for turn, question in enumerate(DEMO_QUESTIONS, start=1):
        print(f"\n{separator}\n对话轮次 {turn}\n{separator}")
        print(f"[用户] {question}")
        try:
            result = await agent.respond(question, conversation_id=demo_conversation_id)
        except Exception as exc:  # 演示脚本：单轮失败不应中断整场演示
            logger.exception("演示对话失败")
            print(f"[错误] {type(exc).__name__}: {exc}")
            continue

        print(f"[思考] {result['thought'][:120]}")
        print(f"[行动] {result['action']}")
        print(f"[博主] {result['response']}")
        print(f"[命中上下文] {result['context_used']}")

    print(f"\n{separator}\n记忆统计: {agent.rag_memory.get_stats()}\n演示完成\n{separator}\n")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="数字顾问团系统")
    parser.add_argument(
        "command",
        choices=["run", "demo", "api"],
        default="api",
        nargs="?",
        help="运行模式: run(运行), demo(演示), api(启动API服务)"
    )
    parser.add_argument("--host", default="0.0.0.0", help="API服务主机")
    parser.add_argument("--port", type=int, default=8000, help="API服务端口")
    parser.add_argument("--reload", action="store_true", help="开发模式自动重载")
    
    args = parser.parse_args()
    
    if args.command == "demo":
        # 运行演示
        asyncio.run(demo())
    elif args.command == "api" or args.command == "run":
        # 启动API服务
        import uvicorn
        uvicorn.run(
            "main:app",
            host=args.host,
            port=args.port,
            reload=args.reload,
            log_level="info"
        )
