import asyncio
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.db.database import engine
from src.db.base import Base
from src.models.models import Blogger, Material, Conversation, Message
from src.services.knowledge_base import knowledge_base_manager
from src.services.conversation import conversation_manager
from src.services.style_learning import style_learner
from src.llm.client import llm_client


async def init_db():
    """初始化数据库"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("数据库初始化完成")


async def test_knowledge_base():
    """测试知识库管理"""
    from src.db.database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as db:
        # 创建博主
        blogger = await knowledge_base_manager.create_blogger(db, "测试博主", "这是一个测试博主", "https://example.com/avatar.jpg")
        print(f"创建博主成功: {blogger.name}")
        
        # 创建材料
        material = await knowledge_base_manager.create_material(
            db, 
            blogger.id, 
            "测试材料", 
            "这是测试材料的内容", 
            "article", 
            "https://example.com/article", 
            "测试,示例"
        )
        print(f"创建材料成功: {material.title}")
        
        # 获取材料
        materials = await knowledge_base_manager.get_materials_by_blogger(db, blogger.id)
        print(f"获取材料成功，数量: {len(materials)}")
        
        return blogger, material


async def test_conversation():
    """测试对话管理"""
    from src.db.database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as db:
        # 获取博主
        bloggers = await knowledge_base_manager.get_all_bloggers(db)
        if not bloggers:
            print("没有博主，先创建博主")
            blogger = await knowledge_base_manager.create_blogger(db, "测试博主", "这是一个测试博主")
        else:
            blogger = bloggers[0]
        
        # 创建对话
        conversation = await conversation_manager.create_conversation(db, blogger.id, "测试对话")
        print(f"创建对话成功: {conversation.title}")
        
        # 添加消息
        message = await conversation_manager.add_message(db, conversation.id, "user", "你好，测试一下")
        print(f"添加消息成功: {message.content}")
        
        return conversation


async def test_style_learning():
    """测试风格学习"""
    from src.db.database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as db:
        # 获取博主和材料
        bloggers = await knowledge_base_manager.get_all_bloggers(db)
        if not bloggers:
            print("没有博主，先创建博主")
            blogger = await knowledge_base_manager.create_blogger(db, "测试博主", "这是一个测试博主")
            material = await knowledge_base_manager.create_material(
                db, 
                blogger.id, 
                "测试材料", 
                "这是测试材料的内容，风格测试", 
                "article"
            )
        else:
            blogger = bloggers[0]
            materials = await knowledge_base_manager.get_materials_by_blogger(db, blogger.id)
            if not materials:
                material = await knowledge_base_manager.create_material(
                    db, 
                    blogger.id, 
                    "测试材料", 
                    "这是测试材料的内容，风格测试", 
                    "article"
                )
            else:
                material = materials[0]
        
        # 学习风格
        style_result = await style_learner.learn_style(blogger.id, [material])
        print("风格学习成功")
        
        # 生成回复
        response = await style_learner.generate_response(blogger.id, style_result["style_description"], "你好，测试一下")
        print(f"生成回复成功: {response[:50]}...")
        
        return style_result


async def main():
    """主测试函数"""
    print("开始系统测试...")
    
    # 初始化数据库
    await init_db()
    
    # 测试知识库
    await test_knowledge_base()
    
    # 测试对话
    await test_conversation()
    
    # 测试风格学习
    await test_style_learning()
    
    print("系统测试完成！")


if __name__ == "__main__":
    asyncio.run(main())
