# Phase 8 Roadmap: Video Library Sidebar

Date: 2026-07-30
Updated: 2026-09-11

See `ai/roadmaps/complete/2026-07-30-phase-08-video-library-sidebar-plan.md` for goal, decisions, and exit criteria.

**Avoid over-engineering, cruft, and legacy-compatibility features.** Keep this phase to one new endpoint and UI inside `page.tsx`. Do not add a `components/` folder, a mapping layer for camelCase, pagination, or server-side search.

Implemented in `backend/main.py` and `frontend/app/page.tsx`. Verified against the five-course catalog (174 videos).

## Steps

1. [x] Add `VideoSummary` and `CourseWithVideos` Pydantic models to `backend/main.py`.
   - `VideoSummary`: `video_id: str`, `title: str`, `source_url: Optional[str]`, `video_order: Optional[int]`.
   - `CourseWithVideos`: `course_id: str`, `course_name: str`, `videos: list[VideoSummary]`.

2. [x] Implement the `GET /videos` route in `backend/main.py`.
   - Query: `SELECT c.course_id, c.name, v.video_id, v.title, v.source_url, v.video_order FROM courses c JOIN videos v ON v.course_id = c.id ORDER BY c.course_id, v.video_order`.
   - Group rows by `course_id` in Python, build a list of `CourseWithVideos`, and return it.
   - [x] Smoke-test: `curl http://127.0.0.1:8000/videos` — confirm five courses and 174 videos with correct ordering (DATA1100, DATA2100, DATA5300, DATA5400, IS3600).

3. [x] Add the library TypeScript types and fetch logic to `frontend/app/page.tsx`.
   - Interfaces match the API JSON as-is (snake_case): `VideoSummary { video_id, title, source_url, video_order }` and `CourseLibrary { course_id, course_name, videos }`.
   - State: `library: CourseLibrary[]`, `libraryError: boolean`.
   - On mount (`useEffect`), fetch `${NEXT_PUBLIC_API_URL}/videos` and populate `library`.

4. [x] Restructure the page layout to support the sidebar slot.
   - Wrap the existing page body in a `flex flex-row` container that fills the viewport height.
   - `sidebarOpen: boolean` state (default `false`) controlled by a toggle button.
   - Sidebar slot: `w-72` when open; `w-10` icon strip when closed. Always rendered.
   - Main content area: `flex-1 overflow-y-auto`.
   - Confirm the existing question input, answer card, and source cards still render and scroll correctly.

5. [x] Build the sidebar section within `page.tsx`.
   - Collapsed: crest icon toggle only. Expanded: "Video Library" label + chevron-left collapse control.
   - Search `<input>` (`searchQuery`, default `""`).
   - Accordion per course. Default: all collapsed (`expandedCourses` starts empty). Clicking a course header toggles that `course_id` in the set. Do not toggle while a search is active.
   - Under each expanded course, list videos whose `title.toLowerCase().includes(searchQuery.toLowerCase())`.
   - Each item: sequence-number pill (`video_order`) + title (`line-clamp-2`). Click → `setSelectedVideo({ video, courseName })`.
   - Non-empty search: auto-expand courses that have matches; hide courses with zero matches. Clearing search restores `expandedCourses` (the set is not mutated during search, so no separate snapshot is required).
   - Loading spinner while `library` is empty and no error; short error message if `libraryError`.

6. [x] Build the modal section within `page.tsx`.
   - `selectedVideo` is `{ video: VideoSummary; courseName: string } | null`. Modal renders only when non-null.
   - Overlay: `fixed inset-0 bg-black/60 z-50 flex items-center justify-center`. Backdrop click clears the selection.
   - Card: `bg-white rounded-xl shadow-2xl max-w-3xl w-full`. Stop click propagation on the card.
   - Header: sage course badge + title + ×.
   - Body: 16:9 iframe via `buildKalturaIframeSrc(source_url, 0)`. If `source_url` is null, show "Video link not available yet."
   - ESC `keydown` listener while the modal is open; cleanup on close.
   - Closing unmounts the iframe and stops playback.

7. [x] Integration QA against the live five-course catalog.
   - Sidebar toggle, search, accordion, and modal do not conflict with chat state (question, answer, source cards, inline embeds).
   - All five courses listed; first and last video in each sequence open correctly.
   - A video with a null `source_url` shows the placeholder (if any remain).
   - Partial-title search shows matches across auto-expanded courses; clearing search restores prior expand state.
   - Long titles truncate in the sidebar list.
   - ESC closes the modal.

## Implementation Notes

- Keep frontend changes in `page.tsx`. Extract files under `frontend/app/` only if the file becomes unwieldy.
- Reuse `buildKalturaIframeSrc` already in `page.tsx`. Do not duplicate Kaltura URL parsing.
- `expandedCourses` is a `Set<string>` of course IDs. Search must not write to that set.
- No new npm packages. No DB schema changes.

## Output

A collapsible left-side video library that any student can open, search, and use to watch any course video in a floating modal — independent of the Q&A flow and without disrupting the existing chat experience.
