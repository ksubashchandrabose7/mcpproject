# AI-Based Industrial Knowledge Graph

A complete, production-ready, software-only web application that converts unstructured industrial documents into a searchable Knowledge Graph and provides AI-powered question answering with source references.

## 🚀 Features

- **Document Processing Pipeline**: Extract text from PDF, DOCX, TXT, CSV, and XLSX using PyMuPDF, python-docx, and pandas.
- **NLP Entity & Relationship Extraction**: Automatically identifies industrial entities (Machines, Sensors, Failures, etc.) and their connections.
- **Semantic Search**: Powered by Sentence Transformers (`all-MiniLM-L6-v2`) for vectorizing document chunks.
- **Retrieval-Augmented Generation (RAG)**: Ask questions about your industrial data and get AI answers grounded in your documents, powered by Google Gemini (or OpenAI).
- **Interactive Knowledge Graph**: Visualize entities and relationships using Cytoscape.js.
- **Authentication**: JWT-based secure authentication with Admin and User roles.
- **Dockerized Deployment**: Fully containerized with Docker Compose for easy deployment.

---

## 🏗️ Architecture

```
                 USER
                  |
                  v
           React Frontend (Vite)
                  |
                  v
          FastAPI Backend
          /      |       \
         /       |        \
        v        v         v
     MySQL    RAG Engine  Neo4j (Data Model via SQLAlchemy)
                |
          +-----+-----+
          |           |
          v           v
    Embeddings       LLM (Gemini)
          |
          v
   Document Chunks (Vector Store)
```

---

## 🛠️ Technology Stack

- **Frontend**: React.js 18, Vite, Tailwind CSS, Lucide Icons, Cytoscape.js, Recharts, React Router
- **Backend**: Python 3.11, FastAPI, SQLAlchemy, Uvicorn, Pydantic, Passlib, PyJWT
- **Database**: MySQL 8.0 (Relational Data & Graph Persistence)
- **AI / NLP**: LangChain, SentenceTransformers, Google Gemini API
- **Deployment**: Docker, Docker Compose

---

## ⚙️ Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development without Docker)
- Python 3.11+ (for local development without Docker)
- A Gemini API Key (or OpenAI API Key)

---

## 📦 Installation & Setup

### Option 1: Docker (Recommended)

1. **Clone the repository**
2. **Configure Environment Variables**
   - Copy `backend/.env.example` to `backend/.env`
   - Fill in your `GEMINI_API_KEY` and update the `SECRET_KEY`
3. **Start the services**
   ```bash
   docker compose up --build
   ```
4. **Access the application**
   - Frontend: `http://localhost:5173` (or `http://localhost`)
   - API Docs: `http://localhost:8000/docs`

### Option 2: Local Development

**1. Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Update with your DB credentials and API keys
uvicorn app.main:app --reload
```

**2. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testing

To run the backend test suite, use pytest:

```bash
cd backend
python -m pytest tests/ -v
```

---

## 📖 Sample Usage

**1. Login**
- Register a new account or use the demo functionality on the login screen.

**2. Upload Documents**
- Upload maintenance reports, machine manuals, or sensor logs (PDF, DOCX, TXT, CSV, XLSX).
- The background worker will extract text, chunk it, generate embeddings, and extract entities/relationships.

**3. Explore Knowledge Graph**
- Navigate to the "Knowledge Graph" page to see how your extracted industrial entities connect to one another.

**4. AI Assistant**
- Ask questions like:
  - *"Why did CNC Machine 01 fail?"*
  - *"Which machines use temperature sensors?"*
  - *"What is the maintenance procedure for overheating?"*

---

## 📝 API Documentation

Once the backend is running, the interactive Swagger API documentation is available at:
`http://localhost:8000/docs`

A Postman collection is also provided in the root directory: `postman_collection.json`.

---

## 🛑 Troubleshooting

- **Database Connection Error**: Ensure MySQL is running and the credentials in `.env` match your local setup. If using Docker, wait for the MySQL container to become healthy.
- **RAG/AI Fails**: Verify that your `GEMINI_API_KEY` is valid and has sufficient quota.
- **Uploads Fail**: Check that `MAX_FILE_SIZE_MB` in `.env` is sufficiently large and that the `uploads/` directory has write permissions.
