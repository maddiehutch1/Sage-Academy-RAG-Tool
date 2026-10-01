# Sage Academy RAG Tool — High-Level Stage 4 Plan

Date: 2026-09-30

## Engineering Philosophy
**Avoid over-engineering, cruft, and legacy-compatibility features.**

This is a focused student-requested appearance improvement to the existing Sage Tool. Keep the work limited to the frontend theme, preference control, and visual QA. Do not turn one appearance setting into a general settings platform.

## Overview
Stage 4 adds dark mode to the existing grounded course Q&A experience without changing its content, retrieval, or video behavior. The app follows the operating system's color preference by default. A persistent Appearance menu lets a user select System, Light, or Dark.

This is a presentation-only increment, not a new product or an account feature. The preference is stored locally in the user's browser and is not synchronized across devices.

## Project Phases
1. Phase 0 — Framing and Scope (complete)
2. Phase 1 — Dark Mode and Appearance Settings

Phase plan and roadmap pair:
- [Phase 1 plan](2026-09-30-phase-01-dark-mode-plan.md) / [roadmap](2026-09-30-phase-01-dark-mode-roadmap.md)

Related stages:
- [Stage 3 high-level plan](2026-09-12-high-level-plan-stage-3.md) (complete)
- [Stage 2 high-level plan](2026-09-11-high-level-plan-stage-2.md) (complete)

## Locked Decisions
- **Default:** Follow the operating system's light/dark preference unless the user chooses a mode.
- **Choices:** System, Light, and Dark. Selecting System resumes following operating-system changes.
- **Persistence:** Store the selected preference in the current browser only. No account, backend endpoint, or cross-device sync.
- **Control:** A gear icon opens a compact Appearance menu with a clearly selected option.
- **Placement:** Keep the gear at the upper-right app level in both the empty-chat and active-thread views. When New Thread is visible, place it immediately to the left of the gear; its existing expansion should open away from the gear.
- **Scope:** Theme the full Sage interface while leaving the embedded video players' own appearance unchanged.
- **Dependencies:** Prefer the existing Tailwind/CSS stack; add no package unless implementation demonstrates a concrete need.

## In Scope
- System-aware initial theme and persistence of the user's System, Light, or Dark selection.
- Accessible Appearance menu and stable upper-right placement in empty and active chat states.
- Readable dark colors for the chat, sidebar, composer, source cards, modal, Markdown, and interactive states.
- Focused visual, keyboard, responsive, persistence, and production-build validation.

## Out of Scope
- Backend, database, account, or server-side preference storage.
- A general settings page or additional settings unrelated to appearance.
- A redesign of the existing light theme beyond changes needed to share theme tokens or resolve contrast.
- New UI libraries or theme packages without a demonstrated need.

## Milestone-Based Delivery Plan

### Milestone 1 — Frame Stage 4 Scope ✅
**Goal**: Record the requested dark mode behavior and a minimal implementation boundary.

**Tasks**
- [x] Confirm system preference as the default, with a remembered user override.
- [x] Select a gear-triggered Appearance menu with System, Light, and Dark options.
- [x] Place the gear consistently at the upper right, next to New Thread when that action is present.
- [x] Write the Stage 4 high-level plan and Phase 1 plan/roadmap pair.

### Milestone 2 — Dark Mode and Appearance Settings
**Goal**: Let a student choose and use a readable theme throughout Sage without affecting the study workflow.

**Tasks**
- [ ] Implement system detection, explicit mode selection, and local preference persistence.
- [ ] Add the accessible Appearance menu and upper-right app control.
- [ ] Apply the dark palette consistently across all Sage-owned UI surfaces.
- [ ] Validate initial preference, overrides, persistence, keyboard behavior, responsive layouts, contrast, and video playback.

**Exit criteria**
- First-time users see the operating-system theme.
- System, Light, and Dark can be selected; System follows later operating-system changes.
- A selected preference survives reload in the same browser and is available in both empty-chat and active-thread views.
- Text, controls, focus indicators, borders, and errors remain legible in both themes.
- Embedded video playback and existing chat behavior are unchanged.
- `npm run build` succeeds.

See the [Phase 1 plan](2026-09-30-phase-01-dark-mode-plan.md) and [roadmap](2026-09-30-phase-01-dark-mode-roadmap.md) for implementation details.

## Expected Outcome
Students can choose a comfortable appearance for Sage, have it remembered in their browser, and continue using the same grounded Q&A, source, and video workflows.