import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import shutil
from typing import List, Optional
from app.database import get_db
from app.models.document import Document, DocumentChunk
from app.models.knowledge import Entity, Relationship
from app.schemas.document import DocumentResponse, DocumentDetailResponse, DocumentListResponse, ChunkResponse
from app.utils.file_utils import validate_file, get_upload_path, ALLOWED_EXTENSIONS
from app.services.document_service import DocumentService
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents")
doc_service = DocumentService()

# ── Upload ─────────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=DocumentResponse)
def upload_document(
    file: UploadFile = File(...),
    auto_process: bool = Query(default=True, description="Automatically start processing after upload"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Upload a document (PDF, DOCX, TXT, CSV, XLSX)."""
    if not validate_file(file.filename):
        ext_list = ", ".join(ALLOWED_EXTENSIONS)
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {ext_list}")

    MAX_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large. Max size: {settings.MAX_FILE_SIZE_MB} MB")
    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty.")

    file_path = get_upload_path(file.filename)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_ext = os.path.splitext(file.filename)[1].lower()

    db_doc = Document(
        filename=file_path.name,
        original_filename=file.filename,
        file_type=file_ext,
        file_path=str(file_path),
        file_size=file_size,
        status="pending"
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    logger.info(f"Document uploaded: {file.filename} → {file_path} (size: {file_size} bytes)")

    if auto_process:
        background_tasks.add_task(_process_in_background, db_doc.id)

    return db_doc


def _process_in_background(document_id: int):
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        doc_service.process_document(document_id, db)
    except Exception as e:
        logger.error(f"Background processing failed for doc {document_id}: {e}")
    finally:
        db.close()

# ── List ───────────────────────────────────────────────────────────────────────

@router.get("", response_model=DocumentListResponse)
def get_documents(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    if status:
        query = query.filter(Document.status == status)
    if search:
        query = query.filter(Document.original_filename.ilike(f"%{search}%"))
    
    total = query.count()
    docs = query.order_by(Document.uploaded_at.desc()).offset(skip).limit(limit).all()
    return {"documents": docs, "total": total, "items": docs}

# ── Get single ────────────────────────────────────────────────────────────────

@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.extracted_text and len(doc.extracted_text) > 5000:
        doc.extracted_text = doc.extracted_text[:5000] + "...[truncated]"
    return doc

# ── Download / Stream File ───────────────────────────────────────────────────

@router.get("/{document_id}/file")
def get_document_file(document_id: int, db: Session = Depends(get_db)):
    """Serve the raw document file for viewing in browser or PDF viewer."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document file not found")
    
    content_type = "application/pdf" if doc.file_type.lower() == ".pdf" else "application/octet-stream"
    headers = {
        "Content-Disposition": f"inline; filename=\"{doc.original_filename}\""
    }
    return FileResponse(
        path=doc.file_path, 
        filename=doc.original_filename, 
        media_type=content_type,
        headers=headers
    )

# ── Read Page Content ─────────────────────────────────────────────────────────

@router.get("/{document_id}/page/{page_number}")
def get_document_page_content(document_id: int, page_number: int, db: Session = Depends(get_db)):
    """Access, open, and read the actual text content of a specific page number."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == document_id,
        DocumentChunk.page_number == page_number
    ).order_by(DocumentChunk.chunk_index.asc()).all()

    max_page = db.query(func.max(DocumentChunk.page_number)).filter(
        DocumentChunk.document_id == document_id
    ).scalar() or 1

    page_text = "\n\n".join([c.chunk_text for c in chunks]) if chunks else ""

    if not page_text and os.path.exists(doc.file_path):
        from app.utils.file_utils import extract_pages
        all_p = extract_pages(doc.file_path, doc.file_type)
        matching_p = [p for p in all_p if p['page_number'] == page_number]
        if matching_p:
            page_text = matching_p[0]['text']
            max_page = len(all_p)

    return {
        "document_id": doc.id,
        "document_name": doc.original_filename,
        "file_type": doc.file_type,
        "page_number": page_number,
        "total_pages": max_page,
        "page_text": page_text,
        "chunks": [{"id": c.id, "chunk_index": c.chunk_index, "chunk_text": c.chunk_text} for c in chunks],
        "file_url": f"/api/documents/{doc.id}/file#page={page_number}"
    }

# ── Status endpoint ────────────────────────────────────────────────────────────

@router.get("/{document_id}/status")
def get_document_status(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "id": doc.id,
        "status": doc.status,
        "entity_count": doc.entity_count,
        "relationship_count": doc.relationship_count,
        "error_message": doc.error_message,
        "processed_at": doc.processed_at.isoformat() if doc.processed_at else None
    }

# ── Process ────────────────────────────────────────────────────────────────────

@router.post("/{document_id}/process")
def process_document(document_id: int, db: Session = Depends(get_db)):
    return doc_service.process_document(document_id, db)

# ── Delete ─────────────────────────────────────────────────────────────────────

@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            logger.warning(f"Could not delete file {doc.file_path}: {e}")

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully", "id": document_id}

# ── Entities ───────────────────────────────────────────────────────────────────

@router.get("/{document_id}/entities")
def get_document_entities(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    entities = db.query(Entity).filter(Entity.document_id == document_id).all()
    return [{"id": e.id, "entity_name": e.entity_name, "entity_type": e.entity_type, "confidence": e.confidence} for e in entities]

# ── Chunks ─────────────────────────────────────────────────────────────────────

@router.get("/{document_id}/chunks", response_model=List[ChunkResponse])
def get_document_chunks(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc.chunks
