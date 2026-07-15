# Changelog

This file is a concise record of project changes as the Sage Academy RAG Tool evolves. Each entry should remain short and point back to the source planning document that informed the change.

## 2026-07-15

- Completed Phase 3 (Retrieval and Answer Generation). Validated via Swagger UI — grounded answers with source citations confirmed working. Source: [ai/roadmaps/complete/2026-07-10-phase-03-retrieval-answer-plan.md](../ai/roadmaps/complete/2026-07-10-phase-03-retrieval-answer-plan.md)
- Completed Phase 4 (Demo User Experience). UI reviewed and confirmed working end-to-end. Source: [ai/roadmaps/complete/2026-07-10-phase-04-demo-ui-plan.md](../ai/roadmaps/complete/2026-07-10-phase-04-demo-ui-plan.md)
- Started Phase 5 (Validation and Refinement). Source: [ai/roadmaps/2026-07-10-phase-05-validation-plan.md](../ai/roadmaps/2026-07-10-phase-05-validation-plan.md)
- Created `tests/eval_questions.json`: 8 representative student questions with expected keywords and topic labels.
- Created `scripts/run_eval.py`: end-to-end eval runner that retrieves chunks, generates answers, checks keyword coverage, flags weak retrieval (distance > 0.55), and saves a timestamped Markdown report to `tests/eval_results/`.
- Added Tailwind CSS (v3), PostCSS, and Autoprefixer to the frontend. Created `globals.css` and `tailwind.config.ts`.
- Replaced placeholder `page.tsx` with a full demo UI: question textarea, submit button with loading spinner, answer card, and per-source citation cards showing course, video, timestamp range (MM:SS), and excerpt.
- Updated `layout.tsx` to import global styles.
- Created `backend/db.py`: thin connection helper wrapping psycopg2 + DATABASE_URL.
- Created `backend/retrieval.py`: embeds a user question with text-embedding-3-small and returns top-5 nearest transcript chunks from pgvector with full metadata.
- Created `backend/answer.py`: builds a grounded prompt from retrieved chunks and calls gpt-4o-mini (temperature=0.2) to produce a student-facing answer with source citations.
- Updated `backend/main.py`: added `POST /ask` endpoint accepting a question and returning an `AskResponse` (answer + sources list). Questions and answers are logged to `question_logs`.

## 2026-07-14

- Completed Phase 1 (Foundation). Verified local environment end-to-end: PostgreSQL via Docker, FastAPI health endpoint, Next.js frontend shell. Source: [ai/roadmaps/complete/2026-07-10-phase-01-foundation-plan.md](../ai/roadmaps/complete/2026-07-10-phase-01-foundation-plan.md)
- Added `.gitignore` to exclude `.env`, venv, `node_modules/`, `__pycache__/`, and `.next/`.
- Switched Docker Compose to `pgvector/pgvector:pg16` image and updated schema to enable the `vector` extension and store embeddings as `vector(1536)`.
- Added `openai` and `tiktoken` to backend dependencies.
- Created `scripts/` and `tests/` directories per the Phase 1 repo layout plan.
- Started Phase 2 (Ingestion and Indexing). Source: [ai/roadmaps/2026-07-10-phase-02-ingestion-indexing-plan.md](../ai/roadmaps/2026-07-10-phase-02-ingestion-indexing-plan.md)

## 2026-07-10

- Added project planning documents for the high-level roadmap and milestone-based delivery plan. Source: [ai/roadmaps/2026-07-10-high-level-plan.md](../ai/roadmaps/2026-07-10-high-level-plan.md), [ai/roadmaps/2026-07-10-milestone-delivery-plan.md](../ai/roadmaps/2026-07-10-milestone-delivery-plan.md)
- Added phase-based planning documents for scope, foundation, ingestion/indexing, retrieval/answering, UI, validation, and demo-readiness work. Source: [ai/roadmaps](../ai/roadmaps)
- Added an architecture planning document covering stack, component flow, repository layout, and data expectations. Source: [aiDocs/architecture.md](architecture.md)
- Added a simple file reference table to the project context document to track major planning files and their purpose. Source: [aiDocs/context.md](context.md)
- Aligned the product vision, MVP scope, PRD requirements, and architecture notes around a consistent v0.1 prototype goal. Source: [aiDocs/context.md](context.md), [aiDocs/mvp.md](mvp.md), [aiDocs/prd.md](prd.md), [aiDocs/architecture.md](architecture.md)
