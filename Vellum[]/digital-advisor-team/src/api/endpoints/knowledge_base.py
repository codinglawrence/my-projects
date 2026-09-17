from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional
from src.db.database import get_db
from src.services.knowledge_base import knowledge_base_manager
from src.models.models import Blogger, Material, MaterialType
from src.api.schemas import BloggerCreate, BloggerUpdate, MaterialCreate, MaterialUpdate
from loguru import logger

router = APIRouter(prefix="/knowledge", tags=["knowledge-base"])


@router.post("/bloggers", response_model=Dict[str, Any])
async def create_blogger(blogger_data: BloggerCreate, db: AsyncSession = Depends(get_db)):
    """创建博主"""
    try:
        blogger = await knowledge_base_manager.create_blogger(db, **blogger_data.dict())
        return {
            "id": blogger.id,
            "name": blogger.name,
            "description": blogger.description,
            "avatar": blogger.avatar,
            "color": blogger.color,
            "created_at": blogger.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bloggers", response_model=List[Dict[str, Any]])
async def get_all_bloggers(db: AsyncSession = Depends(get_db)):
    """获取所有博主"""
    try:
        bloggers = await knowledge_base_manager.get_all_bloggers(db)
        return [
            {
                "id": blogger.id,
                "name": blogger.name,
                "description": blogger.description,
                "avatar": blogger.avatar,
                "color": blogger.color
            }
            for blogger in bloggers
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bloggers/{blogger_id}", response_model=Dict[str, Any])
async def get_blogger(blogger_id: int, db: AsyncSession = Depends(get_db)):
    """获取博主"""
    try:
        blogger = await knowledge_base_manager.get_blogger(db, blogger_id)
        if not blogger:
            raise HTTPException(status_code=404, detail="博主不存在")
        return {
            "id": blogger.id,
            "name": blogger.name,
            "description": blogger.description,
            "avatar": blogger.avatar,
            "color": blogger.color,
            "created_at": blogger.created_at,
            "updated_at": blogger.updated_at
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/bloggers/{blogger_id}", response_model=Dict[str, Any])
async def update_blogger(blogger_id: int, blogger_data: BloggerUpdate, db: AsyncSession = Depends(get_db)):
    """更新博主信息"""
    try:
        blogger = await knowledge_base_manager.update_blogger(db, blogger_id, **blogger_data.dict(exclude_unset=True))
        if not blogger:
            raise HTTPException(status_code=404, detail="博主不存在")
        return {
            "id": blogger.id,
            "name": blogger.name,
            "description": blogger.description,
            "avatar": blogger.avatar,
            "color": blogger.color,
            "updated_at": blogger.updated_at
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/bloggers/{blogger_id}", response_model=Dict[str, Any])
async def delete_blogger(blogger_id: int, db: AsyncSession = Depends(get_db)):
    """删除博主"""
    try:
        success = await knowledge_base_manager.delete_blogger(db, blogger_id)
        if not success:
            raise HTTPException(status_code=404, detail="博主不存在")
        return {"message": "博主删除成功"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/materials", response_model=Dict[str, Any])
async def create_material(
    blogger_id: int = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    material_type: str = Form("OTHER"),
    url: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """创建材料（支持文件上传）"""
    try:
        # 读取文件内容
        content_bytes = await file.read()
        
        # 根据文件类型处理内容
        filename = file.filename.lower()
        
        if filename.endswith('.pdf'):
            # PDF文件需要特殊处理
            try:
                import PyPDF2
                import io
                pdf_file = io.BytesIO(content_bytes)
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                content = ""
                for page in pdf_reader.pages:
                    content += page.extract_text() + "\n"
            except Exception as e:
                logger.warning(f"PDF解析失败，尝试作为文本读取: {e}")
                content = content_bytes.decode('utf-8', errors='ignore')
        elif filename.endswith(('.txt', '.md', '.markdown')):
            # 文本文件直接解码
            content = content_bytes.decode('utf-8', errors='ignore')
        else:
            # 其他类型尝试作为文本读取
            content = content_bytes.decode('utf-8', errors='ignore')
        
        if not content.strip():
            raise HTTPException(status_code=400, detail="无法从文件中提取内容")
        
        # 使用文件名作为标题（如果未提供）
        if not title:
            title = file.filename
        
        # 转换 material_type 为枚举类型
        try:
            material_type_enum = MaterialType(material_type)
        except ValueError:
            material_type_enum = MaterialType.OTHER
        
        material = await knowledge_base_manager.create_material(
            db, blogger_id, title, content, material_type_enum, url, tags
        )
        
        return {
            "id": material.id,
            "blogger_id": material.blogger_id,
            "title": material.title,
            "type": material.type,
            "url": material.url,
            "tags": material.tags,
            "created_at": material.created_at
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建材料失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bloggers/{blogger_id}/materials", response_model=List[Dict[str, Any]])
async def get_materials_by_blogger(blogger_id: int, db: AsyncSession = Depends(get_db)):
    """获取博主的所有材料"""
    try:
        materials = await knowledge_base_manager.get_materials_by_blogger(db, blogger_id)
        return [
            {
                "id": material.id,
                "title": material.title,
                "type": material.type,
                "url": material.url,
                "tags": material.tags,
                "created_at": material.created_at
            }
            for material in materials
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/materials/search", response_model=List[Dict[str, Any]])
async def search_materials(query: str, blogger_id: int = None, db: AsyncSession = Depends(get_db)):
    """搜索材料。必须定义在 /materials/{material_id} 之前，否则 FastAPI 会把 'search' 误判为 material_id。"""
    try:
        materials = await knowledge_base_manager.search_materials(db, query, blogger_id)
        return [
            {
                "id": material.id,
                "blogger_id": material.blogger_id,
                "title": material.title,
                "type": material.type,
                "url": material.url,
                "tags": material.tags,
                "created_at": material.created_at
            }
            for material in materials
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/materials/{material_id}", response_model=Dict[str, Any])
async def get_material(material_id: int, db: AsyncSession = Depends(get_db)):
    """获取材料"""
    try:
        material = await knowledge_base_manager.get_material(db, material_id)
        if not material:
            raise HTTPException(status_code=404, detail="材料不存在")
        return {
            "id": material.id,
            "blogger_id": material.blogger_id,
            "title": material.title,
            "content": material.content,
            "type": material.type,
            "url": material.url,
            "tags": material.tags,
            "created_at": material.created_at,
            "updated_at": material.updated_at
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/materials/{material_id}", response_model=Dict[str, Any])
async def update_material(
    material_id: int, 
    material_data: MaterialUpdate, 
    db: AsyncSession = Depends(get_db)
):
    """更新材料"""
    try:
        material = await knowledge_base_manager.update_material(db, material_id, **material_data.dict(exclude_unset=True))
        if not material:
            raise HTTPException(status_code=404, detail="材料不存在")
        return {
            "id": material.id,
            "title": material.title,
            "type": material.type,
            "url": material.url,
            "tags": material.tags,
            "updated_at": material.updated_at
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/materials/{material_id}", response_model=Dict[str, Any])
async def delete_material(material_id: int, db: AsyncSession = Depends(get_db)):
    """删除材料"""
    try:
        success = await knowledge_base_manager.delete_material(db, material_id)
        if not success:
            raise HTTPException(status_code=404, detail="材料不存在")
        return {"message": "材料删除成功"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
