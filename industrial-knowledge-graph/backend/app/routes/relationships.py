from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models.knowledge import Relationship, Entity
from app.schemas.knowledge import RelationshipResponse
from sqlalchemy import func

router = APIRouter(prefix="/relationships")

@router.get("")
def get_relationships(relationship_type: Optional[str] = None, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    query = db.query(Relationship)
    if relationship_type:
        query = query.filter(Relationship.relationship_type == relationship_type)
    rels = query.offset(skip).limit(limit).all()
    
    result = []
    for r in rels:
        src = db.query(Entity).filter(Entity.id == r.source_entity_id).first()
        tgt = db.query(Entity).filter(Entity.id == r.target_entity_id).first()
        result.append({
            "id": r.id,
            "source_entity_id": r.source_entity_id,
            "target_entity_id": r.target_entity_id,
            "source_name": src.entity_name if src else "Unknown",
            "target_name": tgt.entity_name if tgt else "Unknown",
            "relationship_type": r.relationship_type,
            "confidence": r.confidence,
            "is_verified": r.is_verified,
            "document_id": r.document_id
        })
    return result

from pydantic import BaseModel
class VerifyRequest(BaseModel):
    status: int # 1 for verified, -1 for rejected, 0 for pending

@router.post("/{rel_id}/verify")
def verify_relationship(rel_id: int, req: VerifyRequest, db: Session = Depends(get_db)):
    rel = db.query(Relationship).filter(Relationship.id == rel_id).first()
    if not rel:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Relationship not found")
    rel.is_verified = req.status
    db.commit()
    return {"message": "Verification status updated", "is_verified": rel.is_verified}

@router.get("/types")
def get_relationship_types(db: Session = Depends(get_db)):
    types = db.query(Relationship.relationship_type, func.count(Relationship.id)).group_by(Relationship.relationship_type).all()
    return [{"type": t[0], "count": t[1]} for t in types]
