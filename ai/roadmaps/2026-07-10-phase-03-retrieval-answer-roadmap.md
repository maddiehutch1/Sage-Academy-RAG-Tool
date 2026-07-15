# Phase 3 Roadmap: Retrieval and Answer Generation Core

Date: 2026-07-10

## Steps
1. [x] Confirm the embedding model and vector search strategy that will be used for both chunks and questions.
   - Same model as ingestion: text-embedding-3-small via OpenAI. Cosine similarity (<=> operator) in pgvector.
2. [x] Create a retrieval service that embeds the user question and searches the chunk index.
   - backend/retrieval.py: retrieve_chunks(question, top_k) returns ranked chunk dicts with metadata.
3. [x] Choose a small top-k retrieval count for v0.1, such as 3 to 5 chunks.
   - top_k=5 (configurable per call).
4. [x] Build a prompt template that includes the retrieved context and the original question.
   - backend/answer.py: _format_context() labels each source with course, video, and approximate timestamp.
5. [x] Connect the retrieval path to the LLM API and return a concise answer.
   - gpt-4o-mini via chat completions. temperature=0.2 for consistent, grounded output.
6. [x] Add metadata to the response for the recommended video and timestamp range.
   - AskResponse includes sources list: course, video, chunk_index, start_time, end_time, excerpt.
7. [ ] Run sample questions and inspect whether the output is grounded and relevant.

## Implementation Notes
- Keep the retrieval logic straightforward rather than introducing multiple ranking layers too early.
- Make the prompt simple and explicit about source grounding.
- Preserve metadata in the response so the UI can display the citation clearly.

## Output
A functional question-answering layer that uses the indexed transcript content as evidence.
