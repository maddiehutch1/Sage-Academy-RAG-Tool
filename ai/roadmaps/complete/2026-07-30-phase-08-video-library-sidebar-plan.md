# Phase 08 — Video Library Sidebar

Date: 2026-07-30
Updated: 2026-09-11
Status: Complete

See `ai/roadmaps/complete/2026-07-30-phase-08-video-library-sidebar-roadmap.md` for the step-by-step implementation roadmap.
See `ai/roadmaps/2026-07-10-high-level-plan-mvp.md` Milestone 9 for how this phase sits in the overall plan.

---

## Engineering Philosophy
**Avoid over-engineering, cruft, and legacy-compatibility features.**

This is a clean-start project with no existing users, no existing data, and no migration debt. Every layer of abstraction must earn its place. If a simpler approach works, use it. Delete code freely. Build for what's needed now, not for hypothetical future requirements.

---

## Goal

Give students a persistent, browsable catalog of every video in the database on the left side of the chat interface. If a student already knows which lecture they want to watch, they should be able to find it quickly without asking a question, click it, and watch it in a floating modal — all without leaving the page or disrupting the chat.

---

## Stakeholder Requirements

- Collapsible left-side panel listing all videos in the database
- Videos grouped by course and sorted in sequence order (`video_order`)
- Search/filter input to find a specific video by title
- Clicking a video opens a **floating modal** with the Kaltura player
- The modal can be dismissed at any time; the page state (chat, source cards, etc.) is preserved
- Source cards in the chat keep their existing inline expand behavior (no change there)

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Sidebar position | Left side | Standard convention; keeps the right side clean for answer cards |
| Sidebar default state | Collapsed on load | Chat is the primary flow; library is a secondary affordance |
| Video player in sidebar | Floating modal overlay | Doesn't push/re-layout the page; easy to dismiss; modal starts from beginning of video |
| Chat source card behavior | Unchanged (inline expand) | Avoids disruption to a working interaction pattern |
| Search scope | Video title, filtered client-side | All ~174 titles fit in one API response; no server-side search needed |
| Course sections | Collapsible accordion per course | Shows structure at a glance; students can collapse courses they don't care about |
| Default accordion state | All courses collapsed | Five courses would overwhelm if the first auto-expanded; search force-expands matches |
| Collapsed toggle affordance | Sage crest icon (chevron when open) | Crest is the existing brand mark; chevron-left when expanded is the collapse control |
| Sidebar on narrow screens | Always available, collapsed to icon strip | Students on smaller viewports can still access the library; they just need to toggle it open |
| Data fetch | On page load, `GET /videos` | Small payload (~174 records); cheap to cache; no on-demand loading needed |
| TS field names | Use API snake_case as-is (`video_id`, `source_url`) | Matches FastAPI JSON; no camelCase mapping layer |

---

## Current catalog (as of 2026-09-01)

Five indexed courses, 174 videos:

| Course | Videos |
|---|---|
| DATA 1100: Excel for Business Analysis | 16 |
| DATA 2100: Data and Information in Business | 43 |
| DATA 5300: Database Management | 25 |
| DATA 5400: Advanced Data Visualization | 63 |
| IS 3600: Introduction to Cloud Computing | 27 |

`GET /videos` orders courses by `course_id`, then videos by `video_order`.

---

## Architecture Changes

### Backend — 1 new endpoint

**`GET /videos`**

Returns all videos grouped by course, ordered by `video_order` within each course. No authentication, no pagination needed for MVP scale.

Response shape:
```json
[
  {
    "course_id": "data-2100:-data-and-information-in-business",
    "course_name": "DATA 2100: Data and Information in Business",
    "videos": [
      {
        "video_id": "...",
        "title": "Intro to Course",
        "source_url": "https://www.kaltura.com/index.php/extwidget/preview/...",
        "video_order": 1
      }
    ]
  }
]
```

Implementation: single SQL query joining `courses` → `videos`, `ORDER BY courses.course_id, videos.video_order`. Group in Python. No schema changes needed.

`video_order` is `Optional[int]` on the Pydantic model so a missing order still serializes; every current video has a value.

### Frontend — layout restructure in `page.tsx`

Keep all UI in `frontend/app/page.tsx` unless the file becomes unmanageable. Do not add a `components/` folder for this phase.

**Layout:**
- Top-level flex row: `[Sidebar] | [Main chat area]`
- Sidebar width: `w-72` when open; `w-10` icon strip when closed
- Main area: `flex-1 overflow-y-auto`, chat behavior unchanged

**Sidebar:**
- Toggle on the left edge
- Search input when expanded
- Course accordion (each course independently collapsible)
- Video rows: sequence-number pill + truncated title
- Client-side title filter; while the query is non-empty, auto-expand courses that have matches and hide courses with none
- Clearing search restores the previous `expandedCourses` set (do not mutate that set while searching)

**Modal:**
- Fixed overlay, centered card, course badge + title + ×
- Kaltura `embedPlaykitJs` iframe via existing `buildKalturaIframeSrc(url, 0)` (starts at t=0)
- If `source_url` is null, show "Video link not available yet" instead of an iframe
- Close on ×, backdrop click, and ESC; unmount iframe on close so playback stops

---

## Implementation status

The feature is in the tree and QA is signed off.

| Area | Where | Status |
|---|---|---|
| `GET /videos` + Pydantic models | `backend/main.py` | Done |
| Library fetch, sidebar, accordion, search | `frontend/app/page.tsx` | Done |
| `VideoModal` (ESC / backdrop / × / t=0 seek) | `frontend/app/page.tsx` | Done |
| Five-course QA (174 videos, long titles, null URL placeholder) | local + Render | Done |

### Task 1 — Backend: `GET /videos` endpoint
- [x] Add `CourseWithVideos` and `VideoSummary` Pydantic models to `backend/main.py`
- [x] Write the `GET /videos` route: query joins `courses` → `videos`, groups in Python, returns list sorted by `course_id` then `video_order`
- [x] Smoke-test the endpoint (`curl http://127.0.0.1:8000/videos`) against the five-course catalog (174 videos)

### Task 2 — Frontend: Page layout restructure
- [x] Wrap current page content in a flex-row container
- [x] Add a left sidebar slot (collapsed by default, controlled by `sidebarOpen` state)
- [x] Main chat area fills remaining width
- [x] Sidebar always rendered (icon strip when closed), including on narrow viewports

### Task 3 — Frontend: `VideoLibrarySidebar`
- [x] On mount, fetch `${NEXT_PUBLIC_API_URL}/videos` and store results in state
- [x] Render course accordion sections (default: all collapsed)
- [x] Render each video as a clickable row with title + order number
- [x] Client-side search filtering against video titles (case-insensitive, instant)
- [x] Clicking a row opens the modal via `selectedVideo` state
- [x] Toggle button controls `sidebarOpen`
- [x] Loading and error states for the fetch

### Task 4 — Frontend: `VideoModal`
- [x] Accept selected video + course name; `onClose` clears `selectedVideo`
- [x] Fixed-position backdrop (`bg-black/60 z-50`)
- [x] Centered card with course badge, title, and × close button
- [x] Kaltura iframe via `buildKalturaIframeSrc` at t=0; placeholder when `source_url` is null
- [x] Close on ×, backdrop click, and ESC
- [x] Iframe unmounts on close

### Task 5 — Integration QA
- [x] Confirm opening the modal from the sidebar does not collapse or change chat source-card embeds
- [x] Test all five courses; first and last video in each sequence; long titles truncate
- [x] Test search across courses, then clear search and confirm accordion state restores
- [x] Visual QA: sidebar toggle, modal open/close, ESC dismissal

---

## Exit Criteria

- The sidebar is visible (collapsed) on initial page load; toggle opens it to show all courses and videos
- A student can type in the search box and see the video list filter in real time
- Clicking any video in the sidebar opens a floating modal with the Kaltura player starting from the beginning
- The modal can be closed with the × button, ESC key, or a backdrop click
- Closing the modal returns full focus to the chat with no visible side effects
- Source cards in the chat continue to work exactly as before
- All five courses appear in the sidebar in `course_id` order

---

## Out of Scope for This Phase

- Syncing the sidebar highlight to which video is currently shown in a chat source card
- "Continue watching" / playback position memory
- Favorites or bookmarks
- Thumbnail images (Kaltura does not expose thumbnails in the current integration)
- Playlist / autoplay through a sequence from the sidebar

---

## Files Expected to Change

| File | Change |
|---|---|
| `backend/main.py` | `GET /videos` route + `VideoSummary` / `CourseWithVideos` (already present) |
| `frontend/app/page.tsx` | Layout, sidebar, modal (already present) |
| `frontend/app/globals.css` | Only if a scrollbar/animation tweak is needed during QA |

No schema changes. No new dependencies (Tailwind + existing React/Next.js).
