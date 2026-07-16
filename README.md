# Sage Academy RAG Tool

A prototype that lets students ask questions about course content and receive answers grounded in real lecture transcripts — with source citations back to the exact video and timestamp.

**Courses indexed:** IS 3600: Introduction to Cloud Computing (27 lectures) · DATA 2100: Data and Information in Business (26 lectures)

---

## How it works

1. **Ingest** — SRT transcript files are chunked, embedded with `text-embedding-3-small`, and stored in PostgreSQL with pgvector.
2. **Retrieve** — A student's question is embedded the same way and matched against stored chunks by cosine similarity.
3. **Answer** — The top 5 chunks are passed to `gpt-4o-mini` with a grounded prompt. The response includes the answer and a source list with video name, course, and timestamp range.

```
Student question
      │
      ▼
  Embed question (OpenAI)
      │
      ▼
  Vector search (pgvector, top-5)
      │
      ▼
  Generate grounded answer (gpt-4o-mini)
      │
      ▼
  Answer + source citations → UI
```

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker Desktop (runs PostgreSQL with pgvector)
- An OpenAI API key

---

## Setup

### 1. Environment variables

Copy `.env.example` to `.env` and replace the placeholder with your real OpenAI API key:

```
cp .env.example .env
```

The only value you need to change is `OPENAI_API_KEY`. Leave everything else as-is for local development.

### 2. Start the database

```
docker compose up -d
```

This starts PostgreSQL on port **5433** and applies the schema automatically on first run.

### 3. Python dependencies

Create a virtual environment and install:

```
python -m venv .venv
```

Activate it:
```
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
```

Install:
```
pip install -r backend/requirements.txt
```

### 4. Frontend dependencies

```
cd frontend
npm install
cd ..
```

---

## Running locally

Open **two terminals** from the project root.

**Terminal 1 — Backend:**
```
cd backend
uvicorn main:app --reload
```
Backend runs at http://127.0.0.1:8000. Confirm it's healthy: http://127.0.0.1:8000/health

**Terminal 2 — Frontend:**
```
cd frontend
npm run dev
```
Frontend runs at http://localhost:3000.

---

## Ingesting transcripts

> Run this once after setup, or again any time you add new transcript files.

Each `.srt` transcript in `data/transcripts/` needs a companion `.json` sidecar with course and video metadata:

```json
{
  "course": "IS 3600: Introduction to Cloud Computing",
  "video": "Lecture 4: EC2",
  "source_url": null
}
```

All 53 transcripts currently in `data/transcripts/` already have their sidecars. To run ingestion:

```
python scripts/ingest.py
```

This is idempotent — re-running it clears and re-indexes chunks for each file without duplicating data.

---

## Validating the index

A quick sanity check that retrieval is working:

```
python scripts/validate_index.py
```

Or pass a custom question:

```
python scripts/validate_index.py "What is IAM and why does it matter?"
```

---

## Running the eval

The eval script runs 8 representative student questions through the full pipeline and writes a timestamped report to `tests/eval_results/`:

```
python scripts/run_eval.py
```

Latest result (2026-07-16): 8/8 questions, 0 weak retrieval flags.

---

## Repository layout

```
backend/          FastAPI app (main.py, retrieval.py, answer.py, db.py)
data/transcripts/ SRT transcripts + JSON sidecar metadata files
db/               schema.sql (applied automatically by Docker on first run)
frontend/         Next.js app (app/page.tsx is the main UI)
scripts/          ingest.py, validate_index.py, run_eval.py
tests/
  eval_questions.json     8 representative student questions with expected keywords
  eval_results/           timestamped Markdown eval reports
ai/roadmaps/      planning and phase documents
aiDocs/           architecture, context, PRD, changelog
```

---

## Adding transcripts in the future

1. Drop the `.srt` file into `data/transcripts/`.
2. Create a matching `.json` sidecar with `course`, `video`, and `source_url` fields.
3. Run `python scripts/ingest.py`.

---

## Future improvements

These were identified during Phase 5 validation and deferred intentionally:

- **Eval coverage for DATA 2100** — `tests/eval_questions.json` only covers IS 3600 topics. Adding SQL, Python, and Excel questions would validate DATA 2100 retrieval quality.
- **Prompt tuning for edge cases** — questions about topics covered lightly in a single lecture (e.g. on-demand vs. reserved pricing) sometimes produce conservative answers. A revised system prompt or a reranking step could help.
- **Course filter in the UI** — students can't currently restrict questions to one course. A dropdown would improve relevance for cross-course deployments.
- **Missing lectures** — IS 3600 skips lectures 15, 16, 25, and 28. Adding those transcripts would close gaps.
- **Source URL support** — the schema has a `source_url` field; wiring it to the UI would let students jump directly to the video moment being cited.
- **Authentication** — the API has no auth. Fine for a prototype; needs a gate before any wider rollout.
