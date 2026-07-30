# MVP for v0.1

## Goal
Create a working prototype that helps students ask course-related questions and receive answers grounded in video transcripts, along with the relevant video and timestamp.

## Alignment with Other Docs
This MVP is the implementation boundary for v0.1. It should be read alongside [aiDocs/prd.md](prd.md) and [aiDocs/architecture.md](architecture.md) so the product scope, requirements, and technical plan stay aligned.

## Scope
- Ingest a set of course transcripts in SRT and DFXP/TTML formats, organized by course subfolder
- Split transcripts into meaningful chunks
- Generate embeddings and store them with metadata (including Kaltura video URL)
- Provide a simple web interface where a student can enter a question
- Return:
  - a concise answer
  - the most relevant video sections as source cards with course, title, and timestamp range
  - an embedded Kaltura video player inside each source card that starts playback at the exact cited timestamp, using the `embedPlaykitJs` iframe format with `kalturaSeekFrom`
  - a short excerpt from the transcript confirming why that section is relevant

## Video Library Sidebar (Phase 8 — in planning)
Following stakeholder feedback, the following browsing capability is being added to the MVP scope:
- A collapsible left-side sidebar listing every video in the database, grouped by course and sorted by sequence order
- A search/filter input at the top of the sidebar to quickly locate videos by title
- Clicking any video opens a floating modal with the embedded Kaltura player starting from the beginning
- The modal can be dismissed (× button, ESC key, or backdrop click) without disrupting the chat state
- Source card inline embed behavior in the chat is unchanged

## Out of Scope for v0.1
- full knowledge graph
- advanced personalization
- detailed analytics
- multi-tenant or enterprise features
- sidebar ↔ chat highlight sync (e.g. highlighting which video is currently open in a source card)
- playback position memory / "continue watching"
- video favorites or bookmarks

## Success Criteria
- The system can answer common student questions using course content
- It reliably points users to a relevant video section with a timestamp
- The embedded video player opens within the chatbot and begins at the cited moment
- The demo is understandable and easy to extend
