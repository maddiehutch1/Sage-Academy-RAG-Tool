# Phase 3 Plan: Retrieval and Answer Generation Core

Date: 2026-07-10

## Engineering Philosophy
**Avoid over-engineering, cruft, and legacy-compatibility features.**

This is a clean-start project with no existing users, no existing data, and no migration debt. Every layer of abstraction must earn its place. If a simpler approach works, use it. Delete code freely. Build for what's needed now, not for hypothetical future requirements.

## Goal
Create the core intelligence layer that accepts a student question, retrieves relevant course chunks, and returns a grounded answer with citation metadata.

## Checklist
- [x] Build a question embedding path using the same embedding model as the index
- [x] Implement similarity search against the indexed chunks
- [x] Select the number of chunks to retrieve for each question
- [x] Create a prompt template that includes the retrieved context and the student question
- [x] Connect the app to an LLM API for answer generation
- [x] Return answer content plus the relevant video/timestamp metadata
- [x] Validate that answers are grounded in the retrieved chunks

## What Should Happen in This Phase
- Use the indexed chunks as the retrieval source of truth.
- Keep the retrieval flow simple at first: embed the question, find the nearest chunks, and pass them to the model.
- Use a small, concise prompt so results remain fast and explainable.
- Make sure the output includes enough metadata to support source attribution.
- Treat this phase as the first working version of the product’s core experience.

## Recommended Tools and Packages
- Python
- FastAPI
- OpenAI Chat Completions API
- PostgreSQL + pgvector
- Python packages:
  - openai
  - fastapi
  - uvicorn
  - pydantic
  - psycopg2 or SQLAlchemy
  - python-dotenv
  - pytest

## Deliverables
- A basic question-answer endpoint or service
- A retrieval flow that returns relevant chunks for a user question
- A grounded answer response enriched with course/video/timestamp references
