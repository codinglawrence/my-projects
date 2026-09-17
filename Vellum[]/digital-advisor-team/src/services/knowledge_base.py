from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from loguru import logger
from src.models.models import Blogger, Material, MaterialType
from src.services.rag_service import RAGMemory, EmbeddingService, VectorStore
import hashlib
from datetime import datetime


class KnowledgeBaseManager:
    """知识库管理模块"""
    
    async def create_blogger(self, db: AsyncSession, name: str, description: str = None, avatar: str = None, color: str = None) -> Blogger:
        """创建博主"""
        logger.info(f"创建博主: {name}")
        
        blogger = Blogger(
            name=name,
            description=description,
            avatar=avatar,
            color=color
        )
        
        db.add(blogger)
        await db.commit()
        await db.refresh(blogger)
        
        logger.info(f"博主创建成功，ID: {blogger.id}")
        return blogger
    
    async def get_blogger(self, db: AsyncSession, blogger_id: int) -> Optional[Blogger]:
        """获取博主"""
        result = await db.execute(select(Blogger).where(Blogger.id == blogger_id))
        return result.scalar_one_or_none()
    
    async def get_all_bloggers(self, db: AsyncSession) -> List[Blogger]:
        """获取所有博主"""
        result = await db.execute(select(Blogger).order_by(Blogger.name))
        return result.scalars().all()
    
    async def update_blogger(self, db: AsyncSession, blogger_id: int, name: str = None, description: str = None, avatar: str = None, color: str = None) -> Optional[Blogger]:
        """更新博主信息"""
        blogger = await self.get_blogger(db, blogger_id)
        if not blogger:
            return None
        
        if name is not None:
            blogger.name = name
        if description is not None:
            blogger.description = description
        if avatar is not None:
            blogger.avatar = avatar
        if color is not None:
            blogger.color = color
        
        await db.commit()
        await db.refresh(blogger)
        
        logger.info(f"博主更新成功，ID: {blogger.id}")
        return blogger
    
    async def delete_blogger(self, db: AsyncSession, blogger_id: int) -> bool:
        """删除博主"""
        blogger = await self.get_blogger(db, blogger_id)
        if not blogger:
            return False
        
        await db.delete(blogger)
        await db.commit()
        
        logger.info(f"博主删除成功，ID: {blogger_id}")
        return True
    
    async def create_material(self, db: AsyncSession, blogger_id: int, title: str, content: str, material_type: MaterialType, url: str = None, tags: str = None) -> Material:
        """创建材料并添加到向量数据库"""
        logger.info(f"创建材料: {title}, 类型: {material_type}")
        
        material = Material(
            blogger_id=blogger_id,
            title=title,
            content=content,
            type=material_type,
            url=url,
            tags=tags
        )
        
        db.add(material)
        await db.commit()
        await db.refresh(material)
        
        # 将材料内容向量化并存储到向量数据库
        try:
            await self._index_material_to_vector_store(material)
            logger.info(f"材料已索引到向量库，ID: {material.id}")
        except Exception as e:
            logger.warning(f"材料向量化失败（不影响数据库存储）: {e}")
        
        logger.info(f"材料创建成功，ID: {material.id}")
        return material
    
    async def _index_material_to_vector_store(self, material: Material):
        """将材料内容索引到向量数据库"""
        # 初始化嵌入服务和向量存储
        embedding_service = EmbeddingService()
        vector_store = VectorStore()
        
        # 将内容分块（简单按段落分割）
        chunks = self._split_content_into_chunks(material.content, chunk_size=500, overlap=50)
        
        for i, chunk in enumerate(chunks):
            if not chunk.strip():
                continue
                
            # 生成嵌入向量
            embedding = embedding_service.encode_single(chunk)
            
            # 创建唯一ID
            chunk_id = f"material_{material.id}_chunk_{i}_{hashlib.md5(chunk.encode()).hexdigest()[:8]}"
            
            # 存储到向量数据库
            vector_store.collection.add(
                documents=[chunk],
                metadatas=[{
                    "type": "material",
                    "material_id": material.id,
                    "blogger_id": material.blogger_id,
                    "title": material.title,
                    "chunk_index": i,
                    "timestamp": datetime.now().isoformat()
                }],
                embeddings=[embedding],
                ids=[chunk_id]
            )
        
        logger.info(f"材料 '{material.title}' 已分块索引，共 {len(chunks)} 块")
    
    def _split_content_into_chunks(self, content: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """将内容分块"""
        if not content:
            return []
        
        # 按段落分割
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
        
        chunks = []
        current_chunk = ""
        
        for para in paragraphs:
            if len(current_chunk) + len(para) < chunk_size:
                current_chunk += para + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = para + "\n\n"
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks if chunks else [content]
    
    async def get_material(self, db: AsyncSession, material_id: int) -> Optional[Material]:
        """获取材料"""
        result = await db.execute(select(Material).where(Material.id == material_id))
        return result.scalar_one_or_none()
    
    async def get_materials_by_blogger(self, db: AsyncSession, blogger_id: int) -> List[Material]:
        """获取博主的所有材料"""
        result = await db.execute(select(Material).where(Material.blogger_id == blogger_id).order_by(Material.created_at.desc()))
        return result.scalars().all()
    
    async def update_material(self, db: AsyncSession, material_id: int, title: str = None, content: str = None, material_type: MaterialType = None, url: str = None, tags: str = None) -> Optional[Material]:
        """更新材料"""
        material = await self.get_material(db, material_id)
        if not material:
            return None
        
        if title is not None:
            material.title = title
        if content is not None:
            material.content = content
        if material_type is not None:
            material.type = material_type
        if url is not None:
            material.url = url
        if tags is not None:
            material.tags = tags
        
        await db.commit()
        await db.refresh(material)
        
        logger.info(f"材料更新成功，ID: {material.id}")
        return material
    
    async def delete_material(self, db: AsyncSession, material_id: int) -> bool:
        """删除材料"""
        material = await self.get_material(db, material_id)
        if not material:
            return False
        
        await db.delete(material)
        await db.commit()
        
        logger.info(f"材料删除成功，ID: {material_id}")
        return True
    
    async def search_materials(self, db: AsyncSession, query: str, blogger_id: int = None) -> List[Material]:
        """搜索材料"""
        logger.info(f"搜索材料: {query}")
        
        if blogger_id:
            result = await db.execute(
                select(Material).where(
                    Material.blogger_id == blogger_id,
                    (Material.title.contains(query) | Material.content.contains(query))
                ).order_by(Material.created_at.desc())
            )
        else:
            result = await db.execute(
                select(Material).where(
                    Material.title.contains(query) | Material.content.contains(query)
                ).order_by(Material.created_at.desc())
            )
        
        return result.scalars().all()


# 全局知识库管理实例
knowledge_base_manager = KnowledgeBaseManager()
