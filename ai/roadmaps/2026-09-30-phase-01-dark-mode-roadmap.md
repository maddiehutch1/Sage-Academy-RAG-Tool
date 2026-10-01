# Phase 1 Roadmap: Dark Mode and Appearance Settings

Date: 2026-09-30

See [the Phase 1 plan](2026-09-30-phase-01-dark-mode-plan.md) for the goal, decisions, scope, and exit criteria. This phase is part of [Stage 4](2026-09-30-high-level-plan-stage-4.md).

**Avoid over-engineering, cruft, and legacy-compatibility features.** Keep this to one browser-local appearance preference and one small settings menu. Do not add a general settings system, account support, or a theme dependency without a concrete need.

## Steps

1. [x] Lock the appearance behavior.
   - Default to the computer's system preference.
   - Offer System, Light, and Dark.
   - Persist the selected mode in the current browser; no server-side preference.

2. [x] Lock the control and placement.
   - A gear opens an Appearance menu rather than directly cycling themes.
   - Keep it at the upper-right app level in empty chat and active thread.
   - Place New Thread just left of the gear when visible; its expansion opens away from the gear.

3. [x] Write and cross-reference the Stage 4 and Phase 1 planning documents.
   - `ai/roadmaps/2026-09-30-high-level-plan-stage-4.md`
   - `ai/roadmaps/2026-09-30-phase-01-dark-mode-plan.md`
   - `ai/roadmaps/2026-09-30-phase-01-dark-mode-roadmap.md`

4. [ ] Confirm the theme implementation strategy against the current frontend.
   - Prefer the existing Tailwind/CSS stack and shared tokens where they simplify the current fixed light colors.
   - Avoid a new package unless an identified requirement cannot be handled cleanly with the existing stack.

5. [ ] Implement theme preference state and initial theme application.
   - Follow `prefers-color-scheme` when System is selected, including changes while the app is open.
   - Persist System/Light/Dark locally and avoid a flash of the wrong theme on reload.

6. [ ] Add the accessible gear menu and stable placement.
   - Show the current selection and support keyboard navigation, focus, Escape, and outside-click dismissal.
   - Verify there is no collision with the expanding New Thread control.

7. [ ] Apply dark colors across the interface.
   - Cover sidebar/search, chat/composer, user and assistant turns, Markdown/code, source cards/neighbors, loading/error states, and modal chrome.
   - Preserve clear surface hierarchy and Sage accents; embedded player visuals remain provider-owned.

8. [ ] Run focused verification.
   - Check first-visit System mode, operating-system changes, explicit overrides, reload persistence, and return to System.
   - Check empty chat and active thread, keyboard-only menu use, contrast/focus, desktop/mobile layout, and embedded video playback.
   - Run `npm run build`.

9. [ ] Close the phase after all exit criteria pass.
   - Update this roadmap and the Stage 4 milestone.
   - Update `aiDocs/architecture.md` and `aiDocs/changelog.md` with the implemented behavior.
   - Move the completed Phase 1 plan/roadmap pair into `ai/roadmaps/complete/`.

## Implementation Notes
- This is a frontend-only preference and must not affect chat/thread or API state.
- System is a real selectable mode, not only a one-time first-visit default.
- Keep the gear accessible in both empty and active chat layouts.
- Existing embedded video content is not recolored or restyled.
- Do not claim the phase complete until preference persistence, keyboard behavior, both themes, responsive layout, playback, and build have been checked.

## Output
A student can select System, Light, or Dark from the upper-right Appearance menu, with a remembered browser-local choice and no changes to Sage's grounded Q&A workflow.