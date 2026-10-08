import json
from sqlalchemy.orm import Session
from app.models.knowledge import Entity, Relationship, KnowledgeGraphNode, KnowledgeGraphEdge

NODE_COLORS = {
    'Equipment':         '#f59e0b',   # amber
    'Component':         '#14b8a6',   # teal
    'Fault':             '#ef4444',   # red
    'Maintenance':       '#a855f7',   # purple
    'Sensor':            '#eab308',   # yellow
    'Person':            '#10b981',   # emerald
    'Location':          '#6366f1',   # indigo
    'Process':           '#3b82f6',   # blue
    'SparePart':         '#f97316',   # orange
    'SafetyInstruction': '#e11d48',   # rose
    'Measurement':       '#06b6d4',   # cyan
    'Document':          '#94a3b8',   # slate
    'Unknown':           '#6b7280',   # gray
}

def get_cytoscape_data(db: Session, node_type_filter: str = "") -> dict:
    """Return nodes and edges in Cytoscape.js element format."""
    data = {"nodes": [], "edges": []}

    node_query = db.query(KnowledgeGraphNode)
    if node_type_filter:
        node_query = node_query.filter(KnowledgeGraphNode.node_type == node_type_filter)

    node_ids = set()
    for node in node_query.all():
        color = NODE_COLORS.get(node.node_type, NODE_COLORS['Unknown'])
        data["nodes"].append({
            "data": {
                "id": str(node.id),
                "label": node.node_label,
                "type": node.node_type,
                "color": color,
                "entity_id": node.entity_id
            }
        })
        node_ids.add(node.id)

    # Only include edges where both endpoints are in the filtered node set
    for edge in db.query(KnowledgeGraphEdge).all():
        if edge.source_node_id in node_ids and edge.target_node_id in node_ids:
            data["edges"].append({
                "data": {
                    "id": str(edge.id),
                    "source": str(edge.source_node_id),
                    "target": str(edge.target_node_id),
                    "label": edge.edge_label
                }
            })

    return data


def get_node_detail(entity_id: int, db: Session) -> dict:
    """Return full detail for a graph node, including connected nodes."""
    node = db.query(KnowledgeGraphNode).filter(KnowledgeGraphNode.entity_id == entity_id).first()
    if not node:
        return {}

    entity = db.query(Entity).filter(Entity.id == node.entity_id).first()
    from app.models.document import Document
    source_doc = db.query(Document).filter(Document.id == entity.document_id).first() if entity else None

    node_data = {
        "id": node.id,
        "entity_id": node.entity_id,
        "node_label": node.node_label,
        "node_type": node.node_type,
        "properties": json.loads(node.properties) if node.properties else {},
        "source_document": source_doc.original_filename if source_doc else None,
        "confidence": entity.confidence if entity else None,
    }

    connected_edges = db.query(KnowledgeGraphEdge).filter(
        (KnowledgeGraphEdge.source_node_id == node.id) |
        (KnowledgeGraphEdge.target_node_id == node.id)
    ).all()

    related_node_ids = set()
    relationships_data = []
    for edge in connected_edges:
        if edge.source_node_id != node.id:
            related_node_ids.add(edge.source_node_id)
        if edge.target_node_id != node.id:
            related_node_ids.add(edge.target_node_id)

        rel = db.query(Relationship).filter(Relationship.id == edge.relationship_id).first()
        if rel:
            src_ent = db.query(Entity).filter(Entity.id == rel.source_entity_id).first()
            tgt_ent = db.query(Entity).filter(Entity.id == rel.target_entity_id).first()
            relationships_data.append({
                "id": rel.id,
                "source": src_ent.entity_name if src_ent else "Unknown",
                "target": tgt_ent.entity_name if tgt_ent else "Unknown",
                "relationship_type": rel.relationship_type,
                "confidence": rel.confidence,
            })

    related_nodes = db.query(KnowledgeGraphNode).filter(
        KnowledgeGraphNode.id.in_(related_node_ids)
    ).all()
    connected_nodes_data = [
        {
            "id": n.id,
            "entity_id": n.entity_id,
            "node_label": n.node_label,
            "node_type": n.node_type,
            "color": NODE_COLORS.get(n.node_type, NODE_COLORS['Unknown'])
        }
        for n in related_nodes
    ]

    return {
        "node": node_data,
        "connected_relationships": relationships_data,
        "connected_nodes": connected_nodes_data
    }


def get_graph_stats(db: Session) -> dict:
    node_count = db.query(KnowledgeGraphNode).count()
    edge_count = db.query(KnowledgeGraphEdge).count()

    entity_types = {}
    for (t,) in db.query(KnowledgeGraphNode.node_type).all():
        entity_types[t] = entity_types.get(t, 0) + 1

    relationship_types = {}
    for (t,) in db.query(KnowledgeGraphEdge.edge_label).all():
        relationship_types[t] = relationship_types.get(t, 0) + 1

    return {
        "node_count": node_count,
        "edge_count": edge_count,
        "entity_types": entity_types,
        "relationship_types": relationship_types
    }
