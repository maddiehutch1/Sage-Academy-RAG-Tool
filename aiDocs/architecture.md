# Sage Academy RAG Tool Architecture (v0.1)

## Purpose
This document outlines the recommended structure for the first version of the Sage Academy RAG tool. The goal is to build a working prototype that helps students ask course-related questions and receive answers grounded in course video transcripts, with a clear reference to the relevant video and timestamp.

This architecture is intended to support the v0.1 MVP and PRD in a simple, demo-oriented way. It is not meant to define a long-term enterprise platform.

## Guiding Principles
- Prioritize a working demo over perfect engineering.
- Keep the first version simple enough to build and extend.
- Make the retrieval and answer flow easy to understand.
- Ensure every answer can be traced back to a specific video section.

## Recommended Tech Stack

### Frontend
- Next.js with React and TypeScript
- Reason: easy to build a clean question-and-answer UI quickly

### Backend
- Python with FastAPI
- Reason: strong support for ingestion, embeddings, retrieval, and LLM orchestration

### Database
- PostgreSQL
- pgvector extension for semantic similarity search
- Reason: practical MVP choice that supports both relational and vector data

### AI / Retrieval Components
- Embedding model: OpenAI embedding model such as text-embedding-3-small
- LLM: GPT model such as GPT-4o-mini for answer generation
- Reason: fast to implement and appropriate for a prototype

### Development Workflow
- Docker Compose for local development if desired
- Environment variables for secrets and configuration
- Basic logging and error handling from the start

## APIs and Packages to Consider

### Core APIs
| Area | Recommended API / Service | Why It Fits |
| --- | --- | --- |
| Embeddings | OpenAI Embeddings API | Simple and reliable for v0.1 |
| LLM Answer Generation | OpenAI Chat Completions API | Good fit for grounded QA responses |
| Database | PostgreSQL + pgvector | Stores metadata and supports vector similarity search |
| Web UI | Next.js frontend API routes or a separate backend API | Keeps the app simple and easy to demo |

### Recommended Python Packages
| Purpose | Package | Notes |
| --- | --- | --- |
| API framework | fastapi | Main backend framework |
| ASGI server | uvicorn | Runs FastAPI locally |
| Request validation | pydantic | Strong schema validation |
| Database driver / ORM | psycopg2 or SQLAlchemy | Used for PostgreSQL access |
| Vector search support | pgvector | Required for similarity search in PostgreSQL |
| OpenAI access | openai | Python SDK for embeddings and chat completions |
| Environment settings | python-dotenv | Keeps secrets and config out of code |
| HTTP client | httpx | Helpful for calling external services |
| Testing | pytest | Good baseline for backend tests |

### Recommended JavaScript / Frontend Packages
| Purpose | Package | Notes |
| --- | --- | --- |
| App framework | next | Recommended for a simple web experience |
| UI library | react | Core frontend foundation |
| Language | typescript | Improves maintainability |
| HTTP requests | axios or fetch | For calling the backend API |
| Styling | tailwindcss | Optional but helpful for fast UI polish |

## High-Level Architecture
The system has five main layers:

1. Ingestion layer
   - Reads transcript files
   - Normalizes formatting
   - Extracts metadata such as course, video, and timestamps

2. Chunking and indexing layer
   - Splits transcripts into meaningful chunks
   - Stores each chunk with metadata
   - Generates embeddings for each chunk
   - Stores embeddings in PostgreSQL with pgvector

3. Retrieval layer
   - Takes a student question
   - Embeds the question
   - Finds the most relevant chunks using similarity search

4. Generation layer
   - Sends the retrieved context and the question to the LLM
   - Produces a concise answer with source attribution

5. Presentation layer
   - Displays the question form
   - Shows the answer
   - Shows source cards with recommended video, course, and timestamp range
   - Embeds a Kaltura video player directly in each source card using the `embedPlaykitJs` iframe format; seeks to the cited timestamp via the `kalturaSeekFrom` URL parameter
   - Includes a short excerpt confirming why that section is relevant

## End-to-End Flow
1. A transcript file is ingested and parsed.
2. The transcript is split into chunks.
3. Each chunk is embedded and stored with metadata.
4. A student enters a question in the web app.
5. The question is embedded and compared with stored chunks.
6. The most relevant chunks are retrieved.
7. Those chunks are passed to the LLM along with the original question.
8. The system returns:
   - a concise answer
   - the best matching video
   - a timestamp or time range
   - a short explanation of relevance

## Suggested Project Folder Structure
```text
sage-academy-rag-tool/
├── app/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   └── lib/
│   └── backend/
│       ├── api/
│       ├── services/
│       ├── schemas/
│       ├── core/
│       └── main.py
├── data/
│   ├── raw_transcripts/
│   ├── processed/
│   └── sample_data/
├── db/
│   ├── migrations/
│   └── schema.sql
├── scripts/
│   ├── ingest_transcripts.py
│   └── index_transcripts.py
├── tests/
├── .env.example
├── docker-compose.yml
└── README.md
```

## Component Responsibilities

### Frontend
- Provide a simple interface for student questions
- Display the answer and source reference
- Show source cards with transcript excerpt and timestamp badge
- Embed the Kaltura video player inside each source card; convert the stored `extwidget/preview` URL to a `cdnapisec.kaltura.com/embedPlaykitJs` iframe src with `kalturaSeekFrom=<seconds>` and `autoplay=true` so playback begins at the exact cited moment

### Backend API
- Accept question requests
- Orchestrate retrieval and answer generation
- Return structured results to the UI

### Ingestion Service
- Read transcript files from disk or a provided source
- Normalize text and metadata
- Store source records for later retrieval

### Chunking Service
- Split transcripts into chunks of manageable size
- Preserve timing information and order
- Attach metadata such as course, video, and timestamp range

### Embedding Service
- Generate vector representations for chunks and questions
- Store vectors in the vector database

### Retrieval Service
- Search for the closest matching chunks for a user question
- Return the top matches for answer generation

### Generation Service
- Build a prompt using the retrieved chunk context
- Call the LLM to produce an answer
- Include source references in the response

## Incoming Data Structure
The tool should expect a structured input that includes both the transcript content and its metadata. A simple MVP format could look like this:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| course_id | string | Yes | Unique identifier for the course |
| course_name | string | Yes | Human-readable course title |
| video_id | string | Yes | Unique identifier for the video |
| video_title | string | Yes | Display title of the video |
| video_url | string | No | Link to the video source |
| transcript_format | string | Yes | Format such as txt, vtt, or srt |
| transcript_text | string | Yes | Full transcript content |
| transcript_path | string | No | File path or storage location |
| language | string | No | Default language, such as en |
| segments | array | No | Optional list of timed transcript segments |
| created_at | datetime | No | When the transcript was ingested |

### Example Incoming Record
```json
{
  "course_id": "ds101",
  "course_name": "Data Analytics Foundations",
  "video_id": "vid-001",
  "video_title": "Introduction to SQL",
  "video_url": "https://example.edu/videos/sql-intro",
  "transcript_format": "vtt",
  "transcript_text": "Welcome to this lesson on SQL joins.",
  "transcript_path": "data/raw_transcripts/sql-intro.vtt",
  "language": "en",
  "segments": [
    {
      "start_time": 0,
      "end_time": 12,
      "text": "Welcome to this lesson on SQL joins."
    }
  ]
}
```

## Recommended Data Model
A simple MVP can use the following concepts:

- Course
  - id
  - name
  - description

- Video
  - id
  - course_id
  - title
  - source_url
  - transcript_path

- TranscriptChunk
  - id
  - video_id
  - chunk_text
  - start_time
  - end_time
  - chunk_index
  - embedding

- QuestionLog (optional for v0.1)
  - id
  - question_text
  - answer_text
  - retrieved_video_id
  - created_at

## Implementation Notes for v0.1
- Start with a small set of transcripts from one or two courses.
- Use a small number of retrieved chunks for each answer.
- Keep the answer concise and grounded.
- Use simple metadata and a basic retrieval flow first.
- Avoid adding a full knowledge graph or advanced personalization yet.

## Decisions Finalized in v0.1
- Transcript formats: SRT and DFXP/TTML, organized in per-course subfolders
- Ingest input folder: `data/transcripts/` (pending files only). After a successful ingest, the course folder is moved to `data/ingest_transcripts_complete/` so the next run does not re-embed already-indexed courses
- Embedding model: `text-embedding-3-small`; LLM: `gpt-4o-mini`
- Chunk size: 400 tokens with 5-entry overlap
- Video links stored in the `videos.source_url` column (Kaltura `extwidget/preview` URLs); the frontend converts them to `embedPlaykitJs` iframe URLs with `kalturaSeekFrom` for in-chat playback at the cited timestamp. URL-only updates use `scripts/sync_source_urls.py` (no re-embed)
- Local deployment via Docker Compose (pgvector) + uvicorn + Next.js dev server; production index is the Render Postgres database
- Multi-course indexing supported. Live courses (174 videos):
  - DATA 1100: Excel for Business Analysis (16)
  - DATA 2100: Data and Information in Business (43)
  - DATA 5300: Database Management (25)
  - DATA 5400: Advanced Data Visualization (63)
  - IS 3600: Introduction to Cloud Computing (27)

## Stage 3 (in progress)
YouTube is a second host for the same `videos.source_url` string, not a second pipeline. Planning: [ai/roadmaps/2026-09-12-high-level-plan-stage-3.md](../ai/roadmaps/2026-09-12-high-level-plan-stage-3.md).

- Offline helper `scripts/prepare_youtube_playlist.py` lists a playlist with `yt-dlp` (local operator tool, not a web dependency), writes `.srt` + JSON sidecars into `data/transcripts/<COURSE>/`
- `ingest.py` stays SRT/DFXP-only; YouTube captions are converted to SRT before ingest
- Frontend sniffs YouTube vs Kaltura from `source_url` and builds the matching iframe (`youtube.com/embed/<id>?start=<seconds>` vs existing `embedPlaykitJs` + `kalturaSeekFrom`)
- No playlist table, no `source_type` column, no YouTube I/O in `/ask`
- Operator inputs: IS 5750 playlist, `IS 5750: JavaScript for Absolute Beginners`, English captions, output `data/transcripts/IS5750/`. Helper/player implementation and caption preparation are complete (216 videos); local ingest and end-to-end QA remain pending local Docker and API-key configuration.

Update the "Decisions Finalized" bullets above when Phase 1 closes.

## Recommended Next Step
Complete local ingest and end-to-end QA after Docker is available and local `.env` settings are configured: [ai/roadmaps/2026-09-12-phase-01-youtube-playlist-plan.md](../ai/roadmaps/2026-09-12-phase-01-youtube-playlist-plan.md).
