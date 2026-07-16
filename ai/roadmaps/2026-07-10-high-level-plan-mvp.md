# Sage Academy RAG Tool — High-Level MVP Plan

Date: 2026-07-10

## Engineering Philosophy
**Avoid over-engineering, cruft, and legacy-compatibility features.**

This is a clean-start project with no existing users, no existing data, and no migration debt. Every layer of abstraction must earn its place. If a simpler approach works, use it. Delete code freely. Build for what's needed now, not for hypothetical future requirements.

## Overview
This plan organizes the v0.1 build into a staged roadmap so the team can move from concept to a working prototype without overbuilding early. The focus is to prove the core experience first: a student asks a question, the system retrieves relevant course content, and the system returns a grounded answer with source references.

## Project Phases
1. Phase 0 - Product Framing and Scope
2. Phase 1 - Foundation and Data Setup
3. Phase 2 - Ingestion and Indexing Pipeline
4. Phase 3 - Retrieval and Answer Generation Core
5. Phase 4 - Demo User Experience
6. Phase 5 - Validation and Refinement
7. Phase 6 - Demo Readiness and Extensibility

## Guiding Principles
- Build the smallest thing that proves the value.
- Keep the first version easy to understand and extend.
- Make retrieval and source attribution visible from the start.
- Delay advanced features until the core flow works reliably.

## Milestone-Based Delivery Plan
The project should be built in short, verifiable milestones. Each milestone should produce a working increment that can be tested and reviewed before moving to the next step.

### Milestone 1 — Define the MVP and Scope ✅
**Goal**: Lock the product direction and confirm what v0.1 must do.

**Tasks**
- [x] Confirm the core student use case
- [x] Define the expected answer contract
- [x] Select the first course or transcript set for the prototype
- [x] Write down what is intentionally out of scope

**Exit criteria**
- The team agrees on the first usable end-to-end experience
- The MVP is narrow enough to build quickly

### Milestone 2 — Set Up the Project Foundation ✅
**Goal**: Create the project skeleton and establish the basic technical environment.

**Tasks**
- [x] Choose the frontend, backend, and database stack
- [x] Create the repository structure
- [x] Set up environment variables and local configuration patterns
- [x] Define the initial data model for courses, videos, and chunks

**Exit criteria**
- The project can be opened and run locally in a basic form
- The key folders and services are in place

### Milestone 3 — Build the Ingestion and Indexing Pipeline ✅
**Goal**: Turn transcript content into indexed chunks with metadata.

**Tasks**
- [x] Support the first transcript input format
- [x] Implement transcript ingestion from local files
- [x] Normalize the transcript content and preserve timing data
- [x] Chunk the transcript into meaningful retrieval units
- [x] Attach metadata to each chunk
- [x] Generate embeddings and store them in PostgreSQL with pgvector

**Exit criteria**
- At least one transcript can be ingested and indexed successfully
- Chunks can be retrieved from storage with metadata intact

### Milestone 4 — Implement Retrieval and Answer Generation ✅
**Goal**: Make the system answer questions using the indexed content.

**Tasks**
- [x] Embed the user question using the same model as the index
- [x] Implement similarity search against indexed chunks
- [x] Select the top-k chunk set for each answer
- [x] Create a prompt template with retrieved context and the question
- [x] Connect the answer flow to the LLM API
- [x] Return the answer plus source video and timestamp metadata

**Exit criteria**
- A sample question returns a grounded answer with supporting context
- The system can point to a relevant part of the transcript/video

### Milestone 5 — Build the Demo UI ✅
**Goal**: Expose the core product experience to a user in a simple interface.

**Tasks**
- [x] Create a basic question input page
- [x] Display the answer in the UI
- [x] Show the relevant video reference and timestamp
- [x] Add simple loading and error handling
- [x] Keep the layout clear enough for a live demo

**Exit criteria**
- A user can ask a question and see a result from the backend
- The UI clearly communicates the answer and its source reference

### Milestone 6 — Validate and Tune the Prototype ✅
**Goal**: Test the experience with realistic questions and improve weak areas.

**Tasks**
- [x] Run representative student questions against the system
- [x] Check whether retrieval is selecting the correct evidence
- [x] Adjust chunking, overlap, prompt wording, or retrieval count as needed
- [x] Improve answer clarity and citation quality

**Exit criteria**
- The prototype performs well enough to be shown convincingly
- The main quality issues are either fixed or documented

### Milestone 7 — Prepare for Demo and Handoff ✅
**Goal**: Leave the project in a demo-ready state that others can understand and extend.

**Tasks**
- [x] Add clear setup instructions
- [x] Document the architecture and core workflow
- [x] Clean up obvious rough edges and dead code
- [x] Note what should be improved in future versions

**Exit criteria**
- The project is understandable to a new contributor
- The demo can be run and explained without confusion

## Expected Outcome
By the end of the plan, the team should have a working prototype that demonstrates the core product idea and provides a strong base for future improvements.
