import asyncio
from src.db.database import engine
from src.db.base import Base
from src.models.models import Blogger, Material, Conversation, Message


async def init_db():
    """初始化数据库表结构"""
    async with engine.begin() as conn:
        # 先删除所有表（如果存在）
        await conn.run_sync(Base.metadata.drop_all)
        # 创建所有表
        await conn.run_sync(Base.metadata.create_all)
    print("数据库初始化完成")


if __name__ == "__main__":
    asyncio.run(init_db())
