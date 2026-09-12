# Phase 3 Plan: Joint Validation

Date: 2026-09-11

See `ai/roadmaps/2026-09-11-phase-03-joint-validation-roadmap.md` for the step-by-step implementation roadmap.
See `ai/roadmaps/2026-09-11-high-level-plan-stage-2.md` Milestone 4 for how this phase sits in Stage 2.

## Engineering Philosophy
**Avoid over-engineering, cruft, and legacy-compatibility features.**

This is a clean-start project with no existing users, no existing data, and no migration debt. Every layer of abstraction must earn its place. If a simpler approach works, use it. Delete code freely. Build for what's needed now, not for hypothetical future requirements.

## Context
Phase 1 changes how coding/layout answers are written. Phase 2 changes the UI and `/ask` into a short in-tab thread and renders the markdown the model already returns. Students will use both together: ask for a Python example, then "now make it more generic," then watch a cited clip, then browse the sidebar. This phase proves that combined path and documents leftover gaps instead of silently expanding Stage 2.

## Goal
Walk the flows students will actually try and confirm the Stage 2 prototype can be demoed as a grounded course chat — dual examples, follow-ups, readable markdown, sources, and an intact video library — without regressing the MVP.

## Scope

### In scope
- End-to-end QA of Phase 1 + Phase 2 together.
- A written pass/fail record for the checklist below (eval report notes or a short section in the changelog when this phase closes).
- Document remaining gaps for a later iteration (do not implement them here).

### Out of scope
- New features, prompt rewrites beyond fixing a Phase 1/2 regression, extra models.
- Auth, persistence, course filter, streaming.
- Broad eval expansion beyond the coding/layout questions already added in Phase 1.

## Validation Checklist

Use the live UI (and `/ask` with history where noted). Phase 1 eval questions plus the original IS3600 set stay the automated baseline; this checklist is manual because follow-up + layout + markdown display is about behavior.

### Follow-up thread
- First question shows answer + source cards; composer stays available.
- Pronoun follow-up ("explain that", "what does that function do") is coherent with the previous turn.
- "Now give me a generic layout / example" in the same thread produces a dual example, not a copy of the lecture domain.
- A full topic change in the same thread (new standalone question) still retrieves relevant chunks.
- Empty / off-topic follow-up uses the existing soft no-content copy; earlier turns stay visible.
- New thread clears the messages and leaves the sidebar as it was.
- Browser refresh starts a new thread (empty). That is success, not a bug.

### Dual example (in the thread, not only eval)
- Coding or layout ask: lecture scenario is named, then a generic reusable example.
- Sources still include video + timestamp on that turn.
- A conceptual IS3600-style question in the same session does not sprout an unsolicited code sample.

### Markdown rendering
- A coding answer shows a formatted code block, not a wall of backticks.
- Bold and lists look like bold and lists; no leftover `**` or leading `*` in the visible text.
- User question text and source excerpts are still plain (not run through the markdown renderer).
- Soft no-content answers still read as muted plain copy.

### MVP surfaces that must not break
- Source card "Watch at MM:SS" seeks to the cited time.
- Neighbor "Also in this series" chips still appear and open at t=0.
- Sidebar lists all five courses; search filters; accordion restore-on-clear still works.
- Sidebar modal opens at t=0; ESC / × / backdrop close; chat thread is not wiped.
- Inline chat embeds and the sidebar modal still do not fight each other.

## Files expected to change
None required. Only change code in this phase if a checklist item fails because of a Phase 1 or Phase 2 bug. If a failure is actually new product scope, write it down under Remaining gaps instead.

## Remaining gaps (fill in when closing the phase)
Capture anything that is real but out of Stage 2, for example:
- Thread lost on refresh (by design; only note if students still find it painful).
- Course filter, auth, saved chats.
- Eval still thin outside IS3600 + a few Python questions.
- No syntax highlighting in code blocks (by design for Stage 2).

## Deliverables
- [ ] Checklist executed against the live prototype
- [ ] Automated eval still run (`python scripts/run_eval.py`)
- [ ] Remaining gaps written down
- [ ] High-level Stage 2 milestones 2–4 can be marked complete only after this pass
