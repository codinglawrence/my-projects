import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import require_admin
from app.services.knowledge_service import KnowledgeService
from app.schemas.knowledge import TextEntryRequest, DocumentListResponse, DocumentDetailResponse, ChunkResponse
from app.schemas.auth import ApiResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.get("/documents", response_model=ApiResponse)
def list_documents(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    keyword: str = Query(None),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    svc = KnowledgeService(db)
    items, total = svc.list_documents(page=page, size=size, keyword=keyword)
    return ApiResponse(data={
        "items": [DocumentDetailResponse.model_validate(d).model_dump() for d in items],
        "total": total,
    })


@router.get("/documents/{doc_id}", response_model=ApiResponse)
def get_document(
    doc_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    svc = KnowledgeService(db)
    try:
        doc = svc.get_document(doc_id)
        chunks = svc.get_document_chunks(doc_id)
        doc_data = DocumentDetailResponse.model_validate(doc).model_dump()
        doc_data["chunks"] = [ChunkResponse.model_validate(c).model_dump() for c in chunks]
        return ApiResponse(data=doc_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/documents", response_model=ApiResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(""),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    ALLOWED_EXTENSIONS = {".txt", ".md", ".json"}
    ext = ("." + file.filename.rsplit(".", 1)[-1].lower()) if file.filename and "." in file.filename else ""
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"不支持的文件类型: {ext}，仅支持 {', '.join(ALLOWED_EXTENSIONS)}")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail=f"文件大小超过限制 ({MAX_FILE_SIZE // (1024 * 1024)} MB)")
    await file.seek(0)

    svc = KnowledgeService(db)
    try:
        doc = svc.upload_document(file, title)
        return ApiResponse(data=DocumentDetailResponse.model_validate(doc).model_dump(), message="上传成功")
    except (ValueError, IOError, RuntimeError) as e:
        logger.error("Document upload failed: %s", str(e))
        raise HTTPException(status_code=500, detail=f"上传失败: {str(e)}")


@router.post("/documents/text", response_model=ApiResponse)
def add_text_entry(
    req: TextEntryRequest,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    svc = KnowledgeService(db)
    doc = svc.add_text_entry(req.title, req.content)
    return ApiResponse(data=DocumentDetailResponse.model_validate(doc).model_dump(), message="录入成功")


@router.delete("/documents/{doc_id}", response_model=ApiResponse)
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    svc = KnowledgeService(db)
    try:
        svc.delete_document(doc_id)
        return ApiResponse(message="删除成功")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/rebuild", response_model=ApiResponse)
def rebuild_index(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    svc = KnowledgeService(db)
    try:
        result = svc.rebuild_index()
        return ApiResponse(data=result, message="重建完成")
    except (ValueError, RuntimeError) as e:
        logger.error("Index rebuild failed: %s", str(e))
        raise HTTPException(status_code=500, detail=f"重建失败: {str(e)}")
