"""
智能问答助手 Agent (QAAgent)

类似 Kimi/豆包的智能问答系统：
- 上传材料 → AI分析理解 → 智能问答
- 支持多轮对话、上下文理解
- 基于材料内容准确回答
"""

import os
import json
import hashlib
from typing import List, Dict, Any, Optional, AsyncGenerator, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import asyncio

from src.llm.client import llm_client
from src.core.logging import logger
from src.core.exceptions import ValidationException, ResourceException


@dataclass
class Document:
    """文档对象"""
    id: str
    content: str
    source: str  # 文件名或URL
    doc_type: str  # pdf, txt, markdown, html
    metadata: Dict[str, Any] = field(default_factory=dict)
    chunks: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class Chunk:
    """文本片段"""
    id: str
    content: str
    doc_id: str
    doc_source: str
    index: int
    embedding: Optional[List[float]] = None


@dataclass
class RetrievedChunk:
    """检索到的文本片段"""
    chunk: Chunk
    score: float
    context: str  # 上下文片段


@dataclass
class Message:
    """对话消息"""
    id: str
    role: str  # user, assistant, system
    content: str
    sources: List[Dict[str, Any]] = field(default_factory=list)  # 引用来源
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class Conversation:
    """对话会话"""
    id: str
    title: str
    messages: List[Message] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())


class DocumentProcessor:
    """文档处理器 - 解析各种格式的文档"""
    
    # 分块配置
    CHUNK_SIZE = 500  # 每个块的最大字符数
    CHUNK_OVERLAP = 100  # 块之间的重叠字符数
    
    @classmethod
    def process_file(cls, file_path: str, content: bytes) -> Document:
        """处理上传的文件"""
        file_name = os.path.basename(file_path)
        file_ext = os.path.splitext(file_name)[1].lower()
        
        # 根据文件类型解析
        if file_ext == '.pdf':
            text = cls._parse_pdf(content)
            doc_type = 'pdf'
        elif file_ext in ['.txt', '.md', '.markdown']:
            text = content.decode('utf-8', errors='ignore')
            doc_type = 'markdown' if file_ext in ['.md', '.markdown'] else 'txt'
        else:
            # 默认作为文本处理
            text = content.decode('utf-8', errors='ignore')
            doc_type = 'txt'
        
        # 生成文档ID
        doc_id = hashlib.md5(f"{file_name}{datetime.now()}".encode()).hexdigest()[:16]
        
        # 分块
        chunks = cls._split_text(text)
        
        return Document(
            id=doc_id,
            content=text,
            source=file_name,
            doc_type=doc_type,
            metadata={
                'file_size': len(content),
                'chunk_count': len(chunks),
                'char_count': len(text)
            },
            chunks=chunks
        )
    
    @classmethod
    def process_webpage(cls, url: str, html_content: str) -> Document:
        """处理网页内容"""
        from bs4 import BeautifulSoup
        
        # 解析HTML
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # 移除脚本和样式
        for script in soup(['script', 'style', 'nav', 'footer']):
            script.decompose()
        
        # 提取文本
        text = soup.get_text(separator='\n', strip=True)
        
        # 清理文本
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        text = '\n'.join(lines)
        
        # 生成文档ID
        doc_id = hashlib.md5(f"{url}{datetime.now()}".encode()).hexdigest()[:16]
        
        # 分块
        chunks = cls._split_text(text)
        
        # 提取标题
        title = soup.find('title')
        title = title.get_text() if title else url
        
        return Document(
            id=doc_id,
            content=text,
            source=url,
            doc_type='html',
            metadata={
                'title': title,
                'url': url,
                'chunk_count': len(chunks),
                'char_count': len(text)
            },
            chunks=chunks
        )
    
    @classmethod
    def _parse_pdf(cls, content: bytes) -> str:
        """解析PDF文件"""
        try:
            import PyPDF2
            import io
            
            pdf_file = io.BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text_parts = []
            for page in pdf_reader.pages:
                text_parts.append(page.extract_text())
            
            return '\n\n'.join(text_parts)
        except Exception as e:
            logger.error(f"PDF解析失败: {e}")
            raise ResourceException(f"PDF解析失败: {e}", resource_type="pdf_parser")
    
    @classmethod
    def _split_text(cls, text: str) -> List[str]:
        """将文本分割成块"""
        chunks = []
        start = 0
        
        while start < len(text):
            # 获取当前块
            end = start + cls.CHUNK_SIZE
            
            # 如果不是最后一块，尝试在句子边界分割
            if end < len(text):
                # 向后查找句子结束符
                for i in range(end, min(end + 100, len(text))):
                    if text[i] in '.。!！?？\n':
                        end = i + 1
                        break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # 移动起始位置（考虑重叠）
            start = end - cls.CHUNK_OVERLAP
            if start >= len(text):
                break
        
        return chunks


class VectorStore:
    """向量存储 - 管理文档的向量表示"""
    
    def __init__(self, collection_name: str = "qa_knowledge"):
        self.collection_name = collection_name
        self._client = None
        self._collection = None
        
        # 嵌入服务
        from src.services.rag_service import EmbeddingService
        self.embedding_service = EmbeddingService()
    
    @property
    def client(self):
        """懒加载ChromaDB客户端"""
        if self._client is None:
            import chromadb
            self._client = chromadb.PersistentClient(
                path="./data/vector_db"
            )
        return self._client
    
    @property
    def collection(self):
        """获取或创建集合"""
        if self._collection is None:
            try:
                self._collection = self.client.get_collection(self.collection_name)
            except:
                self._collection = self.client.create_collection(
                    name=self.collection_name,
                    metadata={"hnsw:space": "cosine"}
                )
        return self._collection
    
    def add_document(self, doc: Document) -> List[Chunk]:
        """添加文档到向量存储"""
        chunks = []
        
        for i, chunk_text in enumerate(doc.chunks):
            # 生成块ID
            chunk_id = f"{doc.id}_{i}"
            
            # 生成嵌入向量
            embedding = self.embedding_service.encode_single(chunk_text)
            
            chunk = Chunk(
                id=chunk_id,
                content=chunk_text,
                doc_id=doc.id,
                doc_source=doc.source,
                index=i,
                embedding=embedding
            )
            chunks.append(chunk)
            
            # 添加到向量数据库
            self.collection.add(
                ids=[chunk_id],
                embeddings=[embedding],
                documents=[chunk_text],
                metadatas=[{
                    'doc_id': doc.id,
                    'doc_source': doc.source,
                    'doc_type': doc.doc_type,
                    'chunk_index': i
                }]
            )
        
        logger.info(f"文档 '{doc.source}' 已分块并存储，共 {len(chunks)} 个片段")
        return chunks
    
    def search(self, query: str, top_k: int = 5) -> List[RetrievedChunk]:
        """搜索相关文本片段"""
        # 生成查询向量
        query_embedding = self.embedding_service.encode_single(query)
        
        # 向量搜索
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=['documents', 'metadatas', 'distances']
        )
        
        retrieved = []
        for i in range(len(results['ids'][0])):
            chunk_id = results['ids'][0][i]
            content = results['documents'][0][i]
            metadata = results['metadatas'][0][i]
            distance = results['distances'][0][i]
            
            # 计算相似度分数（余弦相似度）
            score = 1 - distance
            
            chunk = Chunk(
                id=chunk_id,
                content=content,
                doc_id=metadata['doc_id'],
                doc_source=metadata['doc_source'],
                index=metadata['chunk_index']
            )
            
            # 获取上下文
            context = self._get_context(chunk)
            
            retrieved.append(RetrievedChunk(
                chunk=chunk,
                score=score,
                context=context
            ))
        
        # 按分数排序
        retrieved.sort(key=lambda x: x.score, reverse=True)
        
        return retrieved
    
    def _get_context(self, chunk: Chunk, context_window: int = 1) -> str:
        """获取块的上下文"""
        # 获取相邻的块
        context_chunks = []
        
        for offset in range(-context_window, context_window + 1):
            if offset == 0:
                continue
            
            neighbor_id = f"{chunk.doc_id}_{chunk.index + offset}"
            try:
                result = self.collection.get(ids=[neighbor_id])
                if result['documents']:
                    context_chunks.append(result['documents'][0])
            except:
                pass
        
        # 组合上下文
        if context_chunks:
            return '\n'.join(context_chunks)
        return ""
    
    def delete_document(self, doc_id: str):
        """删除文档及其所有块"""
        # 获取该文档的所有块
        results = self.collection.get(
            where={"doc_id": doc_id}
        )
        
        if results['ids']:
            self.collection.delete(ids=results['ids'])
            logger.info(f"文档 {doc_id} 已从向量存储中删除")


class QAAgent:
    """
    智能问答助手 Agent
    
    核心能力：
    1. 知识库管理 - 上传、解析、存储文档
    2. 智能检索 - 基于语义相似度检索相关内容
    3. 对话生成 - 基于检索内容生成准确回答
    4. 上下文理解 - 维护对话历史，理解多轮对话
    """
    
    def __init__(self, agent_id: str, name: str, description: str = ""):
        self.agent_id = agent_id
        self.name = name
        self.description = description
        
        # 知识库
        self.documents: Dict[str, Document] = {}
        self.vector_store = VectorStore(collection_name=f"agent_{agent_id}")
        
        # 对话历史
        self.conversations: Dict[str, Conversation] = {}
        self.current_conversation_id: Optional[str] = None
        
        # 系统提示词
        self.system_prompt = self._build_system_prompt()
    
    def _build_system_prompt(self) -> str:
        """构建系统提示词"""
        return f"""你是"{self.name}"，一个专业的智能问答助手。

{self.description}

你的核心能力：
1. 深度理解用户提供的材料内容
2. 基于材料内容准确回答用户问题
3. 如果问题超出材料范围，诚实告知用户
4. 保持专业、友好的对话风格

回答要求：
- 基于提供的参考材料回答问题
- 如果引用材料，请标注来源
- 回答要准确、简洁、有条理
- 如果不确定，请说明并建议用户查阅原始材料
- 支持多轮对话，理解上下文

记住：你的回答必须基于用户提供的材料，不要编造信息。"""
    
    def add_document(self, file_path: str, content: bytes) -> Document:
        """添加文档到知识库"""
        # 解析文档
        doc = DocumentProcessor.process_file(file_path, content)
        
        # 存储文档
        self.documents[doc.id] = doc
        
        # 向量化存储
        self.vector_store.add_document(doc)
        
        logger.info(f"文档 '{doc.source}' 已添加到知识库")
        return doc
    
    def add_webpage(self, url: str, html_content: str) -> Document:
        """添加网页到知识库"""
        # 解析网页
        doc = DocumentProcessor.process_webpage(url, html_content)
        
        # 存储文档
        self.documents[doc.id] = doc
        
        # 向量化存储
        self.vector_store.add_document(doc)
        
        logger.info(f"网页 '{url}' 已添加到知识库")
        return doc
    
    def create_conversation(self, title: str = "") -> Conversation:
        """创建新对话"""
        conv_id = hashlib.md5(f"{self.agent_id}{datetime.now()}".encode()).hexdigest()[:16]
        
        if not title:
            title = f"对话 {len(self.conversations) + 1}"
        
        conversation = Conversation(
            id=conv_id,
            title=title
        )
        
        self.conversations[conv_id] = conversation
        self.current_conversation_id = conv_id
        
        return conversation
    
    async def chat(
        self, 
        message: str, 
        conversation_id: Optional[str] = None,
        stream: bool = True
    ) -> AsyncGenerator[str, None]:
        """
        对话问答
        
        流程：
        1. 检索相关知识
        2. 构建提示词
        3. 调用LLM生成回答
        4. 保存对话历史
        """
        # 获取或创建对话
        if conversation_id:
            conversation = self.conversations.get(conversation_id)
            if not conversation:
                raise ValidationException(f"对话 {conversation_id} 不存在")
        else:
            if not self.current_conversation_id:
                self.create_conversation()
            conversation = self.conversations[self.current_conversation_id]
        
        # 1. 检索相关知识
        retrieved_chunks = self.vector_store.search(message, top_k=5)
        
        # 构建参考材料
        references = []
        context_parts = []
        
        for i, chunk in enumerate(retrieved_chunks[:3]):  # 使用前3个最相关的结果
            if chunk.score > 0.5:  # 只使用相似度足够高的结果
                context_parts.append(f"[参考{i+1}] {chunk.chunk.content}")
                references.append({
                    'source': chunk.chunk.doc_source,
                    'score': chunk.score,
                    'content': chunk.chunk.content[:200] + "..."
                })
        
        context = "\n\n".join(context_parts) if context_parts else "无相关材料"
        
        # 2. 构建提示词
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "system", "content": f"以下是与用户问题相关的参考材料：\n\n{context}\n\n请基于以上材料回答用户问题。如果材料中没有相关信息，请诚实告知。"}
        ]
        
        # 添加历史对话（最近5轮）
        history = conversation.messages[-10:] if len(conversation.messages) > 10 else conversation.messages
        for msg in history:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # 添加当前问题
        messages.append({"role": "user", "content": message})
        
        # 3. 调用LLM生成回答
        full_response = ""
        
        try:
            async for chunk in llm_client.chat_stream(messages):
                content = chunk if isinstance(chunk, str) else chunk.get("content", "")
                full_response += content
                
                if stream:
                    yield content
            
            # 4. 保存对话历史
            user_msg = Message(
                id=hashlib.md5(f"user{datetime.now()}".encode()).hexdigest()[:16],
                role="user",
                content=message
            )
            
            assistant_msg = Message(
                id=hashlib.md5(f"assistant{datetime.now()}".encode()).hexdigest()[:16],
                role="assistant",
                content=full_response,
                sources=references
            )
            
            conversation.messages.append(user_msg)
            conversation.messages.append(assistant_msg)
            conversation.updated_at = datetime.now().isoformat()
            
            if not stream:
                yield full_response
                
        except Exception as e:
            logger.error(f"生成回答失败: {e}")
            error_msg = f"抱歉，生成回答时出现错误: {str(e)}"
            if stream:
                yield error_msg
            else:
                yield error_msg
    
    def get_conversation_history(self, conversation_id: str) -> List[Message]:
        """获取对话历史"""
        conversation = self.conversations.get(conversation_id)
        if conversation:
            return conversation.messages
        return []
    
    def list_documents(self) -> List[Document]:
        """列出所有文档"""
        return list(self.documents.values())
    
    def delete_document(self, doc_id: str):
        """删除文档"""
        if doc_id in self.documents:
            del self.documents[doc_id]
            self.vector_store.delete_document(doc_id)
            logger.info(f"文档 {doc_id} 已删除")


# 全局Agent管理器
class AgentManager:
    """Agent管理器 - 管理所有问答助手"""
    
    def __init__(self):
        self.agents: Dict[str, QAAgent] = {}
    
    def create_agent(self, name: str, description: str = "") -> QAAgent:
        """创建新Agent"""
        agent_id = hashlib.md5(f"{name}{datetime.now()}".encode()).hexdigest()[:16]
        
        agent = QAAgent(
            agent_id=agent_id,
            name=name,
            description=description
        )
        
        self.agents[agent_id] = agent
        logger.info(f"Agent '{name}' 已创建，ID: {agent_id}")
        
        return agent
    
    def get_agent(self, agent_id: str) -> Optional[QAAgent]:
        """获取Agent"""
        return self.agents.get(agent_id)
    
    def list_agents(self) -> List[QAAgent]:
        """列出所有Agent"""
        return list(self.agents.values())
    
    def delete_agent(self, agent_id: str):
        """删除Agent"""
        if agent_id in self.agents:
            del self.agents[agent_id]
            logger.info(f"Agent {agent_id} 已删除")


# 全局实例
agent_manager = AgentManager()
