from sqlalchemy.orm import Session
from app.graph.graph_builder import get_cytoscape_data, get_node_detail, get_graph_stats
from app.models.knowledge import KnowledgeGraphNode

class GraphService:

    def get_full_graph(self, db: Session, node_type_filter: str = "") -> dict:
        return get_cytoscape_data(db, node_type_filter=node_type_filter)

    def get_node_detail(self, entity_id: int, db: Session) -> dict:
        return get_node_detail(entity_id, db)

    def get_stats(self, db: Session) -> dict:
        return get_graph_stats(db)

    def search_graph_for_query(self, query: str, db: Session) -> list:
        if not query or not query.strip():
            return []
        words = query.lower().split()
        results = []
        nodes = db.query(KnowledgeGraphNode).all()
        for node in nodes:
            if any(w in node.node_label.lower() for w in words):
                results.append({
                    "id": node.id,
                    "entity_id": node.entity_id,
                    "label": node.node_label,
                    "type": node.node_type
                })
        return results
