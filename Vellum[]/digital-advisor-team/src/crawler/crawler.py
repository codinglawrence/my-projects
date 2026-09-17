import asyncio
import time
from typing import Optional, List, Dict, Any
from loguru import logger
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from config.config import settings


class Crawler:
    """爬虫类，使用Playwright + BeautifulSoup + lxml爬取博主相关信息"""
    
    def __init__(self):
        self.delay = settings.CRAWLER_DELAY
    
    async def _wait(self):
        """等待，避免爬取过快"""
        await asyncio.sleep(self.delay)
    
    async def crawl_blogger_info(self, url: str) -> Dict[str, Any]:
        """爬取博主信息"""
        logger.info(f"开始爬取博主信息: {url}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            try:
                # 导航到目标页面
                await page.goto(url, timeout=60000)
                await self._wait()
                
                # 获取页面内容
                content = await page.content()
                soup = BeautifulSoup(content, 'lxml')
                
                # 提取博主信息（这里需要根据具体网站结构调整）
                # 示例：假设是B站UP主页面
                blogger_info = {
                    'name': self._extract_name(soup),
                    'description': self._extract_description(soup),
                    'avatar': self._extract_avatar(soup),
                    'materials': await self._extract_materials(page, soup)
                }
                
                logger.info(f"爬取完成: {blogger_info['name']}")
                return blogger_info
                
            except Exception as e:
                logger.error(f"爬取失败: {e}")
                raise
            finally:
                await browser.close()
    
    def _extract_name(self, soup: BeautifulSoup) -> str:
        """提取博主名称"""
        # 示例：B站UP主名称
        name_elem = soup.select_one('.name')
        return name_elem.text.strip() if name_elem else '未知'
    
    def _extract_description(self, soup: BeautifulSoup) -> str:
        """提取博主描述"""
        # 示例：B站UP主简介
        desc_elem = soup.select_one('.sign')
        return desc_elem.text.strip() if desc_elem else ''
    
    def _extract_avatar(self, soup: BeautifulSoup) -> str:
        """提取博主头像"""
        # 示例：B站UP主头像
        avatar_elem = soup.select_one('.face img')
        return avatar_elem.get('src') if avatar_elem else ''
    
    async def _extract_materials(self, page, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """提取博主相关材料"""
        materials = []
        
        # 示例：提取视频列表
        video_elems = soup.select('.video-item')
        for i, video_elem in enumerate(video_elems[:5]):  # 只提取前5个视频
            title_elem = video_elem.select_one('.title')
            url_elem = video_elem.select_one('a')
            
            if title_elem and url_elem:
                title = title_elem.text.strip()
                video_url = url_elem.get('href')
                if not video_url.startswith('http'):
                    video_url = 'https:' + video_url
                
                # 进入视频页面获取内容
                await page.goto(video_url, timeout=60000)
                await self._wait()
                
                video_content = await page.content()
                video_soup = BeautifulSoup(video_content, 'lxml')
                
                # 提取视频简介
                desc_elem = video_soup.select_one('.video-desc')
                content = desc_elem.text.strip() if desc_elem else ''
                
                materials.append({
                    'title': title,
                    'url': video_url,
                    'content': content,
                    'type': 'video'
                })
        
        return materials
    
    async def crawl_article(self, url: str) -> Dict[str, Any]:
        """爬取文章内容"""
        logger.info(f"开始爬取文章: {url}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            try:
                await page.goto(url, timeout=60000)
                await self._wait()
                
                content = await page.content()
                soup = BeautifulSoup(content, 'lxml')
                
                # 提取文章信息
                title_elem = soup.select_one('h1')
                content_elem = soup.select_one('.article-content')
                
                article = {
                    'title': title_elem.text.strip() if title_elem else '未知',
                    'content': content_elem.text.strip() if content_elem else '',
                    'url': url,
                    'type': 'article'
                }
                
                logger.info(f"文章爬取完成: {article['title']}")
                return article
                
            except Exception as e:
                logger.error(f"文章爬取失败: {e}")
                raise
            finally:
                await browser.close()


# 全局爬虫实例
crawler = Crawler()
