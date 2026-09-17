"""
增强版 RAG (检索增强生成) 服务

特性：
- 对话历史向量化存储
- 语义相似度检索  
- 长期记忆管理
- 上下文增强生成
- 资源管理和错误处理
- 类型安全注解
"""

import os
import json
import hashlib
from typing import List, Dict, Any, Optional, Tuple, Union
from dataclasses import dataclass, field
from datetime import datetime
from contextlib import contextmanager
import numpy as np

# 设置 HuggingFace 镜像源（解决国内网络问题）
os.environ['HF_ENDPOINT'] = os.environ.get('HF_ENDPOINT', 'https://hf-mirror.com')

# 使用本地嵌入模型，不需要调用 API
from sentence_transformers import SentenceTransformer
import chromadb

from src.core.logging import logger
from src.core.exceptions import (
    ResourceException, ValidationException, ErrorSeverity
)


@dataclass
class MemoryChunk:
    """记忆片段"""
    id: str
    content: str
    role: str  # user / assistant
    conversation_id: int
    timestamp: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RetrievedMemory:
    """检索到的记忆"""
    chunk: MemoryChunk
    similarity: float
    relevance_score: float


class EmbeddingService:
    """嵌入服务 - 使用本地模型"""
    
    def __init__(self, model_name: str = "paraphrase-multilingual-MiniLM-L12-v2"):
        """初始化嵌入服务"""
        self.model_name = model_name
        self.dimension = 384  # 默认维度
        self._model: Optional[SentenceTransformer] = None
    
    @property
    def model(self) -> SentenceTransformer:
        """获取模型实例（懒加载）"""
        if self._model is None:
            logger.info(f"加载嵌入模型: {self.model_name}")
            try:
                self._model = SentenceTransformer(self.model_name)
                self.dimension = self._model.get_sentence_embedding_dimension()
                logger.info(f"嵌入维度: {self.dimension}")
            except Exception as e:
                logger.error(f"嵌入模型加载失败: {e}")
                raise ResourceException(
                    f"嵌入模型加载失败: {e}",
                    resource_type="embedding_model"
                )
        return self._model
    
    def encode_single(self, text: str) -> List[float]:
        """编码单个文本"""
        if not text or not text.strip():
            raise ValidationException("编码文本不能为空", field="text")
            
        try:
            embedding = self.model.encode([text], convert_to_numpy=True)[0]
            return embedding.tolist()
        except Exception as e:
            logger.error(f"嵌入编码失败: {e}")
            raise ResourceException(f"嵌入编码失败: {e}", resource_type="embedding")
    
    def encode_batch(self, texts: List[str]) -> List[List[float]]:
        """批量编码文本"""
        if not texts:
            return []
            
        # 过滤空文本
        valid_texts = [text for text in texts if text and text.strip()]
        if not valid_texts:
            return []
            
        try:
            embeddings = self.model.encode(valid_texts, convert_to_numpy=True)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"批量嵌入编码失败: {e}")
            raise ResourceException(f"批量嵌入编码失败: {e}", resource_type="embedding")
    
    def close(self):
        """释放模型资源"""
        if self._model:
            self._model = None
            logger.info("嵌入模型资源已释放")


class VectorStore:
    """向量存储 - 使用 ChromaDB"""
    
    def __init__(self, persist_directory: str = "./data/vector_db"):
        """
        初始化向量存储
        
        Args:
            persist_directory: 数据持久化目录
        """
        self.persist_directory = persist_directory
        os.makedirs(persist_directory, exist_ok=True)
        
        # 初始化 ChromaDB (使用新的客户端 API)
        self.client = chromadb.PersistentClient(
            path=persist_directory
        )
        
        # 获取或创建集合
        self.collection = self.client.get_or_create_collection(
            name="conversation_memory",
            metadata={"hnsw:space": "cosine"}  # 使用余弦相似度
        )
        
        logger.info(f"向量存储初始化完成: {persist_directory}")
    
    def add_memory_chunk(self, chunk: MemoryChunk, embedding: List[float]) -> None:
        """添加记忆片段"""
        try:
            self.collection.add(
                documents=[chunk.content],
                metadatas=[{
                    "role": chunk.role,
                    "conversation_id": chunk.conversation_id,
                    "timestamp": chunk.timestamp,
                    "metadata": json.dumps(chunk.metadata)
                }],
                embeddings=[embedding],
                ids=[chunk.id]
            )
            logger.debug(f"记忆片段已添加: {chunk.id}")
        except Exception as e:
            raise ResourceException(f"添加记忆片段失败: {e}", resource_type="vector_store")
    
    def search(
        self, 
        query_embedding: List[float], 
        conversation_id: Optional[int] = None,
        top_k: int = 5
    ) -> List[RetrievedMemory]:
        """搜索相关记忆"""
        try:
            # 构建过滤条件
            where_filter = {}
            if conversation_id is not None:
                where_filter["conversation_id"] = conversation_id
            
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where_filter if where_filter else None,
                include=["metadatas", "documents", "distances"]
            )
            
            return self._parse_search_results(results)
            
        except Exception as e:
            logger.error(f"记忆搜索失败: {e}")
            return []
    
    def _parse_search_results(self, results: Dict[str, Any]) -> List[RetrievedMemory]:
        """解析搜索结果"""
        if not results.get("documents") or not results["documents"][0]:
            return []
        
        retrieved_memories = []
        
        for i, (doc, metadata, distance) in enumerate(zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0]
        )):
            # 余弦距离转换为相似度
            similarity = 1 - distance
            
            # 解析元数据
            metadata_dict = metadata.copy()
            if "metadata" in metadata_dict:
                try:
                    metadata_dict["metadata"] = json.loads(metadata_dict["metadata"])
                except json.JSONDecodeError:
                    metadata_dict["metadata"] = {}
            
            chunk = MemoryChunk(
                id=results["ids"][0][i],
                content=doc,
                role=metadata_dict["role"],
                conversation_id=metadata_dict["conversation_id"],
                timestamp=metadata_dict["timestamp"],
                metadata=metadata_dict.get("metadata", {})
            )
            
            retrieved_memories.append(RetrievedMemory(
                chunk=chunk,
                similarity=similarity,
                relevance_score=similarity * 0.8  # 简单评分
            ))
        
        return retrieved_memories
    
    def delete_conversation_memory(self, conversation_id: int) -> None:
        """删除特定对话的记忆"""
        try:
            self.collection.delete(where={"conversation_id": conversation_id})
            logger.info(f"对话 {conversation_id} 的记忆已删除")
        except Exception as e:
            raise ResourceException(f"删除对话记忆失败: {e}", resource_type="vector_store")
    
    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        try:
            count = self.collection.count()
            return {
                "total_chunks": count,
                "persist_directory": self.persist_directory
            }
        except Exception as e:
            logger.error(f"获取统计信息失败: {e}")
            return {"total_chunks": 0, "persist_directory": self.persist_directory}


class RAGMemory:
    """RAG 增强的记忆系统"""
    
    def __init__(self, embedding_model: Optional[str] = None):
        """初始化 RAG 记忆系统"""
        self.embedding_service = EmbeddingService(embedding_model) if embedding_model else EmbeddingService()
        self.vector_store = VectorStore()
        
        # 短期记忆（最近对话）
        self.short_term_memory: List[Dict[str, str]] = []
        self.max_short_term = 10
        
        # 待存储的片段（批量处理）
        self.pending_chunks: List[MemoryChunk] = []
    
    def _generate_chunk_id(self, role: str, content: str) -> str:
        """生成记忆片段ID"""
        combined = f"{role}:{content}:{datetime.now().isoformat()}"
        return hashlib.md5(combined.encode()).hexdigest()[:16]
    
    def add_message(
        self, 
        role: str, 
        content: str, 
        conversation_id: int,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """添加消息到记忆系统"""
        # 验证输入
        if not role or not content:
            raise ValidationException("角色和内容不能为空")
            
        # 创建记忆片段
        chunk = MemoryChunk(
            id=self._generate_chunk_id(role, content),
            content=content,
            role=role,
            conversation_id=conversation_id,
            timestamp=datetime.now().isoformat(),
            metadata=metadata or {}
        )
        
        # 添加到短期记忆
        self._add_to_short_term_memory(role, content, chunk.timestamp)
        
        # 添加到待处理队列
        self.pending_chunks.append(chunk)
        
        # 如果队列达到一定大小，批量处理
        if len(self.pending_chunks) >= 5:
            self._flush_pending_chunks()
    
    def _add_to_short_term_memory(self, role: str, content: str, timestamp: str) -> None:
        """添加到短期记忆"""
        self.short_term_memory.append({
            "role": role,
            "content": content,
            "timestamp": timestamp
        })
        
        # 限制短期记忆大小
        if len(self.short_term_memory) > self.max_short_term:
            self.short_term_memory = self.short_term_memory[-self.max_short_term:]
    
    def _flush_pending_chunks(self) -> None:
        """批量处理待存储的记忆片段"""
        if not self.pending_chunks:
            return
        
        try:
            # 批量编码
            texts = [chunk.content for chunk in self.pending_chunks]
            embeddings = self.embedding_service.encode_batch(texts)
            
            # 批量存储
            for chunk, embedding in zip(self.pending_chunks, embeddings):
                self.vector_store.add_memory_chunk(chunk, embedding)
            
            logger.info(f"批量存储了 {len(self.pending_chunks)} 个记忆片段")
            self.pending_chunks = []
            
        except Exception as e:
            logger.error(f"批量存储记忆片段失败: {e}")
            # 保留待处理片段，下次重试
    
    async def retrieve_relevant_context(
        self,
        query: str,
        conversation_id: Optional[int] = None,
        blogger_id: Optional[int] = None,
        top_k: int = 5,
        include_short_term: bool = True
    ) -> str:
        """
        检索相关上下文（混合模式：个人材料 + 对话历史）
        
        Args:
            query: 查询内容
            conversation_id: 可选，限制特定对话
            blogger_id: 可选，限制特定博主的知识库
            top_k: 检索数量
            include_short_term: 是否包含短期记忆
            
        Returns:
            格式化的上下文字符串
        """
        # 先刷新待处理片段
        self._flush_pending_chunks()
        
        # 编码查询
        query_embedding = self.embedding_service.encode_single(query)
        
        # 构建上下文
        contexts = []
        
        # 1. 检索个人知识库材料（高优先级）
        if blogger_id:
            material_memories = self._search_materials(
                query_embedding=query_embedding,
                blogger_id=blogger_id,
                top_k=top_k
            )
            
            if material_memories:
                contexts.append("【个人知识库材料】（优先参考）")
                for i, mem in enumerate(material_memories[:3], 1):  # 最多3条材料
                    contexts.append(f"{i}. 来自《{mem['title']}》：")
                    contexts.append(f"   {mem['content'][:300]}...")  # 截取前300字符
                    contexts.append(f"   （相关度: {mem['similarity']:.2f}）")
                contexts.append("")
        
        # 2. 检索对话历史
        retrieved_memories = self.vector_store.search(
            query_embedding=query_embedding,
            conversation_id=conversation_id,
            top_k=top_k
        )
        
        # 3. 添加短期记忆
        if include_short_term and self.short_term_memory:
            contexts.append("【最近对话】")
            for msg in self.short_term_memory[-5:]:
                contexts.append(f"{msg['role']}: {msg['content']}")
            contexts.append("")
        
        # 4. 添加检索到的相关记忆
        if retrieved_memories:
            contexts.append("【相关历史对话】")
            for mem in retrieved_memories:
                chunk = mem.chunk
                contexts.append(f"[{chunk.timestamp[:10]}] {chunk.role}: {chunk.content}")
                contexts.append(f"  (相似度: {mem.similarity:.2f})")
            contexts.append("")
        
        return "\n".join(contexts)
    
    def _search_materials(self, query_embedding: List[float], blogger_id: int, top_k: int = 5) -> List[Dict[str, Any]]:
        """搜索个人知识库材料"""
        try:
            # 使用向量存储搜索材料
            results = self.vector_store.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where={"$and": [{"type": "material"}, {"blogger_id": blogger_id}]}
            )
            
            memories = []
            if results and results['documents']:
                for i, doc in enumerate(results['documents'][0]):
                    metadata = results['metadatas'][0][i] if results['metadatas'] else {}
                    distance = results['distances'][0][i] if results['distances'] else 0
                    similarity = 1 - distance  # 距离转相似度
                    
                    memories.append({
                        'content': doc,
                        'title': metadata.get('title', '未知材料'),
                        'similarity': similarity,
                        'material_id': metadata.get('material_id')
                    })
            
            # 按相似度排序
            memories.sort(key=lambda x: x['similarity'], reverse=True)
            return memories
            
        except Exception as e:
            logger.warning(f"搜索知识库材料失败: {e}")
            return []
    
    def get_conversation_summary(self, conversation_id: int) -> str:
        """获取对话摘要"""
        # 这里可以实现更复杂的摘要逻辑
        return f"对话 {conversation_id} 的摘要"
    
    def clear_memory(self, conversation_id: Optional[int] = None):
        """
        清除记忆
        
        Args:
            conversation_id: 可选，只清除特定对话，None 清除所有
        """
        if conversation_id:
            self.vector_store.delete_conversation_memory(conversation_id)
        else:
            # 重新初始化集合
            self.vector_store.client.delete_collection("conversation_memory")
            self.vector_store.collection = self.vector_store.client.create_collection(
                name="conversation_memory",
                metadata={"hnsw:space": "cosine"}
            )
        
        self.short_term_memory = []
        self.pending_chunks = []
    
    def get_stats(self) -> Dict[str, Any]:
        """获取记忆统计"""
        return {
            "vector_store": self.vector_store.get_stats(),
            "short_term_memory_size": len(self.short_term_memory),
            "pending_chunks": len(self.pending_chunks),
            "embedding_dimension": self.embedding_service.dimension
        }

    def close(self) -> None:
        """释放嵌入模型资源（加载 sentence-transformers 会占用 GPU/CPU 内存）。"""
        self.embedding_service.close()


# 全局 RAG 服务实例
rag_memory = RAGMemory()
