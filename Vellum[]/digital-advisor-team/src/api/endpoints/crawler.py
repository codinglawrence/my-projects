from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional
from pydantic import BaseModel # Added this import
from src.db.database import get_db
from src.crawler.crawler import crawler
from src.services.knowledge_base import knowledge_base_manager
from src.models.models import MaterialType

router = APIRouter(prefix="/crawler", tags=["crawler"])


class CrawlRequest(BaseModel):
    url: str
    mode: str = "single"
    blogger_id: int


@router.post("/crawl", response_model=Dict[str, Any])
async def crawl_url(crawl_request: CrawlRequest, db: AsyncSession = Depends(get_db)):
    """
    爬取指定URL的内容，并将其作为材料添加到指定博主的知识库中。
    支持两种模式：
    - single: 仅爬取单个文章内容
    - blogger_info: 爬取博主信息及其最新文章（目前仅支持B站UP主页面）
    """
    try:
        if crawl_request.mode == "single":
            article = await crawler.crawl_article(crawl_request.url)
            if article:
                material = await knowledge_base_manager.create_material(
                    db,
                    blogger_id=crawl_request.blogger_id,
                    title=article["title"],
                    content=article["content"],
                    material_type=MaterialType.ARTICLE,
                    url=article["url"]
                )
                return {"message": "文章爬取成功并已添加至知识库", "material_id": material.id}
            else:
                raise HTTPException(status_code=404, detail="未能爬取到文章内容")
        elif crawl_request.mode == "blogger_info":
            blogger_info = await crawler.crawl_blogger_info(crawl_request.url)
            if blogger_info:
                # 更新博主信息
                await knowledge_base_manager.update_blogger(
                    db,
                    blogger_id=crawl_request.blogger_id,
                    name=blogger_info.get("name"),
                    description=blogger_info.get("description"),
                    avatar=blogger_info.get("avatar")
                )
                # 添加材料
                material_ids = []
                for mat_data in blogger_info.get("materials", []):
                    material = await knowledge_base_manager.create_material(
                        db,
                        blogger_id=crawl_request.blogger_id,
                        title=mat_data["title"],
                        content=mat_data["content"],
                        material_type=MaterialType(mat_data["type"]),
                        url=mat_data["url"]
                    )
                    material_ids.append(material.id)
                return {"message": "博主信息及材料爬取成功并已添加至知识库", "material_ids": material_ids}
            else:
                raise HTTPException(status_code=404, detail="未能爬取到博主信息")
        else:
            raise HTTPException(status_code=400, detail="无效的爬取模式")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"爬取失败: {str(e)}")
