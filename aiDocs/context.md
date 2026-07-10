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

## Alignment with the rest of the docs
- [aiDocs/mvp.md](mvp.md): defines the v0.1 scope, demo goals, and success criteria
- [aiDocs/prd.md](prd.md): defines the product requirements and target users
- [aiDocs/architecture.md](architecture.md): describes the implementation approach and technical structure
- [aiDocs/changelog.md](changelog.md): tracks changes as the project evolves

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
| [ai/roadmaps/2026-07-10-high-level-plan.md](../ai/roadmaps/2026-07-10-high-level-plan.md) | Main phased roadmap for implementation |
| [ai/roadmaps/2026-07-10-milestone-delivery-plan.md](../ai/roadmaps/2026-07-10-milestone-delivery-plan.md) | Ordered milestone-based delivery plan |
| [aiDocs/changelog.md](../aiDocs/changelog.md) | Log of changes as project progresses |