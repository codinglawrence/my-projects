import os
import uuid
from typing import List, Tuple, Optional
from fastapi import UploadFile
from sqlalchemy.orm import Session
from langchain_text_splitters import RecursiveCharacterTextSplitter
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings
from app.models.document import Document
from app.models.chunk import Chunk
from app.services.embedding_service import EmbeddingService


class KnowledgeService:
    def __init__(self, db: Session):
        self.db = db
        self.embedding_svc = EmbeddingService()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            separators=["\n\n", "\n", "。", ".", "！", "！", "？", "?", " ", ""],
        )
        self._chroma_client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self._collection = self._chroma_client.get_or_create_collection(
            name="rag_knowledge_base",
            metadata={"hnsw:space": "cosine"},
        )

    def upload_document(self, file: UploadFile, title: str) -> Document:
        content_bytes = file.file.read()
        try:
            content = content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            content = content_bytes.decode("gbk", errors="replace")

        file_type = os.path.splitext(file.filename or "unknown.txt")[1].lstrip(".") or "txt"
        file_size = len(content_bytes)

        doc = Document(
            title=title or (file.filename or "未命名文档"),
            content=content,
            file_type=file_type,
            file_size=file_size,
            chunk_count=0,
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)

        chunk_count = self._chunk_and_embed(doc.id, content)
        doc.chunk_count = chunk_count
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def add_text_entry(self, title: str, content: str) -> Document:
        doc = Document(
            title=title,
            content=content,
            file_type="manual",
            file_size=len(content.encode("utf-8")),
            chunk_count=0,
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)

        chunk_count = self._chunk_and_embed(doc.id, content)
        doc.chunk_count = chunk_count
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def delete_document(self, doc_id: int):
        doc = self.db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            raise ValueError("文档不存在")

        # Delete from ChromaDB
        chunks = self.db.query(Chunk).filter(Chunk.document_id == doc_id).all()
        self._delete_vectors(chunks)

        # Delete from SQLite (cascade: chunks also deleted)
        self.db.delete(doc)
        self.db.commit()

    def list_documents(
        self, page: int = 1, size: int = 20, keyword: Optional[str] = None
    ) -> Tuple[List[Document], int]:
        query = self.db.query(Document)
        if keyword:
            query = query.filter(Document.title.contains(keyword))

        total = query.count()
        items = query.order_by(Document.uploaded_at.desc()).offset((page - 1) * size).limit(size).all()
        return items, total

    def get_document(self, doc_id: int) -> Document:
        doc = self.db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            raise ValueError("文档不存在")
        return doc

    def get_document_chunks(self, doc_id: int) -> List[Chunk]:
        return (
            self.db.query(Chunk)
            .filter(Chunk.document_id == doc_id)
            .order_by(Chunk.chunk_index)
            .all()
        )

    def rebuild_index(self) -> dict:
        # Delete all ChromaDB vectors
        try:
            self._chroma_client.delete_collection("rag_knowledge_base")
        except Exception:
            pass
        self._collection = self._chroma_client.get_or_create_collection(
            name="rag_knowledge_base",
            metadata={"hnsw:space": "cosine"},
        )

        # Clear all chunk vector_ids
        self.db.query(Chunk).update({Chunk.vector_id: None})
        self.db.commit()

        # Re-ingest all documents
        docs = self.db.query(Document).all()
        total_chunks = 0
        for doc in docs:
            # Delete old chunks
            self.db.query(Chunk).filter(Chunk.document_id == doc.id).delete()
            self.db.commit()
            # Re-chunk
            chunk_count = self._chunk_and_embed(doc.id, doc.content)
            doc.chunk_count = chunk_count
            total_chunks += chunk_count
        self.db.commit()

        return {"document_count": len(docs), "chunk_count": total_chunks}

    def _chunk_and_embed(self, document_id: int, content: str) -> int:
        chunks_text = self.text_splitter.split_text(content)

        if not chunks_text:
            return 0

        # Batch embed
        vectors = self.embedding_svc.embed_documents(chunks_text)

        vector_ids = []
        metadatas = []
        for i, chunk_text in enumerate(chunks_text):
            vid = f"doc_{document_id}_chunk_{i}_{uuid.uuid4().hex[:8]}"
            vector_ids.append(vid)
            metadatas.append({
                "document_id": str(document_id),
                "chunk_index": str(i),
            })

            # Save chunk to SQLite
            chunk = Chunk(
                document_id=document_id,
                content=chunk_text,
                chunk_index=i,
                vector_id=vid,
            )
            self.db.add(chunk)

        self.db.commit()

        # Add to ChromaDB
        try:
            self._collection.add(
                ids=vector_ids,
                embeddings=vectors,
                documents=chunks_text,
                metadatas=metadatas,
            )
        except Exception as e:
            print(f"ChromaDB add warning: {e}")

        return len(chunks_text)

    def _delete_vectors(self, chunks: List[Chunk]):
        vector_ids = [c.vector_id for c in chunks if c.vector_id]
        if vector_ids:
            try:
                self._collection.delete(ids=vector_ids)
            except Exception as e:
                print(f"ChromaDB delete warning: {e}")
