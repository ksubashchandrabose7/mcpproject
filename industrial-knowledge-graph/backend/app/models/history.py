from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.database import Base

class QAHistory(Base):
    __tablename__ = "qa_history"
    id = Column(Integer, primary_key=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    sources = Column(Text, nullable=True)
    entities_used = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SearchHistory(Base):
    __tablename__ = "search_history"
    id = Column(Integer, primary_key=True)
    query = Column(String(1000), nullable=False)
    result_count = Column(Integer, default=0)
    search_type = Column(String(50), default='semantic')
    created_at = Column(DateTime, default=datetime.utcnow)
