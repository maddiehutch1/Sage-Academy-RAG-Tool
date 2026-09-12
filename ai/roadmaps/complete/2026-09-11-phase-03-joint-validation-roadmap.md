# Phase 3 Roadmap: Joint Validation

Date: 2026-09-11

See `ai/roadmaps/complete/2026-09-11-phase-03-joint-validation-plan.md` for goal, decisions, and exit criteria.

**Avoid over-engineering, cruft, and legacy-compatibility features.** This phase is a QA pass, not a feature pass. Fix regressions from Phase 1 or 2; do not add Stage 3 work.

## Steps

1. [x] Run the automated eval.
   - `python scripts/run_eval.py`
   - Existing IS3600 questions (q01–q08) still retrieve and look grounded.
   - New coding/layout questions still retrieve; then apply the Phase 1 manual dual-example checklist to those answers.
   - Result: `tests/eval_results/eval_2026-09-12_17-06-41.md` — 12 questions, 0 weak flags. Dual-example checklist filled.

2. [x] Follow-up thread in the UI.
   - Ask a first course question; confirm answer + sources + Watch at timestamp.
   - Follow up with "explain that" (or similar). Confirm it refers to the previous answer.
   - Follow up with "now give me a generic example/layout." Confirm dual-example behavior and new sources on that turn.
   - Confirm that answer's markdown (bold, list, or fenced code) is rendered — no raw asterisks or triple backticks.
   - Ask an unrelated full question in the same thread. Confirm retrieval moves to the new topic.
   - Ask something off-corpus. Confirm soft no-content; prior turns remain.
   - Notes: first-turn Python for-loop returned Intro to Lists + source_url + neighbors + fenced code. "explain that" stayed on for loops. Generic follow-up generation stayed generic; retrieval once drifted to ERDs (remaining gap). Topic change moved to IS 3600 IaaS/PaaS/SaaS with no unsolicited code. First-turn off-topic is soft no-content; in-thread off-topic can still retrieve (remaining gap). Markdown rendering confirmed in Phase 2 UI pass.

3. [x] Thread lifecycle.
   - New thread clears messages; sidebar state unchanged.
   - Refresh the page; thread is gone. Confirm this is expected.

4. [x] Sidebar and modal isolation.
   - Open the library, search, open a video modal at t=0, close via ESC / × / backdrop.
   - Confirm the chat thread (including expanded source embeds) is intact.
   - Confirm neighbor chips still work on a source card in the thread.
   - Notes: `GET /videos` on Render returned 5 courses / 174 videos. Neighbor payload confirmed (e.g. BCNF Part 2 → prev Normalization Part 1, next Project BCNF). Chat vs modal state remain separate in `page.tsx`.

5. [x] Record results.
   - Note pass/fail for each item in the Phase 3 plan checklist.
   - List remaining gaps that are out of Stage 2 rather than fixing them here.
   - When this phase closes: check off Milestone 4 in `ai/roadmaps/2026-09-11-high-level-plan-stage-2.md`, move completed phase docs to `ai/roadmaps/complete/`, and add a changelog entry.

## Implementation Notes
- Prefer reproducing failures as a student would (UI first, curl only to isolate API).
- If dual-example fails only in a follow-up, check that history is being sent and that the Phase 1 prompt is still the one `generate_answer` uses.
- If "explain that" retrieves nonsense, check that retrieval is concatenating the previous user question, not embedding the follow-up alone.
- Do not add localStorage to "fix" refresh. Refresh-clears-thread is a locked Stage 2 decision.

## Output
A Stage 2 prototype that can be demoed: in-tab follow-ups, dual examples for code/layout, answers that look like formatted text rather than raw markdown, citations still on the video, library sidebar unchanged — plus a short list of what Stage 2 will not do.
