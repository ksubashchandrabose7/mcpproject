from pydantic import BaseModel
from typing import List, Optional

class SearchRequest(BaseModel):
    query: str
    limit: int = 10

class SearchResultItem(BaseModel):
    chunk_id: int
    document_id: int
    document_name: str
    chunk_text: str
    similarity_score: float
    entities: List[dict]

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]
    total: int
    search_history_id: Optional[int] = None
