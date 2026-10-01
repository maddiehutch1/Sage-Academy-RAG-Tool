# Sage Academy RAG Tool Vision
For v0.1, the Sage Academy RAG Tool is a lightweight student-facing question-answering prototype. It helps students ask questions about course content and receive grounded answers based on video transcripts, with a clear reference to the relevant video section and timestamp.

The planned v0.1 flow is:
1. Ingest a small set of course transcripts.
2. Split the transcripts into meaningful chunks and preserve metadata such as course, video, and timestamp range.
3. Generate embeddings for the chunks and store them in a vector-enabled database.
4. Accept a student question through a simple web interface.
5. Embed the question and retrieve the most relevant transcript chunks.
6. Pass the retrieved context to an LLM to generate a concise answer and return source references.

To keep the first release practical, the team should focus on the MVP experience:
- Embedding model or API
- Vector database
- Web application for question answering

This is a RAG prototype, not a full-scale knowledge platform. It is not necessary to implement the most robust or highest-scale solution yet. Functionality and time-to-test are the priority. The main goal is to show that the tool can answer common questions using curriculum content and point students to the right video section.

## Stage 2 (iteration 2)
Stage 2 does not change that vision. It is still a grounded course Q&A prototype with video and timestamp citations — not a general chatbot, not ChatGPT with a course corpus glued on.

Student feedback after the MVP asked for three things only:
- Follow-up questions in a ChatGPT-like thread, instead of typing over the original question.
- Coding and layout answers that briefly name the lecture's scenario, then give a generic reusable example.
- Assistant answers rendered as normal formatted text, not raw markdown asterisks and backticks from the OpenAI API.

Stay inside that boundary:
- Follow-ups live in the current browser tab. Refresh starts a new thread. No accounts, no saved conversations, no conversation table.
- History is a short list of prior user/assistant text sent with `/ask` so "explain that" works. Retrieval concatenates the previous user question with the current one. No query-rewrite model, no streaming.
- Dual-example behavior is a prompt instruction, not a classifier or a second model. Other questions stay tightly grounded in the transcripts.
- Keep markdown in model output (code fences, lists, bold). The Phase 2 thread UI renders it. Do not strip formatting in the prompt, and do not add a syntax highlighter.
- If the corpus has nothing relevant, say so. Do not answer from general knowledge.

Planning docs: [ai/roadmaps/2026-09-11-high-level-plan-stage-2.md](../ai/roadmaps/2026-09-11-high-level-plan-stage-2.md).

## Stage 3 (iteration 3)
Stage 3 does not change that vision. It is still a grounded course Q&A prototype with video and timestamp citations. One additional course may live on YouTube instead of Kaltura.

Stay inside that boundary:
- Offline helper writes SRT + JSON sidecars from a playlist; existing ingest indexes them.
- `source_url` may be a Kaltura preview URL or a YouTube watch URL. The player sniffs the host. No playlist table, no provider column.
- No Whisper, no YouTube API in `/ask`, no nightly playlist sync.

Playlist URL and course name are operator inputs at implementation time. Planning docs: [ai/roadmaps/2026-09-12-high-level-plan-stage-3.md](../ai/roadmaps/2026-09-12-high-level-plan-stage-3.md).

## Stage 4 (iteration 4)
Stage 4 keeps Sage as the same grounded course Q&A tool and adds a user-requested appearance preference.

- Follow the operating system's color preference by default; offer System, Light, and Dark.
- A gear in the upper-right app controls opens the Appearance menu in both empty chat and active thread.
- Remember the selected preference in the current browser. Do not add accounts, server-side storage, or cross-device sync.
- Keep the feature frontend-only and preserve chat, retrieval, and embedded video behavior.

Planning docs: [Stage 4 plan](../ai/roadmaps/2026-09-30-high-level-plan-stage-4.md), [Phase 1 plan](../ai/roadmaps/2026-09-30-phase-01-dark-mode-plan.md), and [roadmap](../ai/roadmaps/2026-09-30-phase-01-dark-mode-roadmap.md).

## Alignment with the rest of the docs
- [aiDocs/mvp.md](mvp.md): defines the v0.1 scope, demo goals, and success criteria, plus Stage 2–4 increments
- [aiDocs/prd.md](prd.md): defines the product requirements and target users
- [aiDocs/architecture.md](architecture.md): describes the implementation approach and technical structure
- [aiDocs/changelog.md](changelog.md): tracks changes as the project evolves
- [ai/roadmaps/complete/2026-07-10-high-level-plan-mvp.md](../ai/roadmaps/complete/2026-07-10-high-level-plan-mvp.md): completed v0.1 phased plan
- [ai/roadmaps/2026-09-11-high-level-plan-stage-2.md](../ai/roadmaps/2026-09-11-high-level-plan-stage-2.md): Stage 2 phased plan
- [ai/roadmaps/2026-09-12-high-level-plan-stage-3.md](../ai/roadmaps/2026-09-12-high-level-plan-stage-3.md): Stage 3 phased plan
- [ai/roadmaps/2026-09-30-high-level-plan-stage-4.md](../ai/roadmaps/2026-09-30-high-level-plan-stage-4.md): Stage 4 phased plan (appearance preferences)

## Behavior
Whenever creating plan docs and roadmap docs, always save them in ai/roadmaps. Prefix the name with the date. Add a note that we need to avoid over-engineering, cruft, and legacy-compatibility features in this clean code project. Make sure they reference each other.

Whenever finishing with implementing a plan / roadmap doc pair, make sure the roadmap is up to date (tasks checked off, etc). Then save the docs to ai/roadmaps/complete. Then update aiDocs/changelog.md accordingly.

## Coding Style

* Keep files small and single-responsibility. One screen per file.
* No over-engineering, no premature abstractions, no legacy-compatibility shims.
* Avoid adding dependencies unless necessary — check [aiDocs/architecture.md](architecture.md) first.

## Project File Reference
| File Path | Purpose |
| --- | --- |
| [aiDocs/context.md](context.md) | Core product vision and initial system description |
| [aiDocs/mvp.md](mvp.md) | Defines the v0.1 scope and success criteria |
| [aiDocs/prd.md](prd.md) | Captures product requirements and expectations |
| [aiDocs/architecture.md](architecture.md) | Describes the recommended stack, architecture, and data flow |
| [ai/roadmaps/complete/2026-07-10-high-level-plan-mvp.md](../ai/roadmaps/complete/2026-07-10-high-level-plan-mvp.md) | Completed v0.1 phased plan |
| [ai/roadmaps/2026-09-11-high-level-plan-stage-2.md](../ai/roadmaps/2026-09-11-high-level-plan-stage-2.md) | Stage 2 phased plan |
| [ai/roadmaps/2026-09-12-high-level-plan-stage-3.md](../ai/roadmaps/2026-09-12-high-level-plan-stage-3.md) | Stage 3 phased plan (YouTube playlist ingest) |
| [ai/roadmaps/2026-09-30-high-level-plan-stage-4.md](../ai/roadmaps/2026-09-30-high-level-plan-stage-4.md) | Stage 4 phased plan (dark mode and appearance settings) |
| [aiDocs/changelog.md](changelog.md) | Log of changes as project progresses |