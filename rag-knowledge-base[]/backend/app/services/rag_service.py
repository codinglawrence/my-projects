import json
import asyncio
from typing import AsyncGenerator, List
from langchain_openai import ChatOpenAI
from langchain_community.vectorstores import Chroma
from app.services.embedding_service import DashScopeEmbeddings
from langchain_core.messages import SystemMessage, HumanMessage
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings
from app.services.session_service import SessionService


SYSTEM_PROMPT = """你是一个专业的产品信息知识库助手。基于提供的商品信息上下文，回答用户的问题。

要求：
1. 仅基于提供的上下文信息回答，不要编造信息
2. 如果上下文不足以回答，请诚实说明
3. 回答中引用来源时使用 [编号] 格式，如 [1]、[2]
4. 回答要结构化，使用适当的 Markdown 格式（表格、列表、加粗等）
5. 如果是商品对比问题，优先使用表格形式呈现

---

上下文信息：
{context}

---

历史对话：
{history}

---

当前用户问题：{question}

请回答："""


class RAGService:
    def __init__(self):
        self.embeddings = DashScopeEmbeddings()
        self.llm = ChatOpenAI(
            model=settings.DEEPSEEK_MODEL,
            openai_api_key=settings.DEEPSEEK_API_KEY,
            openai_api_base=settings.DEEPSEEK_BASE_URL,
            streaming=True,
            temperature=0.7,
            max_tokens=2048,
        )
        self._chroma_client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self.vectorstore = Chroma(
            client=self._chroma_client,
            collection_name="rag_knowledge_base",
            embedding_function=self.embeddings,
        )

    async def generate_answer(
        self,
        session_id: int,
        question: str,
        db_session,
    ) -> AsyncGenerator[str, None]:
        # Step 1: Retrieve relevant chunks
        retrieved_docs = self._retrieve(question)

        # Step 2: Build context string with citations
        context_parts = []
        citations = []
        for i, doc in enumerate(retrieved_docs):
            idx = i + 1
            context_parts.append(f"[{idx}] {doc.page_content}")
            citations.append({
                "index": idx,
                "content": doc.page_content[:300],
                "source": doc.metadata.get("document_id", "未知"),
                "chunk_index": doc.metadata.get("chunk_index", "0"),
            })
        context = "\n\n".join(context_parts)

        # Step 3: Get history
        session_svc = SessionService(db_session)
        history = session_svc.get_history_for_prompt(session_id, limit=10)

        # Step 4: Build prompt
        prompt_text = SYSTEM_PROMPT.format(
            context=context if context else "暂无相关上下文信息",
            history=history if history else "无历史对话",
            question=question,
        )

        messages = [
            SystemMessage(content=prompt_text),
            HumanMessage(content=question),
        ]

        # Step 5: Stream from LLM
        full_answer = ""
        try:
            async for chunk in self.llm.astream(messages):
                if chunk.content:
                    content = chunk.content
                    full_answer += content
                    escaped = json.dumps(content, ensure_ascii=False)
                    yield f"data: {json.dumps({'type': 'chunk', 'content': content}, ensure_ascii=False)}\n\n"
        except Exception as e:
            error_msg = json.dumps({"type": "error", "message": str(e)}, ensure_ascii=False)
            yield f"data: {error_msg}\n\n"
            return

        # Step 6: Send citations
        done_msg = json.dumps({
            "type": "done",
            "citations": citations,
            "full_answer": full_answer,
        }, ensure_ascii=False)
        yield f"data: {done_msg}\n\n"
        yield "data: [DONE]\n\n"

    def _retrieve(self, question: str, top_k: int = None) -> list:
        if top_k is None:
            top_k = settings.TOP_K
        try:
            docs = self.vectorstore.similarity_search(question, k=top_k)
            return docs
        except Exception as e:
            print(f"Retrieval error: {e}")
            return []

    def get_question_suggestions(self, n: int = 5) -> List[str]:
        defaults = [
            "这件商品有什么主要特点？",
            "请介绍一下这款产品的规格参数？",
            "这个产品适合什么场景使用？",
            "有哪些同类商品可以推荐？",
            "这款商品的售后服务如何？",
        ]
        return defaults[:n]
