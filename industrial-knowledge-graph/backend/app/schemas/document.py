from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class DocumentCreate(BaseModel):
    filename: str
    file_type: str

class DocumentResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_type: str
    status: str
    entity_count: int
    relationship_count: int
    uploaded_at: datetime
    processed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    file_size: int

    class Config:
        from_attributes = True

class DocumentDetailResponse(DocumentResponse):
    extracted_text: Optional[str] = None

    class Config:
        from_attributes = True

class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int

class ChunkResponse(BaseModel):
    id: int
    chunk_index: int
    chunk_text: str
    page_number: Optional[int] = 1

    class Config:
        from_attributes = True
