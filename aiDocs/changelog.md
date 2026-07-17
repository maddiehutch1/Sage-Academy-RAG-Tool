# Changelog

This file is a concise record of project changes as the Sage Academy RAG Tool evolves. Each entry should remain short and point back to the source planning document that informed the change.

## 2026-07-17 (post-session fix)

- **Embedded Kaltura video player:** replaced the "open in new tab" approach with an in-chat embedded iframe. Each source card now has a "Watch at MM:SS" toggle button; clicking it expands a 16:9 Kaltura player directly below the card with playback starting at the cited timestamp. Collapsing one card and opening another is supported; submitting a new question collapses all.
- **Fixed timestamp seek:** URL-parameter seeking (`?playFrom`, `?kalturaSeekFrom`, `config[playback]`) all fail on the `extwidget/preview` URL format because that route does not forward seek params to the player. The fix is to parse the `partner_id`, `uiconf_id`, and `entry_id` out of the stored `extwidget/preview` URL and reconstruct an `https://cdnapisec.kaltura.com/p/{pid}/embedPlaykitJs/uiconf_id/{uid}?iframeembed=true&entry_id={eid}&kalturaSeekFrom={sec}&autoplay=true` iframe src — the `embedPlaykitJs` format explicitly supports `kalturaSeekFrom`.
- Updated `aiDocs/mvp.md` to add embedded video player with timestamp seek as an explicit MVP scope item and success criterion.
- Updated `aiDocs/architecture.md` presentation layer and frontend component sections to describe the iframe embedding approach; replaced "Decisions Still to Finalize" with "Decisions Finalized in v0.1".

## 2026-07-17

- **Transcripts folder reorganized:** All transcript and sidecar files moved into `data/transcripts/DATA2100/` and `data/transcripts/IS3600/` subdirectories; `ingest.py` now uses `rglob` to discover files recursively.
- **DFXP/TTML ingestion support added:** `scripts/ingest.py` now parses DFXP (Timed Text Markup Language) caption files in addition to SRT. Added `parse_dfxp()`, `dfxp_time_to_seconds()`, and `_ttml_text()` helpers. The pipeline auto-detects file format by extension.
- **17 new JSON sidecar files created** for lectures that were missing metadata: 15 for the newly added DFXP transcripts (`DATA2100_DataEcosystems`, `DataVizIntro`, `Flowcharting`, `ICA_BalancedScorecard`, `ICA_DataVisualization`, `ICA_MetricsAndHypotheses`, `ICA_MultiTableQueries*` ×2, `InsertAndUpdate`, `IntroToCourse`, `IntroToFlowcharting`, `ITInfrastructure`, `MultiTableQueries` ×2, `NetPresentValue`) and 2 for SRT files that were previously skipped (`DATA2100_SQLGroupBy_Part2`, `DATA2100_SQLHaving`). Video `source_url` fields are left `null` for manual entry.
- **`get_or_create_video` in `ingest.py` is now idempotent on `source_url`:** On re-ingest, if a video row already exists its `source_url` and `transcript_path` are updated to reflect the latest sidecar, so adding a URL later and re-running ingest propagates it to the DB.
- **Video deep-link wired end-to-end:** `source_url` is now selected in `backend/retrieval.py`, passed through `backend/answer.py` sources, and exposed as an optional field in the `Source` Pydantic model in `backend/main.py`.
- **Frontend source cards show a "Watch at MM:SS" button** when `source_url` is present. Clicking it opens the Kaltura player in a new tab at the exact timestamp of the cited chunk via the `?playFrom=<seconds>` query parameter.
- **New `scripts/sync_source_urls.py`:** lightweight utility that reads `source_url` from all JSON sidecar files and pushes the values into the `videos` table — no re-embedding required. Use this any time you add or update a video link in a sidecar without wanting to run a full ingest.
- Updated `README.md` to reflect DFXP support, the `DATA2100/` / `IS3600/` subfolder layout, the new `sync_source_urls.py` script, and removed stale "Source URL support" future-improvement item.

## 2026-07-16 (Phase 6 — post-phase fixes)

- Added distance threshold to `backend/retrieval.py` (`MAX_RETRIEVAL_DISTANCE=0.65`, tunable via env). Questions with no relevant match no longer trigger an LLM call — saves tokens on off-topic questions.
- Changed `backend/main.py` to return a soft no-content response (`sources=[]`) instead of HTTP 404 when nothing passes the threshold.
- Updated `frontend/app/page.tsx` to hide the sources section entirely when `sources` is empty; answer card renders in muted italic style for clarity.
- Cleaned up stale duplicate roadmap files left in `ai/roadmaps/` root by Windows path handling.
- Renamed `ai/roadmaps/2026-07-10-high-level-plan.md` → `2026-07-10-high-level-plan-mvp.md`; marked all 7 milestones complete.

## 2026-07-16 (Phase 6)

- Completed Phase 6 (Demo Readiness and Extensibility). Source: [ai/roadmaps/complete/2026-07-10-phase-06-demo-readiness-roadmap.md](../ai/roadmaps/complete/2026-07-10-phase-06-demo-readiness-roadmap.md)
- Rewrote README.md: replaced stale Phase 1 content with accurate setup instructions, flow diagram, repo layout, ingestion/eval usage, and a Future Improvements section.
- Tightened `backend/answer.py` system prompt: removed over-refusal behavior for questions where the answer requires combining context across excerpts (fixes q04-style regressions from Phase 5).
- No structural or API changes — codebase is stable and demo-ready.

## 2026-07-16 (Phase 5)

- Completed Phase 5 (Validation and Refinement). Source: [ai/roadmaps/complete/2026-07-10-phase-05-validation-roadmap.md](../ai/roadmaps/complete/2026-07-10-phase-05-validation-roadmap.md)
- Added JSON sidecar metadata files for all 52 previously missing SRT transcripts (26 IS 3600 lectures, 26 DATA 2100 lectures). Root cause of prior weak retrieval: ingest.py silently skipped files without a sidecar.
- Re-ran `scripts/ingest.py` — all 53 lectures now indexed in pgvector across both IS 3600 and DATA 2100.
- Re-ran `scripts/run_eval.py` — 0 weak retrieval flags (down from 2). q07 top-chunk distance improved from 0.5523 to 0.4121; q08 from 0.6276 to 0.4909. Full report: `tests/eval_results/eval_2026-07-16_14-05-57.md`.
- Fixed `UnicodeEncodeError` in `scripts/ingest.py` — replaced `→` with `->` in print statement for Windows cp1252 compatibility.

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
