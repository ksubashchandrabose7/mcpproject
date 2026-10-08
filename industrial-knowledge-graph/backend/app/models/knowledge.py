from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey
from datetime import datetime
from app.database import Base
from sqlalchemy.orm import relationship

class Entity(Base):
    __tablename__ = "entities"
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    entity_name = Column(String(500), nullable=False)
    entity_type = Column(String(100), nullable=False)
    description = Column(String(1000), nullable=True)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="entities")

class Relationship(Base):
    __tablename__ = "relationships"
    id = Column(Integer, primary_key=True)
    source_entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    target_entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    relationship_type = Column(String(100), nullable=False)
    confidence = Column(Float, default=1.0)
    is_verified = Column(Integer, default=0) # 0: pending, 1: verified, -1: rejected
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="relationships_in_doc")
    source_entity = relationship("Entity", foreign_keys=[source_entity_id])
    target_entity = relationship("Entity", foreign_keys=[target_entity_id])

class KnowledgeGraphNode(Base):
    __tablename__ = "knowledge_graph_nodes"
    id = Column(Integer, primary_key=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), unique=True, nullable=False)
    node_label = Column(String(500), nullable=False)
    node_type = Column(String(100), nullable=False)
    properties = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class KnowledgeGraphEdge(Base):
    __tablename__ = "knowledge_graph_edges"
    id = Column(Integer, primary_key=True)
    source_node_id = Column(Integer, ForeignKey("knowledge_graph_nodes.id"), nullable=False)
    target_node_id = Column(Integer, ForeignKey("knowledge_graph_nodes.id"), nullable=False)
    relationship_id = Column(Integer, ForeignKey("relationships.id"), nullable=False)
    edge_label = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
