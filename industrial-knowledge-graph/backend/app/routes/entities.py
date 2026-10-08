from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.knowledge import Entity, Relationship
from app.schemas.knowledge import EntityResponse
from sqlalchemy import func

router = APIRouter(prefix="/entities")

@router.get("", response_model=List[EntityResponse])
def get_entities(entity_type: Optional[str] = None, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    query = db.query(Entity)
    if entity_type:
        query = query.filter(Entity.entity_type == entity_type)
    return query.offset(skip).limit(limit).all()

@router.get("/types")
def get_entity_types(db: Session = Depends(get_db)):
    types = db.query(Entity.entity_type, func.count(Entity.id)).group_by(Entity.entity_type).all()
    return [{"type": t[0], "count": t[1]} for t in types]

@router.get("/{entity_id}")
def get_entity(entity_id: int, db: Session = Depends(get_db)):
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
        
    rels = db.query(Relationship).filter(
        (Relationship.source_entity_id == entity_id) | (Relationship.target_entity_id == entity_id)
    ).all()
    
    return {
        "entity": entity,
        "relationships": rels
    }
