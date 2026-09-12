# Changelog

This file is a concise record of project changes as the Sage Academy RAG Tool evolves. Each entry should remain short and point back to the source planning document that informed the change.

## 2026-09-12 — Follow-up retrieval uses an anchor question

- **Retrieval:** Follow-ups like "explain that" / "generic example" embed the last substantial user question + current question. A new standalone question in the thread embeds current-only, so off-topic asks no longer inherit the previous topic.
- **Prompt:** History is for pronouns only. If excerpts are not about the current question, say so rather than answering from general knowledge.
- Closes the two retrieval gaps logged in the Phase 3 QA pass. Refresh-clears-thread is unchanged.

## 2026-09-12 — Stage 2 Phase 3 Joint Validation complete (Milestone 4)

- **Eval:** Render index run `tests/eval_results/eval_2026-09-12_17-06-41.md` — 12 questions, 0 weak flags. Dual-example checklist filled. IS3600 q01–q08 stay conceptual.
- **Thread QA:** First ask + "explain that" stay on topic; topic change to IaaS/PaaS/SaaS retrieves IS 3600; first-turn off-topic still uses soft no-content. Five-course catalog (174 videos) and neighbor chips confirmed on Render.
- **Gaps logged (not fixed):** follow-up retrieval uses only the last user utterance, so chained follow-ups can retrieve off-topic sources; in-thread off-topic can still answer from general knowledge; refresh clears the thread by design. Source: Milestone 4 in `ai/roadmaps/2026-09-11-high-level-plan-stage-2.md`. Phase 2–3 plan/roadmap pairs moved to `ai/roadmaps/complete/`.

## 2026-09-12 — Stage 2 Phase 2 Follow-Up Thread complete (Milestone 3)

- **API:** `POST /ask` accepts optional `history` (last 6 `{role, content}` messages). Retrieval embeds previous user question + current question. `generate_answer` includes those turns so follow-ups like "explain that" resolve. `question_logs` still stores the current turn only.
- **UI:** In-tab thread with per-turn source cards, bottom composer, and New thread (tab state only). Assistant answers render with `react-markdown` (bold, lists, fenced code). `page.tsx` split into `ChatThread.tsx` + `SourceCards.tsx`.
- **Smoke:** First ask still returns sources; follow-up "explain that more simply" stayed on IaaS/PaaS/SaaS; topic change retrieved flowcharting; coding answer included a fenced Python block. Source: Milestone 3 in `ai/roadmaps/2026-09-11-high-level-plan-stage-2.md`.

## 2026-09-12 — Stage 2 Phase 1 Dual-Example Answers complete (Milestone 2)

- **Prompt:** `backend/answer.py` `SYSTEM_PROMPT` now asks coding/layout answers to name the lecture's demo scenario, then give a generic reusable example. No classifier; one generate path. Markdown left in the output (Phase 2 renders it).
- **Eval:** `scripts/run_eval.py` imports that prompt. Added DATA2100 q09–q12 (lists, for-loop, if, flowchart). Render index run `tests/eval_results/eval_2026-09-12_16-19-34.md` — 12 questions, 0 weak flags; dual-example checklist filled.
- **Planning docs closed:** Phase 1 plan/roadmap moved to `ai/roadmaps/complete/`. Source: those files and Milestone 2 in `ai/roadmaps/2026-09-11-high-level-plan-stage-2.md`.

## 2026-09-12 — Stage 2: markdown rendering added to Phase 2

- **Additional student feedback:** answers show raw OpenAI markdown (asterisks, backticks). Stage 2 will render assistant markdown in the thread UI instead of stripping it from the prompt.
- **Phased into follow-up thread (Phase 2):** `react-markdown` only; no syntax highlighter. Phase 1 must not add a "plain text only" prompt rule (code examples need fences). Phase 3 QA includes formatted bold/lists/code.
- **Docs updated:** high-level Stage 2 plan, `context.md` / `prd.md` / `mvp.md`, and Phase 1–3 plan/roadmap pairs.
- **No code changes in this entry.**

## 2026-09-11 — Stage 2 planned (student feedback)

- **Student feedback locked to three items:** in-tab follow-up thread (ChatGPT-like layout, no typing over the original question); dual-example answers for coding/layout questions (name the lecture scenario, then a generic reusable example); render assistant markdown so asterisks and backticks look like normal formatted text.
- **Vision unchanged:** still a grounded course Q&A prototype with video/timestamp citations. No accounts, saved chats, conversation tables, streaming, or query-rewrite model.
- **High-level plan expanded:** `ai/roadmaps/2026-09-11-high-level-plan-stage-2.md` now has phases 0–3, milestones, and in/out of scope. Markdown rendering is a Phase 2 UI task (not a Phase 1 prompt strip).
- **Phase docs written:** dual-example (Phase 1), follow-up thread (Phase 2), and joint validation (Phase 3) each have a plan + roadmap pair under `ai/roadmaps/`.
- **aiDocs updated:** Stage 2 sections added to `context.md`, `prd.md`, and `mvp.md`.
- **No code changes in this entry** — this is a planning-only update. Implementation begins with Phase 1.

## 2026-09-11 — Phase 8 Video Library Sidebar complete (Milestone 9)

- **Sidebar shipped:** Collapsible left-side video library lists all 174 videos across five courses, grouped by course and sorted by `video_order`. Search filters titles client-side; clicking a video opens a floating Kaltura modal at t=0 (ESC / × / backdrop dismiss). Chat source-card embeds are unchanged.
- **`GET /videos`:** Returns courses with nested video summaries from existing `courses` / `videos` tables. No schema changes.
- **QA signed off:** Five-course catalog, search restore, first/last video per sequence, modal vs chat isolation.
- **Planning docs closed:** `ai/roadmaps/2026-07-30-phase-08-video-library-sidebar-plan.md` and matching roadmap moved to `ai/roadmaps/complete/`. Source: those files and Milestone 9 in `ai/roadmaps/2026-07-10-high-level-plan-mvp.md`.

## 2026-09-01 — DATA5300 course added

- **DATA5300 transcripts ingested:** 25 new transcript files (21 SRT + 4 DFXP) for *DATA 5300: Database Management* ingested into the live Render index. 25 companion JSON sidecars created with human-readable titles, `order` 1–25 (setup → principles/ERD/normalization → SQL queries → CASE/views/dates → tuning/security/OLTP), and Kaltura `source_url` values.
- **217 chunks stored** in pgvector. Retrieval smoke test (`What is BCNF and how is it different from 3NF?`) returned DATA 5300 *BCNF Part 2* as the top three hits (distances 0.38–0.43).
- **Kaltura URLs synced without re-embed:** after ingest, `scripts/sync_source_urls.py` pushed all 25 `source_url` values into the `videos` table.
- **Corpus now five courses:** DATA1100 (16) + DATA2100 (43) + DATA5300 (25) + DATA5400 (63) + IS3600 (27) = 174 videos.
- **Folder workflow:** pending files live in `data/transcripts/`; after a successful ingest the course folder is moved to `data/ingest_transcripts_complete/` so the next `ingest.py` run does not re-embed already-indexed courses. DATA5300 now lives under `data/ingest_transcripts_complete/DATA5300/`.

## 2026-08-06 — DATA1100 course added

- **DATA1100 transcripts ingested:** 16 transcript files (9 SRT + 7 DFXP) for *DATA 1100: Excel for Business Analysis* added as a fourth indexed course, with JSON sidecars (`order` 1–16) and Kaltura URLs.
- **`data/ingest_transcripts_complete/` introduced:** already-indexed course folders (DATA1100, DATA2100, DATA5400, IS3600) were moved out of `data/transcripts/` so later `ingest.py` runs only process new files. `ingest.py` and `sync_source_urls.py` still scan `data/transcripts/` only.

## 2026-07-30 — Video Library Sidebar planned (Milestone 9)

- **Stakeholder feature request:** Following the second internal demo, stakeholders requested a way for students to browse and watch any video in the catalog without needing to ask a question.
- **Planning documents created:** Detailed phase plan written at `ai/roadmaps/complete/2026-07-30-phase-08-video-library-sidebar-plan.md`; Milestone 9 added to the high-level MVP plan.
- **Scope added to `aiDocs/mvp.md`:** Collapsible left sidebar, search/filter input, floating Kaltura modal (starts at t=0), ESC/× dismiss. Source card inline embeds in chat are unchanged.
- **No code changes in this entry** — this is a planning-only update. Implementation begins next.

## 2026-07-27 — Video ordering added across all three courses

- **`order` field added to all JSON sidecars:** Every transcript sidecar now includes an `"order"` integer reflecting the video's position in the course sequence. IS3600 uses the lecture number from the filename (1–29, matching actual lecture numbers with gaps where lectures are missing). DATA2100 is sequenced 1–43 following the course's topic progression (data quality → databases/SQL → enterprise systems → flowcharting → Python → project management → data analysis → visualization). DATA5400 is sequenced 1–63 following the course's Cairn/Base Camp structure (setup → Cairn 1 → Base Camp 01 → Cairn 2 → calculations → design → maps/dashboards → story → advanced interaction).
- **`video_order` column added to `videos` table:** `db/schema.sql` updated; existing live DB updated via `ALTER TABLE videos ADD COLUMN IF NOT EXISTS video_order INTEGER`.
- **`ingest.py` reads and stores `order`:** `load_sidecar` result is passed through `get_or_create_video`, which now writes `video_order` on both INSERT and UPDATE (idempotent on re-ingest).
- **`retrieval.py` selects `video_order`:** Added to the chunk query and returned in every result dict.
- **`answer.py` and `main.py` expose `video_order`:** Included in the `sources` list returned by `generate_answer` and in the `Source` Pydantic model (`Optional[int]`).
- **Full re-ingest completed:** All 133 videos (43 DATA2100 + 63 DATA5400 + 27 IS3600) re-indexed with `video_order` populated.
- **`sync_source_urls.py` BOM fix:** Updated to use `utf-8-sig` encoding (same fix previously applied to `ingest.py`) so DATA5400 JSON files with a Windows BOM parse correctly.

## 2026-07-21 — DATA5400 course added (SRT/DFXP with real timestamps)

- **DATA5400 transcripts ingested:** 63 new transcript files (12 SRT + 51 DFXP) for *DATA 5400: Advanced Data Visualization* added to `data/transcripts/DATA5400/`. 63 companion JSON sidecar files created with clean human-readable video titles.
- **Full re-ingest completed:** The entire corpus — DATA2100, IS3600, and now DATA5400 — is re-indexed in pgvector with real timestamps on every chunk.
- **Txt-era cleanup:** An earlier temporary attempt used plain `.txt` transcripts (no timestamps) as a placeholder. Those 56 txt-era records (464 chunks) were removed from the DB before re-ingesting the proper SRT/DFXP files. All temporary code (`scripts/prepare_data5400.py`, `parse_txt()` in `ingest.py`, `Optional` timestamp fields in `main.py`/`answer.py`) was reverted.
- **`ingest.py` restored to SRT/DFXP-only:** Docstring, file discovery, format dispatch, and chunk logging all revert to the pre-txt state. No functional change to existing DATA2100/IS3600 behaviour.
- **BOM-safe sidecar loading:** `load_sidecar()` now opens JSON files with `utf-8-sig` encoding, which silently strips the UTF-8 BOM that Windows tools (PowerShell `Set-Content`) write by default. Backwards-compatible with all existing BOM-free sidecars.

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
