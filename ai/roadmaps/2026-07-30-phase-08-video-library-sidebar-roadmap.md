# Phase 8 Roadmap: Video Library Sidebar

Date: 2026-07-30

## Steps

1. [x] Add `VideoSummary` and `CourseWithVideos` Pydantic models to `backend/main.py`.
   - `VideoSummary`: `video_id: str`, `title: str`, `source_url: Optional[str]`, `video_order: int`.
   - `CourseWithVideos`: `course_id: str`, `course_name: str`, `videos: list[VideoSummary]`.

2. [x] Implement the `GET /videos` route in `backend/main.py`.
   - Query: `SELECT c.course_id, c.name, v.video_id, v.title, v.source_url, v.video_order FROM courses c JOIN videos v ON v.course_id = c.id ORDER BY c.course_id, v.video_order`.
   - Group rows by `course_id` in Python, build a list of `CourseWithVideos`, and return it.
   - Smoke-test locally: `curl http://127.0.0.1:8000/videos` — confirm all three courses and all 133 videos appear with correct ordering.

3. [x] Add the `VideoLibrary` TypeScript types and fetch logic to `frontend/app/page.tsx`.
   - Add interfaces: `VideoSummary { videoId: string; title: string; sourceUrl: string | null; videoOrder: number }` and `CourseLibrary { courseId: string; courseName: string; videos: VideoSummary[] }`.
   - Add state: `library: CourseLibrary[]`, `libraryError: boolean`.
   - On component mount (`useEffect`), fetch `${NEXT_PUBLIC_API_URL}/videos` and populate `library`.

4. [x] Restructure the page layout to support the sidebar slot.
   - Wrap the existing page body in a `flex flex-row` container that fills the viewport height.
   - Add a `sidebarOpen: boolean` state (default `false`) controlled by a toggle button.
   - Sidebar slot: fixed width `w-72` when open; collapses to `w-10` (icon strip) when closed. Always rendered — never hidden — so it is accessible at all viewport sizes.
   - Main content area: `flex-1 overflow-y-auto` — takes all remaining width.
   - Confirm the existing question input, answer card, and source cards render and scroll correctly at typical viewport sizes after the layout change.

5. [x] Build the `VideoLibrarySidebar` section within `page.tsx`.
   - Toggle button (left edge of the sidebar): chevron icon that flips direction based on `sidebarOpen`. Clicking it toggles `sidebarOpen`.
   - When `sidebarOpen` is `false`: render only the toggle button column (icon strip). No video titles or search visible.
   - When `sidebarOpen` is `true`:
     - Render a search `<input>` at the top (`searchQuery` state, default `""`).
     - For each course in `library`, render a collapsible accordion section.
       - First course: expanded by default (`expandedCourses` state initialized with the first `courseId`).
       - All other courses: collapsed by default.
       - Clicking a course header toggles it in/out of `expandedCourses`.
     - Under each expanded course, render a filtered list of `VideoSummary` items where `title.toLowerCase().includes(searchQuery.toLowerCase())`.
       - Each item shows: a small sequence number pill (`video_order`) + the video title (truncate with `truncate` / `line-clamp` if too long).
       - Clicking an item calls `setSelectedVideo(video)` to open the modal.
     - When `searchQuery` is non-empty, expand all course sections automatically so results from any course are visible.
   - Show a brief loading state while `library` is empty and no error; show a short error message if `libraryError` is true.

6. [x] Build the `VideoModal` section within `page.tsx`.
   - Add state: `selectedVideo: VideoSummary | null` (default `null`). Modal renders only when `selectedVideo` is non-null.
   - Overlay: `fixed inset-0 bg-black/60 z-50 flex items-center justify-center`. Clicking the backdrop sets `selectedVideo(null)`.
   - Modal card: `bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4`. Stop click propagation on the card so backdrop-clicks don't fire through.
   - Header row: course name badge (indigo, matching existing source card style) + video title + `×` close button.
   - Body: 16:9 Kaltura iframe built with existing `buildKalturaIframeSrc(selectedVideo.sourceUrl, 0)` (no seek offset — starts at beginning). If `sourceUrl` is null, show a brief "Video link not available yet" placeholder instead of the iframe.
   - ESC key dismissal: `useEffect` attaches a `keydown` listener when `selectedVideo` is non-null; removes it on cleanup or when modal closes.
   - On close (any method), set `selectedVideo(null)`. The iframe unmounts automatically, stopping playback.

7. [ ] Integration and polish.
   - Verify the sidebar toggle, search, accordion expand/collapse, and modal open/close all work together without state conflicts.
   - Verify that opening or closing the sidebar does not affect the chat state (question, answer card, source cards, inline embeds).
   - Test all three courses; test first and last video in each; test a video with a null `source_url` (modal shows placeholder).
   - Test search: type a partial title — confirm results appear across all auto-expanded courses; clear search — confirm courses return to their previous expand state.
   - Check truncation on long titles in the sidebar list.
   - Confirm ESC closes the modal and restores scroll/focus to the chat area.

## Implementation Notes

- Keep all frontend changes within `page.tsx` (or extract into files under `frontend/app/` only if the file grows unwieldy). Do not add a `components/` folder unless necessary.
- The modal reuses `buildKalturaIframeSrc` which is already defined in `page.tsx` — no duplication needed.
- `expandedCourses` should be a `Set<string>` (course IDs) in state. Initialize it with the first courseId after the library fetch resolves.
- When search is active and all sections are force-expanded, store a `wasExpanded` snapshot so clearing the search restores the prior accordion state rather than leaving everything open.
- No new npm packages are needed. Tailwind utility classes cover all styling.
- No DB schema changes. The `GET /videos` endpoint uses existing tables.

## Output

A collapsible left-side video library that any student can open, search, and use to watch any course video in a floating modal — completely independent of the Q&A flow and without disrupting the existing chat experience.
