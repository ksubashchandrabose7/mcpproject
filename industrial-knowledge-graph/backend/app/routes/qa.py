from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.qa import QARequest, QAResponse
from app.services.qa_service import QAService
from app.models.history import QAHistory
import json

router = APIRouter()
qa_service = QAService()

@router.post("/ask", response_model=QAResponse)
def ask_question(req: QARequest, db: Session = Depends(get_db)):
    service = QAService()
    result = service.answer_question(
        question=req.question, 
        db=db, 
        session_id=req.session_id, 
        emergency_mode=req.emergency_mode
    )
    
    hist = QAHistory(
        question=result['question'],
        answer=result['answer'],
        sources=json.dumps(result['sources']),
        entities_used=json.dumps(result['entities'])
    )
    db.add(hist)
    db.commit()
    db.refresh(hist)
    
    result['qa_history_id'] = hist.id
    return result


@router.get("/qa-history")
def get_qa_history_route(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    history = db.query(QAHistory).order_by(QAHistory.created_at.desc()).offset(skip).limit(limit).all()
    return history
