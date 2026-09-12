# Phase 2 Roadmap: Follow-Up Thread

Date: 2026-09-11

See `ai/roadmaps/complete/2026-09-11-phase-02-follow-up-thread-plan.md` for goal, decisions, and exit criteria.

**Avoid over-engineering, cruft, and legacy-compatibility features.** In-tab thread plus optional `history` on `/ask`, plus rendering the markdown the model already returns. No conversation table, no localStorage, no streaming, no rewrite model, no syntax highlighter.

## Steps

1. [x] Extend `AskRequest` in `backend/main.py`.
   - Add `HistoryMessage` with `role: Literal["user", "assistant"]` and `content: str`.
   - Add `history: list[HistoryMessage] = []`.
   - Truncate to the last 6 messages before retrieval and generation.
   - Empty `question` still 400s.

2. [x] Update retrieval in `backend/retrieval.py`.
   - Add an optional `previous_question: str | None = None` argument to `retrieve_chunks`.
   - If provided, embed `f"{previous_question}\n{question}"`; otherwise embed `question` as today.
   - Leave `TOP_K` and `MAX_DISTANCE` unchanged.

3. [x] Update generation in `backend/answer.py`.
   - `generate_answer(question, chunks, history: list | None = None)`.
   - Map history into chat messages after the system prompt, then the current excerpts + question user message.
   - Do not send source excerpts or source metadata inside history.
   - `question_logs` still logs the current question and answer only.

4. [x] Extract `frontend/app/SourceCards.tsx`.
   - Move source card rendering, neighbor strip, expand/collapse, and Kaltura helpers out of `page.tsx`.
   - Props: `sources`, expanded-source / expanded-neighbor state or callbacks.

5. [x] Add `frontend/app/ChatThread.tsx`.
   - Render the list of turns (user text, assistant answer, `SourceCards`).
   - Assistant body: `react-markdown` with Tailwind mappings for `p`, `strong`, `em`, `ul`/`ol`/`li`, `code`, `pre`. User text stays plain.
   - Composer (textarea + Ask Sage); pin to the bottom once a thread exists.
   - New thread button; loading and error states.
   - Empty state can still show the page header area above the composer.

6. [x] Add `react-markdown` to `frontend/package.json`.
   - No `remark-gfm`, no syntax highlighter, no markdown CSS framework.
   - Confirm a sample answer with `**bold**`, a list, and a fenced Python block renders without raw `*` or triple backticks.

7. [x] Wire thread state in `frontend/app/page.tsx`.
   - Replace `result` with `turns: ThreadTurn[]`.
   - On submit, `POST /ask` with `{ question, history }` built from prior turns (`user`/`assistant` content only, including markdown markers in assistant text). Rendering is client-side.
   - Append the new turn on success.
   - New thread clears turns and embed expansion; do not refetch `/videos` or close the sidebar.
   - Keep sidebar, search, accordion, and `VideoModal` behavior unchanged.

8. [x] Smoke-test the follow-up path.
   - First question still returns sources and a watchable embed.
   - Follow-up "explain that" / "give a simpler version" is coherent with the previous answer.
   - A full new question in the same thread (topic change) still retrieves.
   - A coding answer shows a formatted code block, not backtick soup; a conceptual answer with `**term**` shows bold, not asterisks.
   - New thread and browser refresh both start empty.
   - Sidebar modal open/close does not wipe the thread.

## Implementation Notes
- First turn sends `history: []` so the existing `/ask` contract still works from curl/Swagger.
- Do not persist the thread. If it is gone on refresh, that is correct.
- Cap history on the server even if the client sends more.
- Do not stream. One JSON response per turn, same as today.
- Coding style: keep files small. The split is thread vs sidebar, not a component framework.
- History sent to `/ask` is the raw assistant string (with markdown markers). Rendering is client-side only.

## Output
A ChatGPT-like in-tab thread that can take a follow-up, retrieve with the previous user question in the embedding text, cite lecture video on the latest turn, and show assistant markdown as formatted text instead of raw asterisks.
