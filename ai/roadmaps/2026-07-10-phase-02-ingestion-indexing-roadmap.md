# Phase 2 Roadmap: Ingestion and Indexing Pipeline

Date: 2026-07-10

## Steps
1. Choose the first transcript format to support and define a minimal schema for incoming records.
2. Create an ingestion script or service that loads transcript files from a local input folder.
3. Normalize text, remove obvious formatting noise, and preserve timestamp boundaries when present.
4. Define chunk size and overlap values that balance recall and prompt size.
5. Store each chunk as a structured record with metadata such as course, video, start/end time, and source path.
6. Generate embeddings for each chunk using the selected embedding provider.
7. Insert chunk records and vectors into PostgreSQL with pgvector.
8. Run a small validation set of known questions to confirm the index is usable.

## Implementation Notes
- Keep the ingestion path simple and deterministic.
- Favor a single ingestion script or service for v0.1 rather than a full pipeline framework.
- Ensure metadata is preserved because it will be used for citations in later phases.

## Output
A searchable knowledge index made from course transcript chunks, ready for retrieval and answer generation.
