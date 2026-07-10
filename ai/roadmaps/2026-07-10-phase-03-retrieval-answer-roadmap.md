# Phase 3 Roadmap: Retrieval and Answer Generation Core

Date: 2026-07-10

## Steps
1. Confirm the embedding model and vector search strategy that will be used for both chunks and questions.
2. Create a retrieval service that embeds the user question and searches the chunk index.
3. Choose a small top-k retrieval count for v0.1, such as 3 to 5 chunks.
4. Build a prompt template that includes the retrieved context and the original question.
5. Connect the retrieval path to the LLM API and return a concise answer.
6. Add metadata to the response for the recommended video and timestamp range.
7. Run sample questions and inspect whether the output is grounded and relevant.

## Implementation Notes
- Keep the retrieval logic straightforward rather than introducing multiple ranking layers too early.
- Make the prompt simple and explicit about source grounding.
- Preserve metadata in the response so the UI can display the citation clearly.

## Output
A functional question-answering layer that uses the indexed transcript content as evidence.
