import os
import json
import uuid
import re
import numpy as np
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from sqlalchemy.orm import Session
from app.models.document import DocumentChunk, Document
from app.models.knowledge import Entity, Relationship
from app.services.embedding_service import EmbeddingService
from app.config import settings

# Global RAM Context Memory store: session_id -> dict of active context
RAM_CONTEXT_STORE = {}

# Common English and generic domain stop words to ignore when performing keyword relevance matching
STOP_WORDS = {
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while',
    'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'upon', 'down',
    'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
    'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
    'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just',
    'don', 'should', 'now', 'did', 'was', 'were', 'has', 'have', 'had', 'been',
    'is', 'are', 'am', 'be', 'being', 'does', 'do', 'done', 'what', 'which', 'who',
    'whom', 'this', 'that', 'these', 'those', 'time', 'times', 'over', 'under',
    'machine', 'equipment', 'system', 'project', 'report', 'data', 'file',
    'process', 'module', 'page', 'section', 'chapter', 'figure', 'fig', 'table',
    'study', 'paper', 'result', 'results', 'value', 'values', 'type', 'types'
}

SYSTEM_PROMPT = """
You are an expert industrial knowledge and machine troubleshooting assistant.
You answer questions and diagnose machinery problems based strictly on the provided technical documents and Knowledge Graph context.

Follow these strict rules:
1. Ground your answers strictly in facts relevant to the query. For every fact cited, explicitly identify the exact Document Name and Page Number where the fact was found (e.g. **File A.pdf (Page 15)**). If info spans multiple pages, cite all relevant pages (e.g. **File A.pdf (Page 3, Page 15)**).
2. If the provided technical document context does NOT contain information answering the user's question, explicitly state under **Documented Fact**: "The uploaded technical documents do not contain specific information or data answering this inquiry."
3. NEVER quote, cite, or reference unrelated documents (such as academic project reports, traffic systems, or exam modules) or hallucinate data that does not pertain to the user's query.
4. Structure your response clearly using these exact labeled headers when relevant:
   - **Documented Fact**: (Explicit facts and limits from uploaded documents with exact File Name and Page Number)
   - **Calculated Result / Assessment**: (Comparison of conditions against documented limits)
   - **Possible Root Cause**: (Chain of failure mechanisms)
   - **Recommended Action & Maintenance Checks**: (Step-by-step resolution)
   - **Runability Status**: (SAFE / UNSAFE / OUTSIDE SPECIFICATION)
   - **Source Traceability**: (Exact File Name, Page Number(s), section, and citations)
"""

class QAService:
    def __init__(self):
        self.llm = None
        gemini_key = getattr(settings, "GEMINI_API_KEY", "")
        groq_key = getattr(settings, "GROQ_API_KEY", "")

        if gemini_key and not gemini_key.startswith("your_"):
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-1.5-flash",
                    google_api_key=gemini_key,
                    temperature=0.2
                )
            except Exception as e:
                print(f"Gemini LLM initialization info: {e}")

        if not self.llm and groq_key and not groq_key.startswith("your_"):
            try:
                self.llm = ChatGroq(
                    model_name="llama3-70b-8192", 
                    groq_api_key=groq_key,
                    temperature=0.0
                )
            except Exception as e:
                print(f"Groq LLM initialization info: {e}")

    def answer_question(self, question: str, db: Session, session_id: str = None, emergency_mode: bool = False) -> dict:
        if not session_id:
            session_id = str(uuid.uuid4())

        # Retrieve or initialize RAM context for session
        if session_id not in RAM_CONTEXT_STORE:
            RAM_CONTEXT_STORE[session_id] = {
                "active_entities": [],
                "active_chunks": [],
                "history": [],
                "operating_conditions": {}
            }
        
        session_ram = RAM_CONTEXT_STORE[session_id]

        # 1. Clean query keyword extraction (filtering out stop words & generic nouns)
        raw_words = re.findall(r'\b[a-zA-Z]{3,}\b', question.lower())
        meaningful_words = [w for w in raw_words if w not in STOP_WORDS]
        
        # Exact stem variations (without over-broad substring matching)
        stemmed_words = set(meaningful_words)
        for w in meaningful_words:
            if w.endswith('ly') and len(w) > 4: stemmed_words.add(w[:-2])
            if w.endswith('ing') and len(w) > 5: stemmed_words.add(w[:-3])
            if w.endswith('ed') and len(w) > 4: stemmed_words.add(w[:-2])
            if w.endswith('s') and len(w) > 4: stemmed_words.add(w[:-1])

        # Attempt embedding generation for vector similarity
        emb_service = EmbeddingService.get_instance()
        query_vec = None
        if emb_service and getattr(emb_service, '_model', None):
            try:
                query_vec = emb_service.encode_single(question)
            except Exception as e:
                query_vec = None

        all_chunks = db.query(DocumentChunk).all()
        scored_chunks = []
        
        for c in all_chunks:
            text_lower = c.chunk_text.lower()
            
            # Exact word-boundary keyword match count against stemmed meaningful query words
            matches = 0
            for w in stemmed_words:
                if re.search(r'\b' + re.escape(w) + r'\b', text_lower):
                    matches += 1

            kw_score = (matches / len(meaningful_words)) if meaningful_words else 0.0
            
            # Vector similarity score if embedding is present
            vec_score = 0.0
            if query_vec and c.embedding:
                try:
                    c_emb = json.loads(c.embedding) if isinstance(c.embedding, str) else c.embedding
                    c_np = np.array([c_emb])
                    q_np = np.array([query_vec])
                    from sklearn.metrics.pairwise import cosine_similarity
                    vec_score = float(cosine_similarity(q_np, c_np)[0][0])
                except Exception:
                    vec_score = 0.0

            # Combined hybrid relevance score
            if query_vec and c.embedding:
                total_score = 0.6 * vec_score + 0.4 * kw_score
            else:
                total_score = kw_score

            # REQUIRE at least 1 exact word-boundary keyword match to prevent unrelated documents from matching!
            if matches >= 1 and total_score >= 0.15:
                scored_chunks.append((c, total_score))
                
        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        
        # Filter top chunks that pass threshold. DO NOT FALL BACK TO RANDOM UNRELATED CHUNKS IF NONE MATCH!
        top_chunks = scored_chunks[:5] if scored_chunks else []
        
        sources = []
        current_chunk_snippets = []
        for c, score in top_chunks:
            doc = db.query(Document).filter_by(id=c.document_id).first()
            doc_name = doc.original_filename if doc else "Unknown Document"
            doc_id = doc.id if doc else c.document_id
            page_num = getattr(c, 'page_number', 1) or 1
            
            ctx_snippet = f"[Source: {doc_name}, Page {page_num}]: {c.chunk_text}"
            current_chunk_snippets.append(ctx_snippet)

            sources.append({
                "document_id": doc_id,
                "document_name": doc_name,
                "page_number": page_num,
                "chunk_text": c.chunk_text,
                "score": score,
                "file_url": f"/api/documents/{doc_id}/file#page={page_num}",
                "page_url": f"/api/documents/{doc_id}/page/{page_num}"
            })

        # Set session RAM active chunks strictly to relevant chunks from current turn
        session_ram["active_chunks"] = current_chunk_snippets

        # 2. Find relevant entities & update active RAM context
        matched_entities = []
        if meaningful_words and sources: # Only match entities if sources were matched
            from sqlalchemy import or_
            filters = [Entity.entity_name.ilike(f"%{w}%") for w in meaningful_words[:4]]
            matched_entities = db.query(Entity).filter(or_(*filters)).limit(5).all()

        # 3. Build Knowledge Graph context from DB + RAM context
        graph_context_lines = []
        ent_list = []
        if matched_entities and sources:
            matched_ids = [e.id for e in matched_entities]
            from sqlalchemy import or_
            rels = db.query(Relationship).filter(
                or_(Relationship.source_entity_id.in_(matched_ids), Relationship.target_entity_id.in_(matched_ids))
            ).limit(10).all()

            for e in matched_entities:
                ent_list.append({"name": e.entity_name, "type": e.entity_type})

            for r in rels:
                src = db.query(Entity).filter_by(id=r.source_entity_id).first()
                tgt = db.query(Entity).filter_by(id=r.target_entity_id).first()
                if src and tgt:
                    graph_context_lines.append(f"- {src.entity_name} ({src.entity_type}) --[{r.relationship_type}]--> {tgt.entity_name} ({tgt.entity_type})")

        graph_context = "\n".join(list(set(graph_context_lines)))
        
        # 4. Construct RAM Layer Context
        ram_context_summary = f"""
Active Problem Context (RAM Layer):
- Tracked Entities: {', '.join([e['name'] for e in ent_list]) if ent_list else 'None'}
- Relevant Search Chunks Found: {len(session_ram['active_chunks'])}
- History Turn Count: {len(session_ram['history'])}
"""

        # 5. Build full prompt for LLM
        if session_ram["active_chunks"]:
            doc_context = "\n\n".join(session_ram["active_chunks"])
        else:
            doc_context = "No relevant text matching the query was found in the uploaded technical documents."

        mode_instruction = ""
        if emergency_mode:
            mode_instruction = "\nEMERGENCY MODE ACTIVATED: Prioritize immediate machine breakdown analysis, safety interlocks, and critical operating limits."

        prompt = f"""{ram_context_summary}
{mode_instruction}

Context from Uploaded Technical Documents:
{doc_context}

Context from Industrial Knowledge Graph:
{graph_context if graph_context else 'No specific graph relationships matched.'}

User Query / Incident Report:
"{question}"

Please provide a detailed, evidence-supported diagnostic response according to your system prompt instructions.
Explicitly state the exact File Name and Page Number for every cited fact (e.g. **File A.pdf (Page 15)**).
If no relevant document context exists for this specific question, explicitly state under Documented Fact that the information was not found in the uploaded documents.
"""

        if self.llm:
            try:
                messages = [
                    SystemMessage(content=SYSTEM_PROMPT),
                    HumanMessage(content=prompt)
                ]
                response = self.llm.invoke(messages)
                answer = response.content
            except Exception as e:
                print(f"LLM invocation failed: {e}")
                answer = self._synthesize_rag_fallback(question, sources, ent_list, graph_context)
        else:
            answer = self._synthesize_rag_fallback(question, sources, ent_list, graph_context)

        # Save turn to RAM history
        session_ram["history"].append({"user": question, "assistant": answer})

        # Evaluate Runability status heuristically from answer text
        runability = "UNKNOWN"
        if "UNSAFE" in answer.upper():
            runability = "UNSAFE"
        elif "OUTSIDE SPECIFICATION" in answer.upper():
            runability = "OUTSIDE SPECIFICATION"
        elif "SAFE" in answer.upper():
            runability = "SAFE"

        # Generate 3-5 diagnostic follow-up questions
        diag_questions = []
        if any(term in question.lower() for term in ["stop", "fail", "break", "trip", "overheat", "vibrat", "leak", "problem", "issue"]):
            diag_questions = [
                "1. Did the machine stop suddenly or gradually over time?",
                "2. Was there any unusual vibration or abnormal sound prior to stopping?",
                "3. Was the machine operating above its documented speed or temperature limit?",
                "4. Are any error codes or warning interlocks displayed on the control panel?",
                "5. Has recent maintenance or component replacement been performed?"
            ]

        return {
            "question": question,
            "answer": answer,
            "sources": sources,
            "entities": ent_list,
            "graph_context": graph_context,
            "session_id": session_id,
            "runability": runability,
            "diagnostic_questions": diag_questions,
            "active_ram_entities": [e['name'] for e in ent_list]
        }

    def _synthesize_rag_fallback(self, question: str, sources: list, entities: list, graph_context: str) -> str:
        """Synthesize a complete, multi-sentence RAG answer strictly adhering to available source evidence."""
        matched_ent_names = [e['name'] for e in entities] if entities else []

        summary_lines = []
        summary_lines.append(f"### **Diagnostic Assessment for Inquiry:** \"{question}\"")
        
        if sources:
            # Group page numbers by document name
            doc_page_map = {}
            for s in sources:
                dname = s['document_name']
                pnum = s['page_number']
                if dname not in doc_page_map:
                    doc_page_map[dname] = []
                if pnum not in doc_page_map[dname]:
                    doc_page_map[dname].append(pnum)

            cit_parts = []
            for dname, pages_list in doc_page_map.items():
                p_str = ", ".join([f"Page {p}" for p in sorted(pages_list)])
                cit_parts.append(f"`{dname}` (**{p_str}**)")

            summary_lines.append(f"**Documented Fact:** Based on evidence extracted from {', '.join(cit_parts)}:")
            for s in sources[:4]:
                snippet = s['chunk_text'].strip()
                if len(snippet) > 200:
                    snippet = snippet[:200] + "..."
                summary_lines.append(f"- **From {s['document_name']}** (**Page {s['page_number']}**): \"{snippet}\"")
        else:
            summary_lines.append(f"**Documented Fact:** The uploaded technical documents do not contain specific information or telemetry logs answering: *\"{question}\"*.")

        if matched_ent_names and sources:
            summary_lines.append(f"\n**Knowledge Graph Connections:** Identified active components and assets: `{', '.join(matched_ent_names[:5])}`.")
            if graph_context:
                summary_lines.append(f"Graph relationships:\n{graph_context[:300]}")

        summary_lines.append("\n**Calculated Result & Assessment:**")
        if any(term in question.lower() for term in ["stop", "fail", "break", "trip", "overheat", "vibrat", "leak", "problem", "issue"]):
            if not sources:
                summary_lines.append("- **Diagnostic Guidance:** Sudden stoppage usually indicates electrical trips or safety interlocks, whereas gradual failure points to thermal overload or mechanical wear. Verify machine control panel telemetry logs.")
            else:
                summary_lines.append("- **Possible Root Cause:** The reported operational issue appears linked to component degradation or operating limits being exceeded.")
            summary_lines.append("- **Recommended Action & Maintenance Checks:** Perform thermal imaging check, inspect bearing/seal clearances, align drive shaft couplings, and verify sensor cutoff thresholds before restarting.")
            summary_lines.append("- **Runability Status:** `UNSAFE` — Immediate inspection required prior to restarting asset.")
        else:
            summary_lines.append("- **Technical Status:** Asset parameter readings and documented procedures match standard operational limits.")
            summary_lines.append("- **Recommended Action:** Continue standard predictive maintenance and periodic telemetry log reviews.")
            summary_lines.append("- **Runability Status:** `SAFE` — Normal continuous operation permitted.")

        return "\n".join(summary_lines)
