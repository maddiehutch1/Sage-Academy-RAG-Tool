# Sage Academy RAG Tool

A prototype that lets students ask questions about course content and receive answers grounded in real lecture transcripts — with source citations back to the exact video and timestamp.

**Courses indexed:** IS 3600: Introduction to Cloud Computing · DATA 2100: Data and Information in Business

---

## How it works

1. **Ingest** — SRT and DFXP transcript files are chunked, embedded with `text-embedding-3-small`, and stored in PostgreSQL with pgvector.
2. **Retrieve** — A student's question is embedded the same way and matched against stored chunks by cosine similarity.
3. **Answer** — The top 5 chunks are passed to `gpt-4o-mini` with a grounded prompt. The response includes the answer and a source list with video name, course, timestamp range, and a direct link to watch the video at that exact moment.

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

Transcripts live in `data/transcripts/` organized by course:

```
data/transcripts/
  DATA2100/    ← all DATA 2100 .srt, .dfxp, and .json sidecar files
  IS3600/      ← all IS 3600 .srt and .json sidecar files
```

Two transcript formats are supported:

| Format | Extension | Notes |
|--------|-----------|-------|
| SubRip | `.srt` | Plain-text subtitles with `HH:MM:SS,mmm` timestamps |
| DFXP/TTML | `.dfxp` | XML caption format with `HH:MM:SS.frac` timestamps |

Each transcript file needs a companion `.json` sidecar **in the same folder** with course and video metadata:

```json
{
  "course": "IS 3600: Introduction to Cloud Computing",
  "video": "Lecture 4: EC2",
  "source_url": "https://www.kaltura.com/..."
}
```

All transcripts currently in `data/transcripts/` already have their sidecars. To run ingestion:

```
python scripts/ingest.py
```

This is idempotent — re-running it clears and re-indexes chunks for each file without duplicating data.

## Syncing video URLs (without re-ingesting)

If you add or update a `source_url` in a sidecar `.json` after the initial ingest, run this instead of the full ingest — it only updates the URL column in the DB and skips all the expensive embedding calls:

```
python scripts/sync_source_urls.py
```

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
data/transcripts/
  DATA2100/       DATA 2100 transcripts (.srt, .dfxp) + JSON sidecar metadata
  IS3600/         IS 3600 transcripts (.srt) + JSON sidecar metadata
db/               schema.sql (applied automatically by Docker on first run)
frontend/         Next.js app (app/page.tsx is the main UI)
scripts/
  ingest.py           chunk + embed transcripts into pgvector (SRT and DFXP)
  sync_source_urls.py update video URLs in DB from sidecar files (no re-embed)
  validate_index.py   smoke-test retrieval with a sample question
  run_eval.py         full eval harness; writes report to tests/eval_results/
tests/
  eval_questions.json     8 representative student questions with expected keywords
  eval_results/           timestamped Markdown eval reports
ai/roadmaps/      planning and phase documents
aiDocs/           architecture, context, PRD, changelog
```

---

## Adding transcripts in the future

1. Drop the `.srt` or `.dfxp` file into the appropriate subfolder (`data/transcripts/DATA2100/` or `data/transcripts/IS3600/`).
2. Create a matching `.json` sidecar in the same folder with `course`, `video`, and `source_url` fields.
3. Run `python scripts/ingest.py`.

---

## Future improvements

These were identified during development and deferred intentionally:

- **Eval coverage for DATA 2100** — `tests/eval_questions.json` only covers IS 3600 topics. Adding SQL, Python, and Excel questions would validate DATA 2100 retrieval quality.
- **Prompt tuning for edge cases** — questions about topics covered lightly in a single lecture sometimes produce conservative answers. A revised system prompt or a reranking step could help.
- **Course filter in the UI** — students can't currently restrict questions to one course. A dropdown would improve relevance for cross-course deployments.
- **Missing IS 3600 lectures** — lectures 15, 16, 25, and 28 are not yet indexed. Adding those transcripts would close gaps.
- **Authentication** — the API has no auth. Fine for a prototype; needs a gate before any wider rollout.
