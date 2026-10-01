# Phase 1 Plan: Dark Mode and Appearance Settings

Date: 2026-09-30

See [the Phase 1 roadmap](2026-09-30-phase-01-dark-mode-roadmap.md) for the implementation sequence and [the Stage 4 high-level plan](2026-09-30-high-level-plan-stage-4.md) for the stage boundary.

## Engineering Philosophy
**Avoid over-engineering, cruft, and legacy-compatibility features.**

Add only the theme state and control required for a polished, usable dark mode. Do not introduce a settings framework or unrelated UI changes.

## Context
Users requested a dark mode toggle. The current frontend uses fixed light Tailwind color utilities across the app and has no theme preference state. The chat has an empty state and an active-thread state; the video library and modal are also part of the primary experience.

## Goal
Allow each user to choose System, Light, or Dark appearance, default to the operating-system preference, and remember the choice in that browser. Keep the gear control available at the upper right across chat states and preserve existing workflows.

## User Experience Contract
- A gear icon opens an Appearance menu; the gear itself does not silently cycle through modes.
- The menu offers System, Light, and Dark, with the selected choice exposed accessibly.
- On first visit, System follows the operating system's current preference.
- A user's explicit Light or Dark choice overrides the operating system and persists across reloads in that browser.
- Choosing System returns to following the operating system, including later preference changes.
- The gear remains in a consistent upper-right position in both empty chat and active thread. When New Thread is visible, it sits just left of the gear. The New Thread hover expansion must not cover the gear.
- The menu is usable by keyboard, has a visible focus state, and can be dismissed with Escape and by clicking outside.

## Scope

### In scope
- A small app-level theme preference mechanism using the existing frontend stack.
- System preference detection and updates while System is selected.
- Browser-local persistence of the selected mode; no server-side storage.
- An accessible gear button and compact Appearance menu.
- Theme coverage for the page, sidebar/search, chat composer, user and assistant messages, Markdown code/blockquote styling, source cards, neighbor controls, loading/error states, and video modal chrome.
- Dark colors with clear surface hierarchy, readable text, legible borders/focus states, and preserved Sage accents.
- Avoiding a light-theme flash when a saved Dark choice is applied on reload.

### Out of scope
- App code in this documentation task; implementation begins only after this plan is approved.
- Accounts, backend/API/database changes, or preference sync across browsers/devices.
- A general settings page, saved chats, or any new user preferences beyond appearance.
- Changes to transcript/video content, embedded players, API behavior, or chat state.
- Replacing the existing light design or adding a third-party theme library without a demonstrated need.

## Design and Technical Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Initial preference | System | Matches the user's computer by default and respects accessibility preference |
| Available modes | System, Light, Dark | Explicit choice plus a way to resume system-following behavior |
| Persistence | Browser-local storage | Remember the preference without accounts or backend work |
| Control | Gear opens Appearance options | Does not overload an icon as a one-step theme toggle when there are three modes |
| Placement | Upper-right app-level control; New Thread immediately left | Consistent location in both chat states; existing hover expansion opens away from the gear |
| Theme mechanism | Existing Tailwind/CSS stack | Avoid adding dependencies; implementation can choose class-based switching and shared tokens |
| Video players | Leave player surfaces unchanged | Embedded Kaltura/YouTube controls are owned by their providers |

## Likely Implementation Surface
- `frontend/tailwind.config.ts`: enable the chosen dark-theme strategy if needed.
- `frontend/app/globals.css`: shared theme variables/base behavior if useful.
- `frontend/app/layout.tsx`: root document theme application and initial paint behavior.
- `frontend/app/page.tsx`: app-level gear placement, sidebar and modal colors.
- `frontend/app/ChatThread.tsx`: header controls, composer, conversation surfaces, and Markdown colors.
- `frontend/app/SourceCards.tsx`: citation, neighbor, and expanded-player chrome.

Keep the implementation inside the current frontend unless a concrete technical blocker requires otherwise.

## Verification Criteria
- First visit follows `prefers-color-scheme` for both light and dark system settings.
- System mode follows a system preference change; explicit Light/Dark remains selected despite system changes.
- Explicit selection survives reload in the same browser; selecting System clears the override behavior.
- Gear and menu work by keyboard, announce their purpose/state, show focus, and dismiss predictably.
- Gear position is stable between empty chat and active thread; New Thread expansion does not overlap it.
- Verify light and dark rendering for empty chat, populated thread, loading/error states, sidebar/search, source cards, Markdown/code, and modal.
- Contrast and focus remain usable; layout does not overlap at desktop and mobile sizes.
- YouTube and Kaltura players still load and existing chat interactions still work.
- `npm run build` succeeds.

## Deliverables
- [ ] System-aware, persistent theme preference.
- [ ] Accessible Appearance menu at the agreed upper-right location.
- [ ] Dark palette applied consistently across the Sage interface.
- [ ] Focused browser QA and successful production build.

## Status
Planning is complete. No application code has been changed as part of creating this plan.