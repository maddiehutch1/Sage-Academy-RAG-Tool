# Phase 4 Roadmap: Demo User Experience

Date: 2026-07-10

## Steps
1. [x] Create a simple page layout with a question input and a response panel.
   - Tailwind CSS added to frontend. Single-page layout with centered max-w-2xl column.
2. [x] Connect the frontend to the backend answer endpoint.
   - fetch() POST to NEXT_PUBLIC_API_URL/ask. Enter key and button both submit.
3. [x] Display the answer, video reference, timestamp, and relevance explanation in a clear layout.
   - Answer card + source cards with course name, video title, MM:SS timestamp range, and excerpt.
4. [x] Add basic loading and error handling so the UI feels polished enough for a demo.
   - Spinner + "Thinking…" during request. Error banner on failure. Button disabled while loading.
5. [x] Review the experience from a student perspective and simplify any confusing parts.
   - UI reviewed and confirmed clean, no errors, source cards returning correct metadata. Ready for demo.

## Implementation Notes
- Favor a straightforward interface over elaborate visual design.
- Make the core result elements visible without scrolling or extra explanation.
- Keep the UI thin and let the backend carry the retrieval logic.

## Output
A simple, usable demo interface that presents the core product experience clearly.
