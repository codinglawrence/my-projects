from typing import Optional, List, Dict, Any
from loguru import logger
from src.llm.client import llm_client
from src.models.models import Blogger, Material


class StyleLearner:
    """风格学习和模拟模块"""
    
    async def learn_style(self, blogger_id: int, materials: List[Material]) -> Dict[str, Any]:
        """学习博主风格"""
        logger.info(f"开始学习博主风格，ID: {blogger_id}")
        
        # 收集材料内容
        material_contents = []
        for material in materials:
            material_contents.append(f"标题: {material.title}\n内容: {material.content}")
        
        # 生成风格描述
        prompt = f"基于以下材料，分析博主的语言风格、说话方式、常用词汇和知识领域：\n\n" + "\n\n".join(material_contents[:5])  # 只使用前5个材料
        
        messages = [
            {"role": "system", "content": "你是一个风格分析专家，擅长分析人物的语言风格和说话方式。"},
            {"role": "user", "content": prompt}
        ]
        
        response = await llm_client.chat_completion(messages)
        style_description = response["content"]
        
        logger.info(f"风格学习完成，ID: {blogger_id}")
        return {"style_description": style_description}
    
    async def generate_response(self, blogger_id: int, style_description: str, user_message: str, context: Optional[List[Dict[str, str]]] = None) -> str:
        """生成符合博主风格的回复"""
        logger.info(f"生成符合博主风格的回复，ID: {blogger_id}")
        
        # 构建上下文
        context_str = ""
        if context:
            for msg in context:
                context_str += f"{msg['role']}: {msg['content']}\n"
        
        # 构建提示
        prompt = f"你是一个模仿专家，需要模仿以下博主的风格回复用户问题：\n\n"
        prompt += f"博主风格描述：{style_description}\n\n"
        if context_str:
            prompt += f"对话历史：\n{context_str}\n\n"
        prompt += f"用户问题：{user_message}\n\n"
        prompt += "请完全按照博主的风格和说话方式回复，不要添加任何解释或说明。"
        
        messages = [
            {"role": "system", "content": "你是一个模仿专家，能够准确模仿各种人物的语言风格。"},
            {"role": "user", "content": prompt}
        ]
        
        response = await llm_client.chat_completion(messages)
        generated_response = response["content"]
        
        logger.info(f"回复生成完成，ID: {blogger_id}")
        return generated_response
    
    async def generate_stream_response(self, blogger_id: int, style_description: str, user_message: str, context: Optional[List[Dict[str, str]]] = None) -> Any:
        """流式生成符合博主风格的回复"""
        logger.info(f"流式生成符合博主风格的回复，ID: {blogger_id}")
        
        # 构建上下文
        context_str = ""
        if context:
            for msg in context:
                context_str += f"{msg['role']}: {msg['content']}\n"
        
        # 构建提示
        prompt = f"你是一个模仿专家，需要模仿以下博主的风格回复用户问题：\n\n"
        prompt += f"博主风格描述：{style_description}\n\n"
        if context_str:
            prompt += f"对话历史：\n{context_str}\n\n"
        prompt += f"用户问题：{user_message}\n\n"
        prompt += "请完全按照博主的风格和说话方式回复，不要添加任何解释或说明。"
        
        messages = [
            {"role": "system", "content": "你是一个模仿专家，能够准确模仿各种人物的语言风格。"},
            {"role": "user", "content": prompt}
        ]
        
        async for chunk in llm_client.stream_chat_completion(messages):
            yield chunk


# 全局风格学习实例
style_learner = StyleLearner()
