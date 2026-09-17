"""
代码质量测试

验证优化后的代码健硕性和简洁性
"""

import pytest
import asyncio
from typing import Dict, Any

from src.llm.client import LLMClient, get_llm_client
from config.config import settings
from src.services.rag_service import EmbeddingService, VectorStore, RAGMemory
from src.core.exceptions import (
    DigitalAdvisorException, LLMException, RateLimitException,
    TimeoutException, ValidationException, ResourceException
)
from src.core.performance import time_it, cache_result, retry_on_failure
from src.core.types import validate_message_dict, validate_agent_response


class TestErrorHandling:
    """错误处理测试"""
    
    def test_exception_hierarchy(self):
        """测试异常继承关系"""
        assert issubclass(LLMException, DigitalAdvisorException)
        assert issubclass(RateLimitException, LLMException)
        assert issubclass(TimeoutException, LLMException)
        assert issubclass(ValidationException, DigitalAdvisorException)
        assert issubclass(ResourceException, DigitalAdvisorException)
    
    def test_exception_to_dict(self):
        """测试异常转换为字典"""
        exception = LLMException(
            "测试错误",
            error_type="test",
            provider="test_provider"
        )
        
        result = exception.to_dict()
        assert result["error"] == "LLMException"
        assert result["message"] == "测试错误"
        assert result["error_type"] == "test"
        assert result["provider"] == "test_provider"


class TestLLMClient:
    """LLM客户端测试"""
    
    def test_client_initialization(self):
        """测试客户端初始化"""
        client = LLMClient()
        assert client.model is not None
        assert client.max_retries == 3
        assert client.timeout == settings.LLM_TIMEOUT_SECONDS  # 来自 config，默认 60
    
    def test_error_classification(self):
        """测试错误分类：非 OpenAI 异常统一归为通用 LLMException"""
        client = LLMClient()

        generic_error = Exception("Something went wrong")
        classified = client._classify_error(generic_error)
        assert isinstance(classified, LLMException)
        assert "未知错误" in str(classified) or "LLM" in str(type(classified).__name__)


class TestRAGService:
    """RAG服务测试"""
    
    def test_embedding_service(self):
        """测试嵌入服务"""
        service = EmbeddingService()
        
        # 测试懒加载
        assert service._model is None
        model = service.model  # 触发懒加载
        assert service._model is not None
        
        # 测试编码
        text = "测试文本"
        embedding = service.encode_single(text)
        assert isinstance(embedding, list)
        assert len(embedding) == service.dimension
    
    def test_embedding_validation(self):
        """测试嵌入验证"""
        service = EmbeddingService()
        
        # 测试空文本
        with pytest.raises(ValidationException):
            service.encode_single("")
        
        # 测试空白文本
        with pytest.raises(ValidationException):
            service.encode_single("   ")
    
    def test_vector_store(self):
        """测试向量存储"""
        store = VectorStore(persist_directory="./tests/data/vector_db")
        
        # 测试统计信息
        stats = store.get_stats()
        assert "total_chunks" in stats
        assert "persist_directory" in stats


class TestPerformanceTools:
    """性能工具测试"""
    
    def test_time_it_decorator(self):
        """测试计时装饰器"""
        
        @time_it
        def test_function():
            return "success"
        
        result = test_function()
        assert result == "success"
    
    def test_cache_result_decorator(self):
        """测试缓存装饰器"""
        call_count = 0
        
        @cache_result(ttl=10)
        def test_function(x):
            nonlocal call_count
            call_count += 1
            return x * 2
        
        # 第一次调用
        result1 = test_function(5)
        assert result1 == 10
        assert call_count == 1
        
        # 第二次调用（应该从缓存获取）
        result2 = test_function(5)
        assert result2 == 10
        assert call_count == 1  # 调用次数不应增加
    
    def test_retry_on_failure_decorator(self):
        """测试重试装饰器"""
        call_count = 0
        
        @retry_on_failure(max_retries=2, delay=0.1)
        def test_function():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise Exception("模拟失败")
            return "success"
        
        result = test_function()
        assert result == "success"
        assert call_count == 3  # 失败2次，成功1次


class TestTypeSafety:
    """类型安全测试"""
    
    def test_validate_message_dict(self):
        """测试消息字典验证"""
        valid_data = {
            "role": "user",
            "content": "测试消息",
            "timestamp": "2024-01-01T00:00:00"
        }
        
        result = validate_message_dict(valid_data)
        assert result["role"] == "user"
        assert result["content"] == "测试消息"
        assert result["timestamp"] == "2024-01-01T00:00:00"
    
    def test_validate_message_dict_invalid(self):
        """测试无效消息字典验证"""
        invalid_data = {
            "role": "user",
            "content": "测试消息"
            # 缺少 timestamp
        }
        
        with pytest.raises(ValueError):
            validate_message_dict(invalid_data)
    
    def test_validate_agent_response(self):
        """测试Agent响应验证"""
        valid_data = {
            "response": "测试回复",
            "thought": "测试思考",
            "action": "respond",
            "agent_name": "测试Agent",
            "context_used": True,
            "memory_stats": {"total": 10}
        }
        
        result = validate_agent_response(valid_data)
        assert result["response"] == "测试回复"
        assert result["agent_name"] == "测试Agent"
        assert result["context_used"] is True


class TestIntegration:
    """集成测试"""
    
    @pytest.mark.asyncio
    async def test_rag_memory_integration(self):
        """测试RAG记忆集成"""
        rag_memory = RAGMemory()
        
        # 添加消息
        rag_memory.add_message(
            role="user",
            content="测试消息",
            conversation_id=1
        )
        
        # 检索上下文
        context = await rag_memory.retrieve_relevant_context(
            query="测试",
            conversation_id=1
        )
        
        assert isinstance(context, str)
        
        # 清理资源
        rag_memory.close()
    
    def test_resource_management(self):
        """测试资源管理"""
        # 测试嵌入服务资源释放
        service = EmbeddingService()
        service.model  # 触发加载
        assert service._model is not None
        
        service.close()
        assert service._model is None


if __name__ == "__main__":
    # 运行测试
    pytest.main([__file__, "-v"])