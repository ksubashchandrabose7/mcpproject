from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class QAHistoryResponse(BaseModel):
    id: int
    question: str
    answer: str
    sources: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SearchHistoryResponse(BaseModel):
    id: int
    query: str
    result_count: int
    created_at: datetime

    class Config:
        from_attributes = True
