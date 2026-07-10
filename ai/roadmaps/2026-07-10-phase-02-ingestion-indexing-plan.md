# Phase 2 Plan: Ingestion and Indexing Pipeline

Date: 2026-07-10

## Engineering Philosophy
**Avoid over-engineering, cruft, and legacy-compatibility features.**

This is a clean-start project with no existing users, no existing data, and no migration debt. Every layer of abstraction must earn its place. If a simpler approach works, use it. Delete code freely. Build for what's needed now, not for hypothetical future requirements.

## Goal
Turn raw transcript sources into structured, retrievable chunks with metadata so the system can later search and answer questions from course content.

## Checklist
- [ ] Define the initial transcript input formats to support
- [ ] Build or script a transcript ingestion flow from local files
- [ ] Normalize transcript text and preserve time metadata where available
- [ ] Create a chunking strategy for meaningful retrieval units
- [ ] Attach metadata such as course, video, timestamp range, and source reference
- [ ] Generate embeddings for each chunk and store them in the vector store
- [ ] Validate that indexed chunks can be retrieved for known sample questions

## What Should Happen in This Phase
- Decide whether the first version will ingest plain text, VTT/SRT transcripts, or a simple JSON structure.
- Implement ingestion logic that reads files from a local folder and converts them into a standardized record format.
- Break transcripts into chunk-sized text blocks with a reasonable overlap to preserve context.
- Store each chunk with metadata needed for later grounding and citation.
- Use an embedding model and vector database to make retrieval possible in the next phase.

## Recommended Tools and Packages
- Python
- FastAPI (if a service layer is introduced for indexing)
- OpenAI Embeddings API or a similar embedding provider
- PostgreSQL + pgvector
- Python packages:
  - openai
  - psycopg2 or SQLAlchemy
  - python-dotenv
  - pydantic
  - pytest
- Optional: tiktoken for token-aware chunk sizing

## Deliverables
- A repeatable ingestion workflow for sample transcripts
- A chunked and metadata-enriched index for initial course content
- A basic indexing pipeline that can be run locally
