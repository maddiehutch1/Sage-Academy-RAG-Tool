# Phase 5 Plan: Validation and Refinement

Date: 2026-07-10

## Engineering Philosophy
**Avoid over-engineering, cruft, and legacy-compatibility features.**

This is a clean-start project with no existing users, no existing data, and no migration debt. Every layer of abstraction must earn its place. If a simpler approach works, use it. Delete code freely. Build for what's needed now, not for hypothetical future requirements.

## Goal
Test the prototype with realistic student questions and improve the retrieval, prompting, and source attribution quality where needed.

## Checklist
- [x] Run sample questions from the intended student use cases
- [ ] Review whether retrieved chunks are actually relevant
- [ ] Tune chunk size, overlap, and retrieval count if needed
- [ ] Improve prompt wording and answer brevity if the output is weak
- [ ] Fix obvious issues in the answer format or source metadata
- [ ] Document any gaps that should be addressed later

## What Should Happen in This Phase
- Focus on whether the system answers the right question in the right place.
- Use a small but representative set of prompts to find weak spots.
- Improve the quality of the answer and the relevance explanation without adding unnecessary abstraction.
- Capture the biggest issues to guide future iterations.

## Recommended Tools and Packages
- Python
- pytest for regression checks
- OpenAI API for quick iterative prompt testing
- PostgreSQL for inspecting stored metadata and chunks
- Optional: a simple CSV or JSON test set of sample questions

## Deliverables
- A more reliable prototype based on observed test results
- A short list of improvements to prioritize for the next iteration
