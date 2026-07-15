# Phase 2 Roadmap: Ingestion and Indexing Pipeline

Date: 2026-07-10

## Steps
1. [x] Choose the first transcript format to support and define a minimal schema for incoming records.
   - SRT (SubRip) format. Each .srt file is paired with a .json sidecar for course/video metadata. See data/transcripts/.
2. [x] Create an ingestion script or service that loads transcript files from a local input folder.
   - scripts/ingest.py reads all .srt files from data/transcripts/, with metadata from companion .json sidecars.
3. [x] Normalize text, remove obvious formatting noise, and preserve timestamp boundaries when present.
   - Speaker labels stripped. start_time and end_time (seconds) populated from SRT timestamps per chunk.
4. [x] Define chunk size and overlap values that balance recall and prompt size.
   - 400 tokens per chunk, 5 SRT entry overlap between chunks, using cl100k_base encoding via tiktoken.
5. [x] Store each chunk as a structured record with metadata such as course, video, start/end time, and source path.
   - Stored in transcript_chunks with video_id, chunk_index, chunk_text, and embedding.
6. [x] Generate embeddings for each chunk using the selected embedding provider.
   - OpenAI text-embedding-3-small (1536 dimensions).
7. [x] Insert chunk records and vectors into PostgreSQL with pgvector.
   - Vectors stored as vector(1536); re-runs are idempotent (existing chunks deleted before re-insert).
8. [ ] Run a small validation set of known questions to confirm the index is usable.
   - scripts/validate_index.py ready to run after ingest.

## Implementation Notes
- Keep the ingestion path simple and deterministic.
- Favor a single ingestion script or service for v0.1 rather than a full pipeline framework.
- Ensure metadata is preserved because it will be used for citations in later phases.

## Output
A searchable knowledge index made from course transcript chunks, ready for retrieval and answer generation.
