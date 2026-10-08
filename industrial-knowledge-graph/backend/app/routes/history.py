import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.history import SearchHistory, QAHistory
from app.models.document import Document
from app.models.knowledge import Entity, Relationship, KnowledgeGraphNode, KnowledgeGraphEdge
from app.schemas.history import SearchHistoryResponse, QAHistoryResponse
from typing import List

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Stats (dashboard) ──────────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get system-wide statistics for the dashboard."""
    total_documents = db.query(Document).count()
    total_entities = db.query(Entity).count()
    total_relationships = db.query(Relationship).count()
    graph_nodes = db.query(KnowledgeGraphNode).count()
    graph_edges = db.query(KnowledgeGraphEdge).count()

    completed_documents = db.query(Document).filter(Document.status == 'completed').count()
    failed_documents = db.query(Document).filter(Document.status == 'failed').count()
    processing_documents = db.query(Document).filter(Document.status == 'processing').count()
    pending_documents = db.query(Document).filter(Document.status == 'pending').count()

    # Entity type breakdown
    entity_type_rows = db.query(Entity.entity_type, func.count(Entity.id)).group_by(Entity.entity_type).all()
    entity_types = {row[0]: row[1] for row in entity_type_rows}

    # Relationship type breakdown
    rel_type_rows = db.query(Relationship.relationship_type, func.count(Relationship.id)).group_by(Relationship.relationship_type).all()
    relationship_types = {row[0]: row[1] for row in rel_type_rows}

    # Recent documents (last 5)
    recent_documents = db.query(Document).order_by(Document.uploaded_at.desc()).limit(5).all()
    recent_docs_data = [
        {
            "id": d.id,
            "filename": d.original_filename,
            "file_type": d.file_type,
            "status": d.status,
            "entity_count": d.entity_count,
            "relationship_count": d.relationship_count,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
            "file_size": d.file_size,
        }
        for d in recent_documents
    ]

    # Recent QA sessions
    recent_qa = db.query(QAHistory).order_by(QAHistory.created_at.desc()).limit(5).all()
    recent_qa_data = [
        {"id": q.id, "question": q.question[:100], "created_at": q.created_at.isoformat()}
        for q in recent_qa
    ]

    return {
        "total_documents": total_documents,
        "total_entities": total_entities,
        "total_relationships": total_relationships,
        "graph_nodes": graph_nodes,
        "graph_edges": graph_edges,
        "completed_documents": completed_documents,
        "failed_documents": failed_documents,
        "processing_documents": processing_documents,
        "pending_documents": pending_documents,
        "entity_types": entity_types,
        "relationship_types": relationship_types,
        "recent_documents": recent_docs_data,
        "recent_qa": recent_qa_data,
    }

# ── Search history ─────────────────────────────────────────────────────────────

@router.get("/search-history", response_model=List[SearchHistoryResponse])
def get_search_history(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return db.query(SearchHistory).order_by(SearchHistory.created_at.desc()).offset(skip).limit(limit).all()

@router.delete("/search-history")
def clear_search_history(db: Session = Depends(get_db)):
    db.query(SearchHistory).delete()
    db.commit()
    return {"message": "Search history cleared"}

# ── QA history ─────────────────────────────────────────────────────────────────

@router.get("/qa-history", response_model=List[QAHistoryResponse])
def get_qa_history(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return db.query(QAHistory).order_by(QAHistory.created_at.desc()).offset(skip).limit(limit).all()

@router.delete("/qa-history")
def clear_qa_history(db: Session = Depends(get_db)):
    db.query(QAHistory).delete()
    db.commit()
    return {"message": "QA history cleared"}

@router.delete("/qa-history/{qa_id}")
def delete_qa_entry(qa_id: int, db: Session = Depends(get_db)):
    entry = db.query(QAHistory).filter(QAHistory.id == qa_id).first()
    if not entry:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="QA entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "QA entry deleted"}

import io
import csv
from fastapi.responses import StreamingResponse

@router.get("/qa-history/export")
def export_qa_history(db: Session = Depends(get_db)):
    """Export QA history as CSV."""
    qa_list = db.query(QAHistory).order_by(QAHistory.created_at.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Question", "Answer", "Created At"])
    
    for qa in qa_list:
        writer.writerow([qa.id, qa.question, qa.answer, qa.created_at.isoformat() if qa.created_at else ""])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=qa_history.csv"}
    )
