from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class QARequest(BaseModel):
    question: str
    session_id: Optional[str] = None
    emergency_mode: Optional[bool] = False

class QAResponse(BaseModel):
    question: str
    answer: str
    sources: List[Dict[str, Any]]
    entities: List[Dict[str, Any]]
    graph_context: str
    qa_history_id: Optional[int] = None
    session_id: Optional[str] = None
    runability: Optional[str] = "UNKNOWN"
    diagnostic_questions: Optional[List[str]] = []
    active_ram_entities: Optional[List[str]] = []

