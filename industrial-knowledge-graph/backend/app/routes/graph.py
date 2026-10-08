from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.graph_service import GraphService
from app.models.knowledge import KnowledgeGraphNode, KnowledgeGraphEdge

router = APIRouter(prefix="/graph")
graph_service = GraphService()

@router.get("")
def get_graph(
    node_type: str = Query(default="", description="Filter nodes by type"),
    db: Session = Depends(get_db)
):
    """Get the full knowledge graph data for visualization."""
    data = graph_service.get_full_graph(db, node_type_filter=node_type)
    stats = graph_service.get_stats(db)
    return {"nodes": data["nodes"], "edges": data["edges"], "stats": stats}

@router.get("/stats")
def get_graph_stats(db: Session = Depends(get_db)):
    """Get graph statistics (node/edge counts, type breakdowns)."""
    return graph_service.get_stats(db)

@router.get("/node/{entity_id}")
def get_node(entity_id: int, db: Session = Depends(get_db)):
    """Get detailed information for a specific graph node."""
    return graph_service.get_node_detail(entity_id, db)

@router.get("/node/{entity_id}/neighbors")
def get_node_neighbors(entity_id: int, db: Session = Depends(get_db)):
    """Get all neighboring nodes and edges for a specific node."""
    node = db.query(KnowledgeGraphNode).filter(KnowledgeGraphNode.entity_id == entity_id).first()
    if not node:
        return {"nodes": [], "edges": []}

    # Find all connected edges
    edges = db.query(KnowledgeGraphEdge).filter(
        (KnowledgeGraphEdge.source_node_id == node.id) |
        (KnowledgeGraphEdge.target_node_id == node.id)
    ).all()

    neighbor_ids = set()
    for e in edges:
        neighbor_ids.add(e.source_node_id)
        neighbor_ids.add(e.target_node_id)

    neighbors = db.query(KnowledgeGraphNode).filter(KnowledgeGraphNode.id.in_(neighbor_ids)).all()

    from app.graph.graph_builder import NODE_COLORS
    import json
    nodes_data = []
    for n in neighbors:
        nodes_data.append({
            "data": {
                "id": str(n.id),
                "label": n.node_label,
                "type": n.node_type,
                "color": NODE_COLORS.get(n.node_type, "#6b7280"),
                "selected": n.id == node.id
            }
        })

    edges_data = [
        {
            "data": {
                "id": str(e.id),
                "source": str(e.source_node_id),
                "target": str(e.target_node_id),
                "label": e.edge_label
            }
        }
        for e in edges
    ]

    return {"nodes": nodes_data, "edges": edges_data}

@router.get("/search")
def search_graph(
    q: str = Query(..., description="Search term"),
    db: Session = Depends(get_db)
):
    """Search graph nodes by label."""
    results = graph_service.search_graph_for_query(q, db)
    return {"results": results, "query": q, "total": len(results)}

@router.get("/export")
def export_graph(db: Session = Depends(get_db)):
    """Export the complete graph as JSON."""
    data = graph_service.get_full_graph(db)
    return data
