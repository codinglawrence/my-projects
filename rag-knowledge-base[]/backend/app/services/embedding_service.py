from typing import List

import dashscope
from dashscope import TextEmbedding
from langchain_core.embeddings import Embeddings

from app.config import settings

# DashScope text-embedding-v3 returns 1024-dim vectors.
_DASHSCOPE_EMBEDDING_MODEL = "text-embedding-v3"


class EmbeddingService:
    """Low-level wrapper around DashScope text-embedding-v3.

    Used directly by KnowledgeService for ingestion. We use the official
    `dashscope` SDK (not langchain_openai) because recent openai SDK versions
    tokenize embedding input into token-ID arrays, which DashScope's
    compatible endpoint rejects with "contents is neither str nor list of str".
    """

    def __init__(self, model: str = _DASHSCOPE_EMBEDDING_MODEL):
        dashscope.api_key = settings.DASHSCOPE_API_KEY
        self.model = model

    def _call(self, inputs):
        resp = TextEmbedding.call(model=self.model, input=inputs)
        if getattr(resp, "status_code", None) != 200:
            raise RuntimeError(
                f"DashScope embedding failed: {getattr(resp, 'code', '')} "
                f"{getattr(resp, 'message', '')}"
            )
        return resp.output["embeddings"]

    def embed_query(self, text: str) -> List[float]:
        return self._call(text)[0]["embedding"]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        # DashScope text-embedding-v3 caps batch size at 10; split into chunks.
        results: List[List[float]] = []
        for i in range(0, len(texts), 10):
            batch = texts[i : i + 10]
            embeddings = self._call(batch)
            # DashScope returns embeddings in the same order as the input list.
            results.extend(e["embedding"] for e in embeddings)
        return results


class DashScopeEmbeddings(Embeddings):
    """LangChain-compatible embeddings backed by DashScope.

    Used by RAGService to plug into the Chroma vector store (retrieval).
    """

    def __init__(self, model: str = _DASHSCOPE_EMBEDDING_MODEL):
        self._svc = EmbeddingService(model=model)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self._svc.embed_documents(texts)

    def embed_query(self, text: str) -> List[float]:
        return self._svc.embed_query(text)
