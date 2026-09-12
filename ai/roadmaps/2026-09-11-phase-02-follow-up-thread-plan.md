# Phase 2 Plan: Follow-Up Thread

Date: 2026-09-11

See `ai/roadmaps/2026-09-11-phase-02-follow-up-thread-roadmap.md` for the step-by-step implementation roadmap.
See `ai/roadmaps/2026-09-11-high-level-plan-stage-2.md` Milestone 3 for how this phase sits in Stage 2.

## Engineering Philosophy
**Avoid over-engineering, cruft, and legacy-compatibility features.**

This is a clean-start project with no existing users, no existing data, and no migration debt. Every layer of abstraction must earn its place. If a simpler approach works, use it. Delete code freely. Build for what's needed now, not for hypothetical future requirements.

## Context
The MVP UI is one textarea and one result. Submitting a new question clears the previous answer (`setResult(null)` in `frontend/app/page.tsx`). `/ask` accepts a single `question` string. Students asked for follow-ups in a ChatGPT-like layout so they do not type over the original.

They also said answers come back "weird" with asterisks and other OpenAI markdown. The UI currently dumps `result.answer` into a `whitespace-pre-wrap` paragraph, so `**bold**`, `* lists`, and fenced code show as raw characters. This phase is where the answer is shown to the student, so it also renders that markdown.

Stage 2 stays inside the [aiDocs/context.md](../../aiDocs/context.md) vision: a grounded study assistant, not accounts, not saved chats, not a rewrite model.

## Goal
A student can keep a short study thread in the current tab, ask follow-ups like "explain that," and still get a grounded answer with per-turn source cards. Assistant markdown renders as normal formatted text. Refresh or New thread starts over.

## Scope

### In scope
- Visible message thread (user + assistant + sources on each assistant turn).
- Composer at the bottom after the first turn; **New thread** resets tab state.
- Render assistant-answer markdown so bold, lists, and fenced code look natural (no raw `*` / backticks).
- Optional `history` on `POST /ask`: last few `{role, content}` pairs. No source cards in the payload.
- `generate_answer` includes those turns so pronouns and "that" resolve.
- When history exists, `retrieve_chunks` embeds `previous user question + current question`.
- `question_logs` continues to log the current turn only.
- Light split of `frontend/app/page.tsx` (thread vs sidebar). The file is already ~685 lines; Phase 8 said not to extract until unwieldy. This phase is that moment.

### Out of scope
- localStorage, saved conversations, conversation IDs, auth
- Streaming tokens
- Query-rewrite LLM or a second retrieval pass
- Dual-example prompt work (Phase 1) except to keep using whatever prompt is already in `answer.py`
- Stripping markdown from the model (Phase 1 must not add a "plain text only" rule)
- Syntax highlighting, remark-gfm tables, mermaid, or a markdown theme kit
- Markdown in user questions or transcript excerpts (those stay plain text)
- Sidebar ↔ chat highlight sync
- Changing Kaltura embed, neighbor chips, or `GET /videos`

## API Design

Keep `POST /ask`. Add optional history. Cap on the server so a large client payload cannot explode the prompt.

```json
{
  "question": "string",
  "history": [
    { "role": "user", "content": "string" },
    { "role": "assistant", "content": "string" }
  ]
}
```

- `history` defaults to `[]`.
- Each item: `role` is `"user"` or `"assistant"`; `content` is plain text only.
- Server keeps at most the last 6 messages (3 exchanges). Drop older ones.
- Response shape stays `{ "answer": str, "sources": [...] }`. Sources still belong to this turn only.

### Retrieval
If `history` has a previous user message, embed:

```
{last_user_question}
{current_question}
```

Otherwise embed `question` only. Same `TOP_K` and `MAX_DISTANCE`. No rewrite call.

### Generation
Build the chat messages as: system prompt, then truncated history as chat turns, then the current user message with transcript excerpts + current question (same wrapping as today). Do not put source excerpts into `history`.

## Frontend Design

### Thread state (tab only)
Replace single `result` with a list of turns, for example:

```ts
interface ThreadTurn {
  question: string;
  answer: string;
  sources: Source[];
}
```

- Submit appends a pending turn, then fills answer + sources.
- Composer clears after send; prior turns stay on screen.
- **New thread** sets the list to `[]` and clears error/expanded-video state. Does not reload the sidebar.
- Refresh starts a new thread because nothing is persisted.

### Layout
- Empty state: current header + composer (centered is fine).
- After the first answer: ChatGPT-like column — scrollable messages, composer pinned at the bottom of the main pane.
- Each assistant turn keeps the existing source cards (Watch at timestamp, neighbor strip). Expand/collapse is per turn so one open embed does not fight another turn's cards.

### Assistant markdown
The model already returns CommonMark (`**bold**`, `*italic*`, lists, `` `code` ``, fenced ``` blocks). Render that in the assistant bubble only.

- Use `react-markdown`. That one dependency earns its place: a hand-rolled parser would mishandle fences and is more cruft.
- Map elements to existing Tailwind (`text-sm`, `font-semibold`, `list-disc`, a muted `pre`/`code` background). Do not add a highlight.js / Prism package.
- `react-markdown` does not render raw HTML by default; keep that default.
- User turns and source-card excerpts stay `whitespace-pre-wrap` plain text.

### Light file split
Do not add a `components/` folder tree or a state library.

| File | Responsibility |
| --- | --- |
| `frontend/app/page.tsx` | Shell: sidebar, modal, library fetch, thread state, `/ask` calls |
| `frontend/app/ChatThread.tsx` | Message list, composer, New thread, loading/error; assistant body via markdown |
| `frontend/app/SourceCards.tsx` | Source cards + neighbor strip + inline Kaltura (moved off `page.tsx`) |

Keep `parseKalturaUrl` / `buildKalturaIframeSrc` next to the embed (SourceCards or a tiny helper in the same folder). Sidebar and `VideoModal` may stay in `page.tsx` unless the shell is still too large after the split.

One new npm package: `react-markdown`. No others.

## Files expected to change

| File | Change |
| --- | --- |
| `backend/main.py` | `HistoryMessage` model; optional `history` on `AskRequest`; pass previous user question into retrieval; pass history into `generate_answer`; cap length |
| `backend/retrieval.py` | Optional previous-question concat before embed |
| `backend/answer.py` | `generate_answer(question, chunks, history=())` includes history turns |
| `frontend/app/page.tsx` | Thread state; wire history into `/ask`; keep sidebar/modal |
| `frontend/app/ChatThread.tsx` | New; render assistant markdown with `react-markdown` |
| `frontend/app/SourceCards.tsx` | New (moved from `page.tsx`) |
| `frontend/package.json` | Add `react-markdown` only |

No schema changes. No new tables.

## Assumptions
- Phase 1 prompt may already be in `answer.py` when this ships; this phase does not rewrite it and does not strip markdown.
- Six history messages is enough for a prototype. Do not add summarization.
- Empty retrieval still returns the existing soft no-content answer with `sources: []` for that turn; earlier turns stay visible.
- `react-markdown` is the only new frontend dependency. If a dual-example answer uses fences, they must look like a code block, not a wall of backticks.

## Deliverables
- [x] `/ask` accepts optional history and uses it for generation
- [x] Follow-up retrieval concatenates the previous user question
- [x] In-tab thread UI with New thread
- [x] Assistant markdown rendered (bold, lists, fenced code; no raw asterisks)
- [x] Light frontend split
- [x] Sidebar and modal still work with a live thread
