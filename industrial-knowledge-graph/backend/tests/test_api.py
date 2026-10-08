import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "industrial-kg-api"}

def test_register_and_login():
    # Register
    reg_response = client.post(
        "/api/auth/register",
        json={"name": "Test User", "email": "test@example.com", "password": "password123"}
    )
    assert reg_response.status_code == 201
    assert "access_token" in reg_response.json()
    assert reg_response.json()["email"] == "test@example.com"
    
    # Login
    login_response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"}
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()
    
    # Get Me
    token = login_response.json()["access_token"]
    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "test@example.com"

def test_login_invalid_credentials():
    response = client.post(
        "/api/auth/login",
        json={"email": "wrong@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    
def test_get_dashboard_stats():
    response = client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_documents" in data
    assert "total_entities" in data
    assert "graph_nodes" in data
    assert "recent_documents" in data
