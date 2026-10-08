"""
Demo Data Seeder for Industrial Knowledge Graph
==============================================
Seeds the database with demo entities and relationships based on
the sample industrial equipment: Pump P-101, Motor M-201, Valve V-301,
Bearing B-401, Temperature Sensor T-501.

Run from backend directory:
    python -m app.seed_demo
Or:
    python sample_data/seed_demo.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:root@localhost:3306/industrial_kg"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def seed_demo_data():
    """Seed the database with demo industrial knowledge graph data."""
    from app.models import document as doc_module
    from app.models import knowledge as kg_module
    from app.models.document import Document, DocumentChunk
    from app.models.knowledge import Entity, Relationship, KnowledgeGraphNode, KnowledgeGraphEdge
    from app.database import Base

    Base.metadata.create_all(engine)
    db = SessionLocal()

    try:
        print("🌱 Seeding demo data...")

        # ─── Create a demo document ───────────────────────────────────────────
        demo_doc = Document(
            filename="maintenance_report.txt",
            original_filename="maintenance_report.txt",
            file_type="txt",
            file_path="uploads/maintenance_report.txt",
            file_size=5120,
            status="completed",
            extracted_text=(
                "Pump P-101 developed excessive vibration due to bearing failure. "
                "Bearing B-401 was replaced. Motor M-201 drives Pump P-101. "
                "Temperature Sensor T-501 measured 95 degrees C on bearing housing."
            ),
            entity_count=0,
            relationship_count=0,
            uploaded_at=datetime.utcnow(),
            processed_at=datetime.utcnow(),
        )
        db.add(demo_doc)
        db.flush()
        print(f"  ✔ Created demo document ID={demo_doc.id}")

        # ─── Create Entities ──────────────────────────────────────────────────
        entities_data = [
            {"entity_name": "Pump P-101",           "entity_type": "Equipment",    "description": "Horizontal centrifugal process pump, 120 m3/h, 45m head"},
            {"entity_name": "Motor M-201",           "entity_type": "Equipment",    "description": "45 kW induction motor, 1450 RPM, 415V drive for Pump P-101"},
            {"entity_name": "Valve V-301",           "entity_type": "Equipment",    "description": "Globe control valve, DN150, pneumatic actuator on discharge line"},
            {"entity_name": "Bearing B-401",         "entity_type": "Component",    "description": "SKF 6205 radial bearing on pump shaft, requires quarterly lubrication"},
            {"entity_name": "Temperature Sensor T-501", "entity_type": "Sensor",   "description": "PT100 RTD on bearing housing, alarm at 80°C, trip at 95°C"},
            {"entity_name": "Vibration Sensor VS-701",  "entity_type": "Sensor",   "description": "Accelerometer on bearing housing, alarm at 7.1 mm/s RMS"},
            {"entity_name": "Mechanical Seal",       "entity_type": "Component",    "description": "John Crane Type 1 single mechanical seal on pump shaft"},
            {"entity_name": "Flexible Coupling",     "entity_type": "Component",    "description": "Lovejoy L-100 flexible jaw coupling between motor and pump"},
            {"entity_name": "Excessive Vibration",   "entity_type": "Fault",        "description": "Vibration level 12.5 mm/s RMS, exceeding alarm threshold of 7.1 mm/s"},
            {"entity_name": "Bearing Failure",       "entity_type": "Fault",        "description": "Radial bearing B-401 worn and cracked due to lack of lubrication"},
            {"entity_name": "High Temperature",      "entity_type": "Fault",        "description": "Bearing temperature reached 95°C, above trip setpoint"},
            {"entity_name": "Coupling Misalignment", "entity_type": "Fault",        "description": "Angular misalignment of 0.3mm between motor M-201 and pump P-101"},
            {"entity_name": "Bearing Replacement",   "entity_type": "Maintenance",  "description": "Replacement of SKF 6205 bearing B-401 with new unit"},
            {"entity_name": "Coupling Realignment",  "entity_type": "Maintenance",  "description": "Realignment of flexible coupling to within 0.05mm tolerance"},
            {"entity_name": "Lubrication",           "entity_type": "Maintenance",  "description": "Lubrication of bearing housing with Mobil SHC 630 grease"},
            {"entity_name": "Mechanical Seal Replacement", "entity_type": "Maintenance", "description": "Replacement of John Crane Type 1 mechanical seal"},
            {"entity_name": "Pump Station A",        "entity_type": "Location",     "description": "Primary pump station in North Processing Facility"},
            {"entity_name": "North Processing Facility", "entity_type": "Location", "description": "Main industrial processing plant location"},
            {"entity_name": "John Smith",            "entity_type": "Person",       "description": "Senior Technician who performed maintenance on Pump P-101"},
            {"entity_name": "Pumping Process",       "entity_type": "Process",      "description": "Process fluid transfer from suction to discharge"},
            {"entity_name": "SKF 6205 Bearing",      "entity_type": "SparePart",    "description": "Replacement bearing for B-401, deep groove ball bearing"},
            {"entity_name": "LOTO Procedure",        "entity_type": "SafetyInstruction", "description": "Lockout Tagout procedure required before maintenance"},
            {"entity_name": "PPE Requirement",       "entity_type": "SafetyInstruction", "description": "Safety helmet, goggles, gloves, boots, hearing protection required"},
        ]

        entity_objects = {}
        for e_data in entities_data:
            entity = Entity(
                document_id=demo_doc.id,
                confidence=0.95,
                created_at=datetime.utcnow(),
                **e_data
            )
            db.add(entity)
            db.flush()
            entity_objects[e_data["entity_name"]] = entity

        print(f"  ✔ Created {len(entity_objects)} entities")

        # ─── Create Relationships ─────────────────────────────────────────────
        relationships_data = [
            ("Pump P-101",         "Bearing B-401",              "HAS_COMPONENT"),
            ("Pump P-101",         "Mechanical Seal",            "HAS_COMPONENT"),
            ("Pump P-101",         "Flexible Coupling",          "HAS_COMPONENT"),
            ("Pump P-101",         "Temperature Sensor T-501",   "HAS_SENSOR"),
            ("Pump P-101",         "Vibration Sensor VS-701",    "HAS_SENSOR"),
            ("Motor M-201",        "Pump P-101",                 "DRIVEN_BY"),
            ("Pump P-101",         "Excessive Vibration",        "HAS_FAULT"),
            ("Pump P-101",         "High Temperature",           "HAS_FAULT"),
            ("Pump P-101",         "Coupling Misalignment",      "HAS_FAULT"),
            ("Excessive Vibration","Bearing Failure",            "CAUSED_BY"),
            ("Excessive Vibration","Coupling Misalignment",      "CAUSED_BY"),
            ("High Temperature",   "Bearing Failure",            "CAUSED_BY"),
            ("Bearing Failure",    "Bearing Replacement",        "REQUIRES_MAINTENANCE"),
            ("Coupling Misalignment","Coupling Realignment",     "REQUIRES_MAINTENANCE"),
            ("Pump P-101",         "Lubrication",               "REQUIRES_MAINTENANCE"),
            ("Pump P-101",         "Mechanical Seal Replacement","REQUIRES_MAINTENANCE"),
            ("Bearing Replacement","SKF 6205 Bearing",          "REQUIRES_PART"),
            ("Pump P-101",         "Pump Station A",            "LOCATED_IN"),
            ("Motor M-201",        "Pump Station A",            "LOCATED_IN"),
            ("Valve V-301",        "Pump Station A",            "LOCATED_IN"),
            ("Pump Station A",     "North Processing Facility", "PART_OF"),
            ("Temperature Sensor T-501", "High Temperature",   "MEASURES"),
            ("Vibration Sensor VS-701",  "Excessive Vibration","MEASURES"),
            ("John Smith",         "Bearing Replacement",       "REPAIRED_BY"),
            ("John Smith",         "Coupling Realignment",      "REPAIRED_BY"),
            ("Pump P-101",         "Pumping Process",           "USED_IN"),
            ("LOTO Procedure",     "Pump P-101",               "RELATED_TO"),
            ("PPE Requirement",    "Pump P-101",               "RELATED_TO"),
            ("Valve V-301",        "Pump P-101",               "RELATED_TO"),
        ]

        relationship_objects = []
        for src_name, tgt_name, rel_type in relationships_data:
            src = entity_objects.get(src_name)
            tgt = entity_objects.get(tgt_name)
            if src and tgt:
                rel = Relationship(
                    source_entity_id=src.id,
                    target_entity_id=tgt.id,
                    relationship_type=rel_type,
                    confidence=0.9,
                    document_id=demo_doc.id,
                    created_at=datetime.utcnow(),
                )
                db.add(rel)
                db.flush()
                relationship_objects.append(rel)

        print(f"  ✔ Created {len(relationship_objects)} relationships")

        # ─── Update document counts ───────────────────────────────────────────
        demo_doc.entity_count = len(entity_objects)
        demo_doc.relationship_count = len(relationship_objects)

        # ─── Create Knowledge Graph Nodes ─────────────────────────────────────
        NODE_COLORS = {
            'Equipment': '#FF6B35',
            'Component': '#4ECDC4',
            'Fault':     '#FF4757',
            'Maintenance':'#5352ED',
            'Sensor':    '#FFA502',
            'Person':    '#2ED573',
            'Location':  '#A29BFE',
            'Process':   '#74B9FF',
            'SparePart': '#FDCB6E',
            'SafetyInstruction': '#E17055',
            'Measurement':'#81ECEC',
            'Unknown':   '#B2BEC3',
        }

        import json
        kg_nodes = {}
        for name, entity in entity_objects.items():
            node = KnowledgeGraphNode(
                entity_id=entity.id,
                node_label=entity.entity_name,
                node_type=entity.entity_type,
                properties=json.dumps({
                    "color": NODE_COLORS.get(entity.entity_type, '#B2BEC3'),
                    "description": entity.description or "",
                    "document_id": demo_doc.id,
                }),
                created_at=datetime.utcnow(),
            )
            db.add(node)
            db.flush()
            kg_nodes[name] = node

        print(f"  ✔ Created {len(kg_nodes)} graph nodes")

        # ─── Create Knowledge Graph Edges ─────────────────────────────────────
        edge_count = 0
        for rel in relationship_objects:
            src_entity = next((e for e in entity_objects.values() if e.id == rel.source_entity_id), None)
            tgt_entity = next((e for e in entity_objects.values() if e.id == rel.target_entity_id), None)
            if src_entity and tgt_entity:
                src_node = kg_nodes.get(src_entity.entity_name)
                tgt_node = kg_nodes.get(tgt_entity.entity_name)
                if src_node and tgt_node:
                    edge = KnowledgeGraphEdge(
                        source_node_id=src_node.id,
                        target_node_id=tgt_node.id,
                        relationship_id=rel.id,
                        edge_label=rel.relationship_type,
                        created_at=datetime.utcnow(),
                    )
                    db.add(edge)
                    edge_count += 1

        db.commit()
        print(f"  ✔ Created {edge_count} graph edges")

        print("\n✅ Demo data seeded successfully!")
        print(f"   • 1 document")
        print(f"   • {len(entity_objects)} entities")
        print(f"   • {len(relationship_objects)} relationships")
        print(f"   • {len(kg_nodes)} graph nodes")
        print(f"   • {edge_count} graph edges")
        print("\n🚀 You can now open the app and explore the pre-loaded knowledge graph!")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error seeding data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
