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
1. Copy .env.example to .env and update the values.
2. Start PostgreSQL with docker-compose up -d.
3. Install backend dependencies: pip install -r backend/requirements.txt
4. Install frontend dependencies: cd frontend && npm install
5. Run the backend: uvicorn backend.main:app --reload
6. Run the frontend: cd frontend && npm run dev

## What is implemented so far
- Backend health endpoint
- Initial database schema
- Sample transcript input
- Frontend app shell

## Next gate before Phase 2
Do not proceed to ingestion and indexing until the local environment is verified end to end and the initial scaffold is working without errors.
