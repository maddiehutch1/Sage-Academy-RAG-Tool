# MVP for v0.1

## Goal
Create a working prototype that helps students ask course-related questions and receive answers grounded in video transcripts, along with the relevant video and timestamp.

## Scope
- Ingest a small set of course transcripts
- Split transcripts into meaningful chunks
- Generate embeddings and store them with metadata
- Provide a simple web interface where a student can enter a question
- Return:
  - a concise answer
  - the most relevant video
  - a timestamp or time range
  - a short explanation of why that section is relevant

## Out of Scope for v0.1
- full knowledge graph
- advanced personalization
- detailed analytics
- multi-tenant or enterprise features

## Success Criteria
- The system can answer common student questions using course content
- It reliably points users to a relevant video section
- The demo is understandable and easy to extend
