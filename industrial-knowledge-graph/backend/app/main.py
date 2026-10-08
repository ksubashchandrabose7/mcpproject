import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.config import settings
from app.database import create_tables, engine, SessionLocal
from app import models
from app.models.user import User
from app.utils.security import hash_password
from app.routes import documents, entities, relationships, graph, search, qa, history, auth, analytics

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("industrial_kg")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Industrial Knowledge Graph API",
    description="AI-Powered Industrial Knowledge Management System — extracts entities and relationships from industrial documents and provides RAG-powered question answering.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    create_tables()
    
    # Seed demo user if it doesn't exist
    db = SessionLocal()
    try:
        demo_email = "admin@industrialkg.com"
        if not db.query(User).filter(User.email == demo_email).first():
            demo_user = User(
                name="Demo Admin",
                email=demo_email,
                password_hash=hash_password("admin123"),
                role="admin"
            )
            db.add(demo_user)
            db.commit()
            logger.info(f"Created demo user: {demo_email}")
    finally:
        db.close()

    logger.info("Industrial Knowledge Graph API started successfully.")
    logger.info(f"Upload directory: {settings.UPLOAD_DIR}")
    logger.info(f"Database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(auth.router,          prefix="/api", tags=["Authentication"])
app.include_router(documents.router,     prefix="/api", tags=["Documents"])
app.include_router(entities.router,      prefix="/api", tags=["Entities"])
app.include_router(relationships.router, prefix="/api", tags=["Relationships"])
app.include_router(graph.router,         prefix="/api", tags=["Graph"])
app.include_router(search.router,        prefix="/api", tags=["Search"])
app.include_router(qa.router,            prefix="/api", tags=["QA"])
app.include_router(history.router,       prefix="/api", tags=["History & Stats"])
app.include_router(analytics.router,     prefix="/api", tags=["Industrial Analytics"])


# ── Root ──────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Industrial Knowledge Graph API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health", tags=["Root"])
def health():
    return {"status": "healthy", "service": "industrial-kg-api"}
