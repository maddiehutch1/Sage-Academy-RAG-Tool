# Phase 6 Roadmap: Demo Readiness and Extensibility

Date: 2026-07-10

## Steps
1. [x] Validate that the project can be started locally from a clean environment.
   - Startup sequence confirmed working: Docker → ingest → backend (uvicorn from backend/) → frontend (npm run dev).
2. [x] Write concise setup instructions for running the backend, frontend, and database.
   - README.md fully rewritten: prerequisites, step-by-step setup, how to run ingestion, validate_index, and eval. Replaces the stale Phase 1 version.
3. [x] Review the repository for confusing structure or dead code and simplify where helpful.
   - No dead code found. All scripts are actively used. Structure is clean.
   - Stale duplicate roadmap files left in ai/roadmaps/ root by Windows Move-Item were deleted.
4. [x] Document the ingestion, indexing, retrieval, and answer flow in a handoff-friendly way.
   - README includes a plain-language flow diagram and a repository layout table.
   - Each script has a module-level docstring explaining its role, usage, and parameters.
5. [x] Record the next improvement ideas and decisions that should be deferred to future versions.
   - README "Future improvements" section lists 6 concrete next steps with brief rationale.

## Post-Phase Fixes (2026-07-16)
- Added distance threshold (`MAX_RETRIEVAL_DISTANCE=0.65`) to `backend/retrieval.py`. Questions with no relevant match skip the LLM call entirely — no wasted tokens.
- Changed `backend/main.py` to return a soft "no content" response (`sources=[]`) instead of an HTTP 404 when nothing passes the threshold.
- Updated `frontend/app/page.tsx` to hide the sources section entirely when `sources` is empty, and render the answer in muted italic style to distinguish it from grounded responses.

## Implementation Notes
- Keep the documentation practical and focused on getting someone new up to speed quickly.
- Do not add major new features in this phase.
- The goal is to leave the project in a clean, understandable state for the next iteration.

## Output
A demo-ready and extensible prototype with clear setup guidance and a straightforward path for future enhancements.
