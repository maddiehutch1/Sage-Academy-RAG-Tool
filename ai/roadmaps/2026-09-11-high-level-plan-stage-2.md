# Sage Academy RAG Tool — High-Level Stage 2 Plan

Date: 2026-09-11

## Engineering Philosophy
**Avoid over-engineering, cruft, and legacy-compatibility features.**

This is a clean-start project with no existing users, no existing data, and no migration debt. Every layer of abstraction must earn its place. If a simpler approach works, use it. Delete code freely. Build for what's needed now, not for hypothetical future requirements.

This is a follow-up to the MVP. This is "iteration 2" or Stage 2. Use these guidelines as a high-level map for implementing student feedback without turning the tool into a general chatbot.

## Overview
Stage 2 keeps the product a lightweight RAG study assistant: a student asks a course question and gets a grounded answer with video and timestamp citations. The MVP already proves that flow. Stage 2 only fixes three student complaints from using that prototype:

1. A new question wipes the previous one. Students want follow-ups in a ChatGPT-like thread.
2. Coding and layout answers copy the lecture's scenario (for example, random foods) instead of teaching a reusable pattern.
3. Answers show raw ChatGPT markdown (`**bold**`, `*lists*`, backticks) because the UI prints the string as plain text. Render that markdown so the response looks natural.

Park everything else. Auth, saved chats, course filters, extra models, and broad eval expansion as a standalone goal stay out of this iteration.

## Project Phases
1. Phase 0 — Framing and Scope (docs)
2. Phase 1 — Dual-Example Answers
3. Phase 2 — Follow-Up Thread
4. Phase 3 — Joint Validation

Phase plan and roadmap pairs:
- [Phase 1 plan](complete/2026-09-11-phase-01-dual-example-answers-plan.md) / [roadmap](complete/2026-09-11-phase-01-dual-example-answers-roadmap.md)
- [Phase 2 plan](complete/2026-09-11-phase-02-follow-up-thread-plan.md) / [roadmap](complete/2026-09-11-phase-02-follow-up-thread-roadmap.md)
- [Phase 3 plan](complete/2026-09-11-phase-03-joint-validation-plan.md) / [roadmap](complete/2026-09-11-phase-03-joint-validation-roadmap.md)

The completed MVP plan lives at [ai/roadmaps/complete/2026-07-10-high-level-plan-mvp.md](complete/2026-07-10-high-level-plan-mvp.md).

## Student Feedback
- Create a way for us to ask follow-up questions rather than type over the original question (similar to a ChatGPT-type layout).
- When user questions relate to providing an example of how to write Python or any form of code, or to help them write out a layout, it just gives examples from the videos or focuses too much on the scenario the code was based on (i.e., code to generate random foods). Would appreciate if it were more general layouts rather than just regurgitating code from the video.
- The response comes back with asterisks and other formatting from the OpenAI API. Take that markdown into account so the answer looks natural (bold, lists, and code as formatted text, not raw `*` and backticks).

## Locked Decisions
- **Vision:** still the [aiDocs/context.md](../../aiDocs/context.md) RAG study assistant. Not a general chatbot.
- **Code/layout answers:** dual example — briefly show what the lecture used, then a generic reusable version. Other questions stay tightly grounded. "Layout" includes code structure, viz/dashboard layout, and similar "show me how to set this up" asks — not only Python.
- **Follow-ups:** ChatGPT-like thread in the current tab. Last few turns go to the LLM. Retrieval combines the previous user question with the current one. Refresh starts a new thread. No login, no conversation table, no streaming, no query-rewrite model.
- **Answer markdown:** render assistant markdown in the Phase 2 thread UI. Do not strip markdown in the Phase 1 prompt (code examples need fences). Do not add a syntax highlighter or a markdown theme kit.
- **Dual-example trigger:** prompt instruction, not a separate intent classifier.
- **History cap:** last 4–6 messages is enough for a prototype.

## In Scope
- Dual-example prompt behavior for coding/layout questions, with sources still attached.
- A few coding/layout eval questions plus a manual checklist (keyword-only eval will not catch this).
- An in-tab message thread with a bottom composer and a New thread control.
- Render assistant-answer markdown in that thread (bold, lists, fenced code) so students do not see raw asterisks.
- Optional `history` on `POST /ask` so follow-ups like "explain that" work.
- Retrieval query text that concatenates the previous user question with the current question when history exists.
- A light frontend split when the follow-up UI makes `page.tsx` unwieldy.
- QA that covers follow-ups, dual examples, markdown rendering, topic change, empty retrieval, and sidebar/modal isolation.

## Out of Scope for Stage 2
- Accounts, auth, saved conversations, localStorage persistence
- Conversation tables / conversation IDs
- Streaming tokens, query-rewrite LLM, agents/tools
- Course filter, knowledge graph, personalization, analytics
- Answering from general knowledge when the corpus has nothing
- Broad eval expansion beyond the coding/layout questions needed to prove Phase 1
- Sidebar ↔ chat highlight sync (already parked in the MVP)
- Playback position memory, favorites, or bookmarks
- Syntax highlighting, GFM tables, mermaid, or a markdown CSS kit — render common markdown only

## Guiding Principles
- Build the smallest thing that proves the student feedback.
- Stay a grounded course Q&A tool that points at videos.
- Do not add a second model, a session store, or ChatGPT product features.
- Each milestone should produce a working increment that can be tested before the next step.

## Milestone-Based Delivery Plan

### Milestone 1 — Frame Stage 2 Scope ✅
**Goal**: Lock Stage 2 to the student requests and write the planning docs.

**Tasks**
- [x] Confirm the student feedback items (follow-up thread, dual examples, rendered markdown)
- [x] Lock the follow-up conversation model (in-tab thread, thin history, no persistence)
- [x] Lock the dual-example answer policy
- [x] Lock markdown rendering in the Phase 2 answer UI (do not strip it in the prompt)
- [x] Write down what is intentionally out of scope
- [x] Expand this high-level plan
- [x] Add Stage 2 notes to `aiDocs/context.md`, `aiDocs/prd.md`, and `aiDocs/mvp.md`
- [x] Write Phase 1–3 plan and roadmap pairs

**Exit criteria**
- Later work cannot treat saved chats, accounts, or ungrounded codegen as in-vision
- Each build phase has a plan and a roadmap that reference this file

### Milestone 2 — Dual-Example Answers ✅
**Goal**: Coding and layout answers teach a reusable pattern without dropping the lecture citation.

**Tasks**
- [x] Update the system prompt in `backend/answer.py`
- [x] Keep `scripts/run_eval.py` on the same prompt (import it; do not keep a second copy)
- [x] Add a few DATA2100 Python / layout eval questions
- [x] Add a short manual checklist for dual-example quality
- [x] Confirm non-coding answers are unchanged in tone and grounding

**Exit criteria**
- A coding/layout question names the lecture scenario, then gives a generic example that is not that domain
- Sources still include video and timestamp
- Conceptual questions (existing IS3600 eval set) still look grounded

See [Phase 1 plan](complete/2026-09-11-phase-01-dual-example-answers-plan.md) and [roadmap](complete/2026-09-11-phase-01-dual-example-answers-roadmap.md).

### Milestone 3 — Follow-Up Thread ✅
**Goal**: Students can ask a follow-up without typing over the original question.

**Tasks**
- [x] Render a message thread with per-turn source cards and a bottom composer
- [x] Render assistant markdown (bold, lists, fenced code) so asterisks and backticks are not shown raw
- [x] Add a New thread control; keep state in the tab only
- [x] Accept optional `history` on `POST /ask` and pass it into answer generation
- [x] When history exists, retrieve using previous user question + current question
- [x] Split `page.tsx` lightly (thread vs sidebar) instead of growing one file
- [x] Leave sidebar and Kaltura modal behavior unchanged

**Exit criteria**
- Prior Q&A stays visible after a follow-up
- "Explain that" resolves against the previous turn
- Assistant answers look like formatted text, not raw `**` / `*` / backticks
- Refresh starts a new thread
- Source cards and neighbor chips still work on each turn

See [Phase 2 plan](complete/2026-09-11-phase-02-follow-up-thread-plan.md) and [roadmap](complete/2026-09-11-phase-02-follow-up-thread-roadmap.md).

### Milestone 4 — Joint Validation ✅
**Goal**: Prove both Stage 2 changes together without regressing the MVP demo.

**Tasks**
- [x] Walk pronoun follow-ups, generic-layout follow-ups, markdown rendering, and in-thread topic changes
- [x] Confirm empty retrieval, New thread, and refresh behavior
- [x] Confirm sidebar and modal stay isolated from chat state
- [x] Document remaining gaps for a later iteration

**Exit criteria**
- The Stage 2 prototype can be demoed as a grounded course chat, not a general assistant
- Known gaps are written down instead of silently expanding scope

See [Phase 3 plan](complete/2026-09-11-phase-03-joint-validation-plan.md) and [roadmap](complete/2026-09-11-phase-03-joint-validation-roadmap.md).

## Expected Outcome
By the end of Stage 2, a student can keep a short study thread in the current tab, read answers as formatted text (not raw markdown), and get coding/layout help that is still cited to lecture video, with a generic example they can reuse. The product remains a RAG prototype.
