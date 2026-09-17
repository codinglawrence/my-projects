"""
数据库初始化脚本

用法：python init_db.py
"""
import asyncio
import sys
from pathlib import Path

# 将项目根目录加入 sys.path（用 __file__ 推导，不硬编码绝对路径）
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy.ext.asyncio import create_async_engine
from src.db.base import Base
from src.models.models import Blogger, Material, Conversation, Message  # noqa: F401 确保所有模型被 Base 发现
from config.config import settings


async def init_database():
    """初始化数据库"""
    print(f"正在初始化数据库: {settings.DATABASE_URL}")
    
    # 创建引擎
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=True,
        future=True
    )
    
    # 创建所有表
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    await engine.dispose()
    print("数据库初始化完成！")


if __name__ == "__main__":
    asyncio.run(init_database())
