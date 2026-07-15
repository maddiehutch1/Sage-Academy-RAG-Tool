# Phase 4 Plan: Demo User Experience

Date: 2026-07-10

## Engineering Philosophy
**Avoid over-engineering, cruft, and legacy-compatibility features.**

This is a clean-start project with no existing users, no existing data, and no migration debt. Every layer of abstraction must earn its place. If a simpler approach works, use it. Delete code freely. Build for what's needed now, not for hypothetical future requirements.

## Goal
Create a simple, student-friendly interface that lets a user ask a question and see a grounded answer with a clear video reference.

## Checklist
- [x] Build a minimal question input form
- [x] Display the answer in a clear, readable format
- [x] Show the relevant video and timestamp or time range
- [x] Include a short explanation of why the selected section is relevant
- [x] Add basic loading, empty, and error states
- [ ] Make the interface simple enough for a live demo

## What Should Happen in This Phase
- Focus on clarity rather than visual polish.
- Keep the page layout simple with one main prompt and one result view.
- Wire the frontend to the backend answer endpoint.
- Present the answer and source metadata in an easy-to-scan format.
- Ensure the user can immediately understand where to look for the supporting content.

## Recommended Tools and Packages
- Next.js
- React
- TypeScript
- Tailwind CSS (optional but useful for fast styling)
- Axios or fetch for API calls
- Optional: shadcn/ui for fast, simple UI components

## Deliverables
- A working demo UI for asking questions and reading results
- A clear presentation of answer, video reference, and relevance explanation
