# Phase 09 — Video Library Sidebar

Date: 2026-07-30
Status: Planning

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
| Search scope | Video title, filtered client-side | All 133 titles fit in one API response; no server-side search needed |
| Course sections | Collapsible accordion per course | Shows structure at a glance; students can collapse courses they don't care about |
| Default accordion state | First course expanded, others collapsed | Gives immediate visual feedback that content is there without overwhelming the sidebar |
| Sidebar on narrow screens | Always available, collapsed to icon strip | Students on smaller viewports can still access the library; they just need to toggle it open |
| Data fetch | On page load, `GET /videos` | Small payload (~133 records); cheap to cache; no on-demand loading needed |

---

## Architecture Changes

### Backend — 1 new endpoint

**`GET /videos`**

Returns all videos grouped by course, ordered by `video_order` within each course. No authentication, no pagination needed for MVP scale.

Response shape:
```json
[
  {
    "course_id": "DATA2100",
    "course_name": "Introduction to Data Analytics",
    "videos": [
      {
        "video_id": "...",
        "title": "Week 1 - Introduction",
        "source_url": "https://kaltura.../...",
        "video_order": 1
      }
    ]
  }
]
```

Implementation: single SQL query joining `courses` → `videos`, `ORDER BY courses.course_id, videos.video_order`. No schema changes needed.

### Frontend — layout restructure + 2 new logical components

**Layout change** (`page.tsx` or extracted layout wrapper):
- Top-level flex row: `[Sidebar] | [Main chat area]`
- Sidebar width: fixed ~280px when open; collapses to a ~40px icon strip when closed
- Main area: fills the rest of the viewport, behavior unchanged

**`VideoLibrarySidebar` component** (can live in `page.tsx` or a new `components/` file):
- Toggle button on left edge (chevron/hamburger icon)
- Search input at top when expanded
- Course accordion sections (each course collapsible independently)
- Video list items: title + sequence number pill, click handler
- Filters the video list client-side against the search string

**`VideoModal` component**:
- Fixed-position overlay backdrop
- Centered card with: video title, course badge, close button (×)
- Kaltura `embedPlaykitJs` iframe — starts at t=0 (no `kalturaSeekFrom`)
- Uses the same `buildKalturaIframeSrc` helper already in `page.tsx`
- ESC key and backdrop click both close the modal

---

## Implementation Tasks

### Task 1 — Backend: `GET /videos` endpoint
- [ ] Add `CourseWithVideos` and `VideoSummary` Pydantic models to `backend/main.py`
- [ ] Write the `GET /videos` route: query joins `courses` → `videos`, groups in Python, returns list sorted by `course_id` then `video_order`
- [ ] Smoke-test the endpoint locally (`curl http://127.0.0.1:8000/videos`)

### Task 2 — Frontend: Page layout restructure
- [ ] Wrap current page content in a flex-row container
- [ ] Add a left sidebar slot (collapsed by default, controlled by `sidebarOpen` state)
- [ ] Confirm the main chat area still fills remaining width correctly at typical viewport sizes
- [ ] Add responsive consideration: sidebar auto-collapses on narrow viewports (≤ 768px)

### Task 3 — Frontend: `VideoLibrarySidebar` component
- [ ] On mount, `fetch('/videos')` and store results in state
- [ ] Render course accordion sections (default: all expanded, or first expanded only — TBD)
- [ ] Render each video as a clickable row with title + order number
- [ ] Implement client-side search filtering against video titles (case-insensitive, instant)
- [ ] Emit `onSelectVideo(video)` callback to parent to open the modal
- [ ] Toggle button (chevron icon) controls `sidebarOpen` in parent state
- [ ] Show loading skeleton and error state for the fetch

### Task 4 — Frontend: `VideoModal` component
- [ ] Accept `video` prop (`{ title, source_url, course_name }`) and `onClose` callback
- [ ] Fixed-position backdrop (semi-transparent dark overlay, z-50)
- [ ] Centered card: max-w-3xl, with title + course badge header and × close button
- [ ] Kaltura iframe built with existing `buildKalturaIframeSrc` (no seekFrom, so starts at t=0)
- [ ] Close on: × button click, backdrop click, ESC keydown
- [ ] Clear/unmount the iframe on close to stop video playback

### Task 5 — Integration and polish
- [ ] Wire `onSelectVideo` → set `selectedVideo` state in parent → render `<VideoModal />`
- [ ] Confirm dedup: opening the modal from the sidebar does not affect or collapse source card embeds in the chat
- [ ] Test all three courses, first/last video in each sequence, long titles (truncate with ellipsis)
- [ ] Visual QA: sidebar toggle, search filtering, modal open/close, ESC dismissal

---

## Exit Criteria

- The sidebar is visible (collapsed) on initial page load; toggle opens it to show all courses and videos
- A student can type in the search box and see the video list filter in real time
- Clicking any video in the sidebar opens a floating modal with the Kaltura player starting from the beginning
- The modal can be closed with the × button, ESC key, or a backdrop click
- Closing the modal returns full focus to the chat with no visible side effects
- Source cards in the chat continue to work exactly as before

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
| `backend/main.py` | Add `GET /videos` route + 2 Pydantic models |
| `frontend/app/page.tsx` | Layout restructure, sidebar state, modal state, 2 new component sections (or extractions) |
| `frontend/app/globals.css` | Minor scrollbar/animation tweaks if needed |

No schema changes. No new dependencies anticipated (Tailwind + existing React/Next.js covers everything).

---

See `ai/roadmaps/2026-07-30-phase-09-video-library-sidebar-roadmap.md` for the step-by-step implementation roadmap.
