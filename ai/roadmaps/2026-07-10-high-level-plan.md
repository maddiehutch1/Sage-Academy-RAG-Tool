# Sage Academy RAG Tool High-Level Plan

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

## Milestones
- A clear MVP definition is agreed.
- Sample transcript data can be ingested and indexed.
- The system can answer a test question using course content.
- A simple web experience presents the answer and source reference.
- The prototype is ready to demo and iterate on.

## Expected Outcome
By the end of the plan, the team should have a working prototype that demonstrates the core product idea and provides a strong base for future improvements.
