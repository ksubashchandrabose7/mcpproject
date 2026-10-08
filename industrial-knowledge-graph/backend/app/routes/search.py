from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import json
from app.database import get_db
from app.schemas.search import SearchRequest, SearchResponse, SearchResultItem
from app.models.history import SearchHistory
from app.models.document import DocumentChunk, Document
from app.services.embedding_service import EmbeddingService

router = APIRouter(prefix="/search")

@router.post("", response_model=SearchResponse)
def perform_search(req: SearchRequest, db: Session = Depends(get_db)):
    embed_service = EmbeddingService.get_instance()
    q_emb = embed_service.encode_single(req.query)
    
    chunks = db.query(DocumentChunk).all()
    chunk_embeddings = []
    chunk_map = []
    for c in chunks:
        if c.embedding:
            try:
                emb = json.loads(c.embedding)
                chunk_embeddings.append(emb)
                chunk_map.append(c)
            except Exception:
                pass
            
    if chunk_embeddings:
        similarities = embed_service.search_similar(q_emb, chunk_embeddings, top_k=req.limit)
    else:
        # Fallback text search if embeddings aren't stored
        words = [w for w in req.query.lower().split() if len(w) > 2]
        scored = []
        for c in chunks:
            text_lower = c.chunk_text.lower()
            matches = sum(1 for w in words if w in text_lower)
            if matches > 0:
                score = min(0.95, 0.5 + 0.15 * matches)
                scored.append((c, score))
        scored.sort(key=lambda x: x[1], reverse=True)
        similarities = [(i, score) for i, (c, score) in enumerate(scored[:req.limit])]
        chunk_map = [c for c, score in scored[:req.limit]]
    
    results = []
    from app.models.knowledge import Entity
    for idx, score in similarities:
        if idx < len(chunk_map):
            c = chunk_map[idx]
            doc = db.query(Document).filter_by(id=c.document_id).first()
            
            # Fetch entities associated with the document
            doc_entities = db.query(Entity).filter_by(document_id=c.document_id).limit(5).all()
            entities_data = [
                {"name": e.entity_name, "type": e.entity_type} for e in doc_entities
            ]

            results.append(SearchResultItem(
                chunk_id=c.id,
                document_id=c.document_id,
                document_name=doc.original_filename if doc else "Unknown",
                chunk_text=c.chunk_text,
                similarity_score=float(score) if not (score != score) else 0.0,
                entities=entities_data
            ))
        
    hist = SearchHistory(query=req.query, result_count=len(results), search_type='semantic')
    db.add(hist)
    db.commit()
    db.refresh(hist)
    
    return SearchResponse(
        query=req.query,
        results=results,
        total=len(results),
        search_history_id=hist.id
    )
