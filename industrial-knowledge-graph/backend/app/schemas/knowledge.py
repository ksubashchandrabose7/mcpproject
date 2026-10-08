from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any

class EntityResponse(BaseModel):
    id: int
    entity_name: str
    entity_type: str
    description: Optional[str] = None
    confidence: float
    document_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RelationshipResponse(BaseModel):
    id: int
    source_entity_id: int
    target_entity_id: int
    relationship_type: str
    confidence: float
    document_id: Optional[int] = None

    class Config:
        from_attributes = True

class GraphNodeResponse(BaseModel):
    id: int
    entity_id: int
    node_label: str
    node_type: str
    properties: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class GraphEdgeResponse(BaseModel):
    id: int
    source_node_id: int
    target_node_id: int
    edge_label: str

    class Config:
        from_attributes = True

class GraphDataResponse(BaseModel):
    nodes: List[GraphNodeResponse]
    edges: List[GraphEdgeResponse]
    stats: Dict[str, Any]

class NodeDetailResponse(BaseModel):
    node: GraphNodeResponse
    connected_relationships: List[RelationshipResponse]
    connected_nodes: List[GraphNodeResponse]
