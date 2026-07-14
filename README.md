# Sage Academy RAG Tool

A lightweight prototype for helping students ask questions about course content and receive grounded answers with source references.

## Current Phase Status
- Phase 0: Complete
- Phase 1: Started and scaffolded

## Initial implementation choices
- Backend: FastAPI
- Frontend: Next.js + React + TypeScript
- Database: PostgreSQL with a simple schema for courses, videos, chunks, and question logs
- Local config: environment variables via .env and docker-compose for Postgres

## Project structure
- backend/: FastAPI app entry point and Python dependencies
- frontend/: Next.js app shell
- db/: SQL schema for initial entities
- data/sample_data/: starter transcript content
- ai/roadmaps/: planning and milestone documents

## Quick start

### Prerequisites
- Python 3.11 or 3.12
- Node.js 18+
- Docker Desktop (for PostgreSQL)

### Steps
1. Copy `.env.example` to `.env` and fill in your values.
2. Start PostgreSQL (the schema is applied automatically on first run):
   ```
   docker-compose up -d
   ```
3. Create and activate a Python virtual environment:
   ```
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # macOS / Linux
   source .venv/bin/activate
   ```
4. Install backend dependencies:
   ```
   pip install -r backend/requirements.txt
   ```
5. Install frontend dependencies:
   ```
   cd frontend && npm install
   ```
6. Run the backend:
   ```
   uvicorn backend.main:app --reload
   ```
7. Run the frontend (in a separate terminal):
   ```
   cd frontend && npm run dev
   ```
8. Verify the backend health check: open http://127.0.0.1:8000/health and confirm you see `{"status":"ok",...}`.
9. Verify the frontend: open http://localhost:3000 and confirm the page loads.

## What is implemented so far
- Backend health endpoint
- Initial database schema
- Sample transcript input
- Frontend app shell

## Next gate before Phase 2
Do not proceed to ingestion and indexing until the local environment is verified end to end and the initial scaffold is working without errors.
