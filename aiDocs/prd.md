# Product Requirements Document (v0.1)

## Product Overview
Sage Academy RAG Tool is a study assistant for students in data analytics and information systems courses. It helps users find the most relevant course video content and receive answers grounded in that curriculum.

These requirements support the v0.1 MVP described in [aiDocs/mvp.md](mvp.md) and the implementation approach in [aiDocs/architecture.md](architecture.md).

## Target Users
- Freshmen or first year students in data analytics, information systems, and related courses
- Instructors or teaching assistants who want a searchable study aid

## Key Features
- Natural-language question answering
- Retrieval of relevant transcript chunks from course videos
- Return of the matching video and timestamp
- Clear source attribution so students can jump to the right place in the video
- Simple web experience for asking questions and reviewing results

## Functional Requirements
- Support transcript ingestion from common formats
- Chunk transcripts into searchable units
- Store embeddings with video, course, and timestamp metadata
- Retrieve the most relevant content for a student question
- Generate an answer using the retrieved context
- Display source references in the response

## Non-Functional Requirements
- Simple enough to build and demo quickly
- Easy for future students to extend
- Reasonable performance for a prototype experience

## Success Metrics
- Students can find relevant video content for common course questions
- Answers include useful source references
- The prototype is clear enough to demonstrate value in a short demo

## Stage 2 Requirements
Stage 2 is an increment on v0.1, not a new product. Requirements below support [aiDocs/mvp.md](mvp.md) and [ai/roadmaps/2026-09-11-high-level-plan-stage-2.md](../ai/roadmaps/2026-09-11-high-level-plan-stage-2.md).

### Added features
- In-tab follow-up thread so a student can ask another question without losing the previous answer
- Dual-example answers for coding, structure, and layout questions: name what the lecture demonstrated, then give a generic reusable version, still cited to video/timestamp
- Assistant answers displayed as formatted markdown (bold, lists, code blocks) instead of raw asterisks and backticks

### Added functional requirements
- Keep prior turns visible in the current tab until the student starts a new thread or refreshes
- Send a short history of user/assistant text with the next `/ask` so follow-ups like "explain that" work
- Retrieve follow-ups using the previous user question plus the current question
- When the question is about writing code or a layout, answer in two parts (lecture scenario, then generic example) without dropping source attribution
- Render markdown in the assistant answer pane; leave user questions and transcript excerpts as plain text

### Stage 2 does not add
- User accounts, saved conversations, or server-side session storage
- Un-grounded general-knowledge answers, a coding copilot, or a ChatGPT clone
- Course filters, analytics, personalization, or authentication

## Stage 3 Requirements
Stage 3 is an increment on v0.1 + Stage 2, not a new product. Requirements below support [aiDocs/mvp.md](mvp.md) and [ai/roadmaps/2026-09-12-high-level-plan-stage-3.md](../ai/roadmaps/2026-09-12-high-level-plan-stage-3.md).

### Added features
- Offline helper that turns a YouTube playlist into SRT transcripts + JSON sidecars in a course folder
- In-chat and sidebar playback for YouTube `source_url` values, seeking to the cited timestamp
- Same grounded Q&A and source cards for that course as for Kaltura courses

### Added functional requirements
- Prepare playlist videos on disk (captions + sidecar metadata + watch URL + playlist order)
- Ingest those files with the existing SRT pipeline (no new chunk format)
- When `source_url` is YouTube, embed `youtube.com/embed/<id>?start=<seconds>` and offer an "Open on YouTube" watch link
- Leave Kaltura `embedPlaykitJs` / `kalturaSeekFrom` behavior unchanged

### Stage 3 does not add
- A playlist table, a video-provider column, or a second ingest pipeline
- Speech-to-text when a video has no captions
- Live YouTube API calls from the web app
- Nightly playlist sync, or re-hosting YouTube videos in Kaltura

## Stage 4 Requirements
Stage 4 is a focused appearance increment on v0.1 + Stages 2–3, not a new product. Requirements below support [aiDocs/mvp.md](mvp.md) and [ai/roadmaps/2026-09-30-high-level-plan-stage-4.md](../ai/roadmaps/2026-09-30-high-level-plan-stage-4.md).

### Added features
- System-aware Light/Dark appearance with an explicit user preference
- Upper-right gear control that opens a compact Appearance menu

### Added functional requirements
- Provide System, Light, and Dark choices; System is the first-visit default and follows operating-system changes
- Persist the selected mode locally in the user's browser, without an account or server-side preference
- Keep the control available in empty-chat and active-thread layouts
- Apply the selected theme consistently to Sage-owned UI while leaving embedded video players unchanged

### Stage 4 does not add
- User accounts, backend storage, or cross-device preference sync
- A general settings page or unrelated settings
- Changes to chat, retrieval, transcript, or video playback behavior
