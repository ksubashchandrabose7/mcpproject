import json
import logging
from fastapi import HTTPException
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.document import Document, DocumentChunk
from app.models.knowledge import Entity, Relationship, KnowledgeGraphNode, KnowledgeGraphEdge
from app.utils.file_utils import extract_pages, split_into_chunks, clean_text
from app.nlp.entity_extractor import extract_entities
from app.nlp.relationship_extractor import extract_relationships
from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

class DocumentService:

    def process_document(self, document_id: int, db: Session) -> dict:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        if doc.status == 'processing':
            raise HTTPException(status_code=400, detail="Document is already being processed")

        doc.status = 'processing'
        db.commit()

        try:
            # ── Step 1: Extract pages ───────────────────────────────────────
            logger.info(f"[Doc {document_id}] Extracting pages from {doc.file_path}")
            pages = extract_pages(doc.file_path, doc.file_type)
            if not pages:
                raise Exception("No text could be extracted from the document. The file may be empty or image-based.")

            full_text = "\n\n".join([f"--- Page {p['page_number']} ---\n" + p['text'] for p in pages])
            doc.extracted_text = full_text

            # ── Step 2: Build page-aware chunks ────────────────────────────
            logger.info(f"[Doc {document_id}] Splitting {len(pages)} pages into chunks")
            chunk_tuples = []  # (chunk_text, page_number)
            for page_obj in pages:
                p_num = page_obj['page_number']
                p_chunks = split_into_chunks(page_obj['text'], chunk_size=800, overlap=150)
                for c_txt in p_chunks:
                    if c_txt.strip():
                        chunk_tuples.append((c_txt, p_num))

            if not chunk_tuples:
                raise Exception("Text chunking produced no output")

            # Remove old chunks if reprocessing
            db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
            db.commit()

            # ── Step 3: Generate embeddings ───────────────────────────────
            chunks_text_only = [ct[0] for ct in chunk_tuples]
            logger.info(f"[Doc {document_id}] Generating embeddings for {len(chunks_text_only)} page chunks")
            embed_service = EmbeddingService.get_instance()
            embeddings = embed_service.encode(chunks_text_only)

            for idx, ((chunk_text, page_num), emb) in enumerate(zip(chunk_tuples, embeddings)):
                chunk_record = DocumentChunk(
                    document_id=doc.id,
                    chunk_index=idx,
                    chunk_text=chunk_text,
                    page_number=page_num,
                    embedding=json.dumps(emb) if emb else None
                )
                db.add(chunk_record)
            db.commit()

            # ── Step 4: Extract entities ──────────────────────────────────
            logger.info(f"[Doc {document_id}] Extracting entities")
            # Remove old entities if reprocessing
            db.query(Entity).filter(Entity.document_id == document_id).delete()
            db.commit()

            entities_data = extract_entities(full_text)
            logger.info(f"[Doc {document_id}] Found {len(entities_data)} entities")

            saved_entities = {}
            for edata in entities_data:
                ent = Entity(
                    document_id=doc.id,
                    entity_name=edata['entity_name'],
                    entity_type=edata['entity_type'],
                    confidence=edata['confidence']
                )
                db.add(ent)
                db.flush()
                saved_entities[ent.entity_name.lower()] = ent

                # Create KG node for entity
                existing_node = db.query(KnowledgeGraphNode).filter_by(entity_id=ent.id).first()
                if not existing_node:
                    node = KnowledgeGraphNode(
                        entity_id=ent.id,
                        node_label=ent.entity_name,
                        node_type=ent.entity_type,
                        properties=json.dumps({
                            "confidence": ent.confidence,
                            "document_id": doc.id,
                            "document_name": doc.original_filename
                        })
                    )
                    db.add(node)

            db.commit()

            # ── Step 5: Extract relationships ─────────────────────────────
            logger.info(f"[Doc {document_id}] Extracting relationships")
            rels_data = extract_relationships(full_text, entities_data)
            logger.info(f"[Doc {document_id}] Found {len(rels_data)} relationships")

            for rdata in rels_data:
                src = saved_entities.get(rdata['source_entity'].lower())
                tgt = saved_entities.get(rdata['target_entity'].lower())
                if not src or not tgt or src.id == tgt.id:
                    continue

                rel = Relationship(
                    source_entity_id=src.id,
                    target_entity_id=tgt.id,
                    relationship_type=rdata['relationship_type'],
                    confidence=rdata['confidence'],
                    document_id=doc.id
                )
                db.add(rel)
                db.flush()

                # KG edge
                src_node = db.query(KnowledgeGraphNode).filter_by(entity_id=src.id).first()
                tgt_node = db.query(KnowledgeGraphNode).filter_by(entity_id=tgt.id).first()
                if src_node and tgt_node:
                    edge = KnowledgeGraphEdge(
                        source_node_id=src_node.id,
                        target_node_id=tgt_node.id,
                        relationship_id=rel.id,
                        edge_label=rel.relationship_type
                    )
                    db.add(edge)

            # ── Step 6: Update document stats ─────────────────────────────
            doc.entity_count = len(entities_data)
            doc.relationship_count = len(rels_data)
            doc.status = 'completed'
            doc.processed_at = datetime.utcnow()
            db.commit()

            logger.info(f"[Doc {document_id}] Processing completed. Entities: {doc.entity_count}, Relationships: {doc.relationship_count}")
            return {
                "message": "Processing completed successfully",
                "document_id": document_id,
                "entity_count": doc.entity_count,
                "relationship_count": doc.relationship_count,
                "chunk_count": len(chunk_tuples)
            }

        except Exception as e:
            logger.error(f"[Doc {document_id}] Processing failed: {e}")
            doc.status = 'failed'
            doc.error_message = str(e)[:990]
            db.commit()
            raise e
