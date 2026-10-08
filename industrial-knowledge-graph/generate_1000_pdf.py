import os
import sys
import json
import random
from datetime import datetime, timedelta

# Ensure backend directory is in path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

# ── 1. GENERATE 1,000 INDUSTRIAL DATA RECORDS ─────────────────────────────────

print("[1/3] Generating 1,000 temporary industrial data records for Industrial Knowledge Graph...")

CATEGORIES = ["Equipment", "Sensor", "Component", "Fault", "Maintenance", "Location", "Person", "Process", "SparePart", "SafetyInstruction"]
EQUIP_TYPES = ["Pump", "Motor", "Valve", "Compressor", "Turbine", "Heat Exchanger", "Conveyor", "Generator", "Transformer", "Boiler"]
LOCATIONS = ["Plant Alpha - Section 1", "Plant Alpha - Section 2", "Plant Beta - Processing Unit", "Facility West - Powerhouse", "Facility East - Storage", "Refinery Substation A", "Refinery Substation B"]
TECHNICIANS = ["John Smith", "Alice Johnson", "Robert Chen", "Elena Rostova", "Marcus Vance", "David Kalu", "Sarah Jenkins", "Vikram Patel"]
STATUSES = ["OPERATIONAL", "WARNING", "CRITICAL", "UNDER_REPAIR", "SCHEDULED_INSPECTION"]

FAULT_TYPES = [
    "Excessive Vibration", "High Temperature Overheating", "Pressure Drop Anomaly", 
    "Bearing Degradation", "Coupling Misalignment", "Mechanical Seal Leakage",
    "Electrical Phase Imbalance", "Lubrication Breakdown", "Impeller Cavitation", "Filter Clogging"
]

MAINTENANCE_ACTIONS = [
    "Replaced SKF radial ball bearing and refilled Mobil synthetic grease",
    "Performed laser alignment on motor-pump shaft coupling within 0.02mm limit",
    "Flushed hydraulic lines, changed oil filter element and reset pressure sensor",
    "Calibrated PT100 RTD sensor and verified thermal cutoff trip points",
    "Tightened terminal electrical connections and checked coil insulation resistance",
    "Replaced mechanical seal ring and inspected casing wear ring clearance",
    "Cleaned suction strainer screen and purged entrapped air pockets",
    "Updated control system PLC threshold parameters and logged baseline vibration"
]

# Generate 1000 items
random.seed(42) # Reproducible seed
start_date = datetime(2026, 1, 1)

records = []
entities_list = []
relationships_list = []

for i in range(1, 1001):
    record_id = f"REC-{i:04d}"
    equip_type = random.choice(EQUIP_TYPES)
    equip_id = f"{equip_type[:3].upper()}-{100 + (i % 300)}"
    cat = CATEGORIES[(i - 1) % len(CATEGORIES)]
    location = random.choice(LOCATIONS)
    tech = random.choice(TECHNICIANS)
    status = random.choice(STATUSES)
    rec_date = (start_date + timedelta(hours=i * 5)).strftime("%Y-%m-%d %H:%M")
    
    temp = round(random.uniform(45.0, 98.5), 1)
    vib = round(random.uniform(0.5, 14.2), 2)
    press = round(random.uniform(2.0, 48.0), 1)
    
    fault = random.choice(FAULT_TYPES) if status in ["WARNING", "CRITICAL", "UNDER_REPAIR"] else "None Detected"
    action = random.choice(MAINTENANCE_ACTIONS) if status in ["UNDER_REPAIR", "SCHEDULED_INSPECTION"] else "Normal Continuous Monitoring"
    
    desc = f"{equip_type} {equip_id} at {location}. Temp: {temp}°C, Vib: {vib} mm/s, Press: {press} bar. Status: {status}. Issue: {fault}. Action: {action}. Inspector: {tech}."
    
    records.append({
        "id": record_id,
        "equip_id": equip_id,
        "category": cat,
        "status": status,
        "telemetry": f"T:{temp}°C | V:{vib}mm/s",
        "fault": fault,
        "location": location,
        "date": rec_date,
        "tech": tech,
        "description": desc
    })
    
    entities_list.append({
        "entity_name": f"{equip_id} Record #{i}",
        "entity_type": cat,
        "description": desc
    })

print("[SUCCESS] Generated 1,000 industrial data records successfully!")

# ── 2. BUILD PDF DOCUMENT WITH REPORTLAB ──────────────────────────────────────

pdf_filename = "industrial_telemetry_1000_records.pdf"
root_pdf_path = os.path.join(os.path.dirname(__file__), pdf_filename)
uploads_pdf_path = os.path.join(os.path.dirname(__file__), 'backend', 'uploads', pdf_filename)

os.makedirs(os.path.dirname(uploads_pdf_path), exist_ok=True)

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (on page > 1)
        if self._pageNumber > 1:
            self.drawString(36, 810, "Industrial Knowledge Graph — 1,000 Project Telemetry & Maintenance Records")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(36, 804, 576, 804)
        
        # Footer
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 20, footer_text)
        self.drawString(36, 20, "CONFIDENTIAL — Industrial Knowledge Graph Temporary Dataset Export")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(36, 32, 576, 32)
        
        self.restoreState()

doc = SimpleDocTemplate(
    root_pdf_path,
    pagesize=A4,
    leftMargin=36,
    rightMargin=36,
    topMargin=54,
    bottomMargin=54
)

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    'DocTitle',
    parent=styles['Heading1'],
    fontName='Helvetica-Bold',
    fontSize=20,
    leading=24,
    textColor=colors.HexColor('#0F172A'),
    spaceAfter=6
)

subtitle_style = ParagraphStyle(
    'DocSubtitle',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=10,
    leading=14,
    textColor=colors.HexColor('#475569'),
    spaceAfter=15
)

table_header_style = ParagraphStyle(
    'TableHeader',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=8,
    leading=10,
    textColor=colors.white,
    alignment=1 # Center
)

table_cell_style = ParagraphStyle(
    'TableCell',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=7.5,
    leading=9,
    textColor=colors.HexColor('#1E293B')
)

table_cell_bold = ParagraphStyle(
    'TableCellBold',
    parent=table_cell_style,
    fontName='Helvetica-Bold'
)

status_styles = {
    "OPERATIONAL": ParagraphStyle('Op', parent=table_cell_bold, textColor=colors.HexColor('#15803D')),
    "WARNING": ParagraphStyle('Warn', parent=table_cell_bold, textColor=colors.HexColor('#B45309')),
    "CRITICAL": ParagraphStyle('Crit', parent=table_cell_bold, textColor=colors.HexColor('#B91C1C')),
    "UNDER_REPAIR": ParagraphStyle('Repair', parent=table_cell_bold, textColor=colors.HexColor('#1D4ED8')),
    "SCHEDULED_INSPECTION": ParagraphStyle('Insp', parent=table_cell_bold, textColor=colors.HexColor('#6D28D9')),
}

elements = []

# Title & Summary Banner
elements.append(Paragraph("Industrial Knowledge Graph Dataset", title_style))
elements.append(Paragraph("<b>Export File:</b> 1,000 Temporary Industrial Maintenance & Equipment Telemetry Records | <b>Generated:</b> " + datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"), subtitle_style))

# Overview Box
summary_data = [
    [
        Paragraph("<b>Total Records:</b> 1,000", table_cell_style),
        Paragraph("<b>Equipment Assets:</b> 300 Unique Units", table_cell_style),
        Paragraph("<b>Plant Locations:</b> 7 Facilities", table_cell_style),
        Paragraph("<b>Data Status:</b> Verified Active", table_cell_style)
    ]
]
summary_table = Table(summary_data, colWidths=[130, 140, 130, 120])
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
    ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
    ('PADDING', (0,0), (-1,-1), 6),
    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
]))
elements.append(summary_table)
elements.append(Spacer(1, 15))

# Main 1000 Records Table
headers = [
    Paragraph("ID", table_header_style),
    Paragraph("Asset ID", table_header_style),
    Paragraph("Category", table_header_style),
    Paragraph("Status", table_header_style),
    Paragraph("Telemetry", table_header_style),
    Paragraph("Location / Inspector", table_header_style),
    Paragraph("Details & Maintenance Log", table_header_style)
]

table_data = [headers]

for rec in records:
    st_style = status_styles.get(rec["status"], table_cell_bold)
    row = [
        Paragraph(rec["id"], table_cell_bold),
        Paragraph(rec["equip_id"], table_cell_style),
        Paragraph(rec["category"], table_cell_style),
        Paragraph(rec["status"], st_style),
        Paragraph(rec["telemetry"], table_cell_style),
        Paragraph(f"<b>{rec['location'].split('-')[0].strip()}</b><br/>{rec['tech']}", table_cell_style),
        Paragraph(f"<b>{rec['fault']}</b> — {rec['description']}", table_cell_style)
    ]
    table_data.append(row)

# Widths: Total available width ~ 524 pt
col_widths = [45, 52, 55, 65, 65, 82, 160]

records_table = Table(table_data, colWidths=col_widths, repeatRows=1)

table_style = [
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('ALIGN', (0,0), (-1,0), 'CENTER'),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ('PADDING', (0,0), (-1,-1), 4),
    ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#E2E8F0')),
]

# Alternating row colors
for i in range(1, len(table_data)):
    if i % 2 == 0:
        table_style.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor('#F8FAFC')))

records_table.setStyle(TableStyle(table_style))
elements.append(records_table)

print("Compiling PDF document with ReportLab...")
doc.build(elements, canvasmaker=NumberedCanvas)

# Copy to backend uploads folder as well
import shutil
shutil.copyfile(root_pdf_path, uploads_pdf_path)

file_size_mb = round(os.path.getsize(root_pdf_path) / (1024 * 1024), 2)
print(f"[SUCCESS] PDF generated and saved to:\n  - {root_pdf_path}\n  - {uploads_pdf_path}\n  (Size: {file_size_mb} MB)")


# ── 3. SEED / UPLOAD INTO PROJECT DATABASE ────────────────────────────────────

print("\n[INFO] Ingesting and seeding the 1,000 data items into project database (industrial_kg.db)...")

from app.database import engine, SessionLocal, Base
from app.models.document import Document, DocumentChunk
from app.models.knowledge import Entity, Relationship, KnowledgeGraphNode, KnowledgeGraphEdge

Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    # 1. Create Document Record
    doc_entry = Document(
        filename=pdf_filename,
        original_filename=pdf_filename,
        file_type=".pdf",
        file_path=uploads_pdf_path,
        file_size=os.path.getsize(uploads_pdf_path),
        extracted_text=f"Industrial Knowledge Graph 1,000 Telemetry & Maintenance Records Dataset. Total Records: 1000. Features equipment logs, sensor metrics, fault diagnostics, and maintenance interventions for plant assets.",
        status="completed",
        entity_count=len(entities_list),
        relationship_count=len(records),
        uploaded_at=datetime.utcnow(),
        processed_at=datetime.utcnow()
    )
    db.add(doc_entry)
    db.flush()
    print(f"  - Registered document record ID={doc_entry.id} in database.")

    # 2. Add Document Chunks (Group by 50 records per chunk = 20 chunks)
    chunks_to_add = []
    chunk_size = 50
    for idx in range(0, len(records), chunk_size):
        chunk_recs = records[idx:idx + chunk_size]
        chunk_text = f"Industrial Data Chunk {idx//chunk_size + 1}:\n" + "\n".join([r['description'] for r in chunk_recs])
        chunk_obj = DocumentChunk(
            document_id=doc_entry.id,
            chunk_index=idx // chunk_size,
            chunk_text=chunk_text,
            created_at=datetime.utcnow()
        )
        db.add(chunk_obj)
    db.flush()
    print(f"  - Created {len(records)//chunk_size} document vector chunks.")

    # 3. Add Entities, Graph Nodes, and Relationships
    NODE_COLORS = {
        'Equipment': '#FF6B35', 'Component': '#4ECDC4', 'Fault': '#FF4757',
        'Maintenance': '#5352ED', 'Sensor': '#FFA502', 'Person': '#2ED573',
        'Location': '#A29BFE', 'Process': '#74B9FF', 'SparePart': '#FDCB6E',
        'SafetyInstruction': '#E17055'
    }

    db_entities = []
    db_nodes = []

    for item in entities_list:
        ent = Entity(
            document_id=doc_entry.id,
            entity_name=item["entity_name"],
            entity_type=item["entity_type"],
            description=item["description"],
            confidence=0.98,
            created_at=datetime.utcnow()
        )
        db.add(ent)
        db.flush()

        node = KnowledgeGraphNode(
            entity_id=ent.id,
            node_label=ent.entity_name,
            node_type=ent.entity_type,
            properties=json.dumps({
                "color": NODE_COLORS.get(ent.entity_type, '#B2BEC3'),
                "description": ent.description,
                "document_id": doc_entry.id
            }),
            created_at=datetime.utcnow()
        )
        db.add(node)
        db.flush()

        db_entities.append(ent)
        db_nodes.append(node)

    print(f"  - Inserted {len(db_entities)} entity records and graph nodes.")

    # Create key relationships between consecutive assets / systems
    rel_count = 0
    for i in range(len(db_entities) - 1):
        rel_type = "MONITORED_BY" if i % 3 == 0 else ("HAS_FAULT" if i % 3 == 1 else "REQUIRES_MAINTENANCE")
        rel = Relationship(
            source_entity_id=db_entities[i].id,
            target_entity_id=db_entities[i+1].id,
            relationship_type=rel_type,
            confidence=0.95,
            is_verified=1,
            document_id=doc_entry.id,
            created_at=datetime.utcnow()
        )
        db.add(rel)
        db.flush()

        edge = KnowledgeGraphEdge(
            source_node_id=db_nodes[i].id,
            target_node_id=db_nodes[i+1].id,
            relationship_id=rel.id,
            edge_label=rel_type,
            created_at=datetime.utcnow()
        )
        db.add(edge)
        rel_count += 1

    db.commit()
    print(f"  - Created {rel_count} graph edges in knowledge graph.")
    print("\n[SUCCESS] 1,000 temporary project records generated, saved to PDF, and uploaded into project database!")

except Exception as e:
    db.rollback()
    print(f"[ERROR] Error during DB seeding: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
