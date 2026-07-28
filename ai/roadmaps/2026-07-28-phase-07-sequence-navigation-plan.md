# Phase 7 Plan: Sequence Navigation (MVP + Feedback)

Date: 2026-07-28

## Engineering Philosophy
**Avoid over-engineering, cruft, and legacy-compatibility features.**

This is a clean-start project with no existing users, no existing data, and no migration debt. Every layer of abstraction must earn its place. If a simpler approach works, use it. Delete code freely. Build for what's needed now, not for hypothetical future requirements.

## Context
This phase was shaped by feedback from the first internal demo. Reviewers understood the core experience immediately but noted that a single retrieved video can feel isolating — students benefit from knowing where a clip falls in the broader course sequence and having a quick path to the videos immediately before and after it.

The infrastructure for this was already laid in the post-MVP ordering work: every video now has a `video_order` value in the database, and it flows end-to-end through the stack from ingest to API response. Phase 7 activates that data in the UI.

## Goal
When the chatbot returns video sources for an answer, surface the immediately adjacent videos (the one before and the one after in the course playlist) beneath each main source card so that students can navigate the surrounding curriculum without leaving the tool.

## Scope

### In scope
- A backend query that fetches the previous and next video (by `video_order`, within the same course) for each source returned by `/ask`.
- Attaching `prev_video` and `next_video` objects to each source in the API response.
- A frontend "Also in this series" strip rendered below each source card that shows the neighbor video titles and a watch link.
- Neighbor Kaltura embeds open at the start of the video (no seek offset, since no chunk was matched).
- Deduplication: if a neighbor video is already one of the top-5 retrieved sources, suppress it from appearing as a neighbor chip to avoid showing it twice.

### Out of scope
- A full "course outline" or "table of contents" sidebar.
- Multi-level navigation (neighbors of neighbors).
- Reordering the primary source list by `video_order` (retrieval rank remains the sort order).
- Any UI for courses that lack `video_order` data (all current videos have it; the field is treated as required going forward).

## Data Shape

### New `NeighborVideo` object
```json
{
  "title": "string",
  "source_url": "string | null",
  "video_order": "integer"
}
```

### Updated `Source` object (additions only)
```json
{
  "prev_video": "NeighborVideo | null",
  "next_video": "NeighborVideo | null"
}
```

## Backend Design

### Neighbor lookup query
Run once per returned source, in `answer.py`, after the chunk list is assembled:

```sql
SELECT title, source_url, video_order
FROM videos
WHERE course_id = (SELECT course_id FROM videos WHERE id = %s)
  AND video_order IN (%s - 1, %s + 1)
ORDER BY video_order;
```

This returns at most two rows. Assign the lower-order row to `prev_video` and the higher-order row to `next_video`.

### Pydantic model changes (`main.py`)
- Add `NeighborVideo` model with `title`, `source_url`, `video_order`.
- Add `prev_video: Optional[NeighborVideo]` and `next_video: Optional[NeighborVideo]` to the existing `Source` model.

### Files changed
| File | Change |
|------|--------|
| `backend/answer.py` | Neighbor DB lookup; attach `prev_video` / `next_video` to each source dict |
| `backend/main.py` | Add `NeighborVideo` Pydantic model; update `Source` model |

## Frontend Design

### Updated TypeScript interfaces
- Add `NeighborVideo` interface: `{ title: string; source_url: string | null; video_order: number }`.
- Add `prev_video` and `next_video` (both `NeighborVideo | null`) to the existing `Source` interface.

### "Also in this series" strip
Rendered inside the source card, below the existing excerpt and watch button, only when at least one neighbor exists.

Layout:
- Section label: **"Also in this series"** in small muted text.
- Up to two neighbor chips side by side (stacked vertically on narrow screens).
- Left chip: `← [Previous video title]` with a Watch link.
- Right chip: `[Next video title] →` with a Watch link.
- Neighbor chips use a lighter visual treatment than the main card (smaller text, subdued background).
- Clicking Watch on a neighbor chip opens the Kaltura embed for that video from the start (no `kalturaSeekFrom`).
- A neighbor chip is suppressed if its `video_order` matches any other source already displayed (dedup logic).

### Files changed
| File | Change |
|------|--------|
| `frontend/app/page.tsx` | Add `NeighborVideo` interface; update `Source` interface; render "Also in this series" strip |

## Assumptions
- All ingested videos have a `video_order` value. The field is treated as required for any future ingestion.
- Neighbor lookup is scoped by `course_id`, so `video_order` values are only compared within the same course.
- The neighbor strip does not appear when both `prev_video` and `next_video` are `null` (i.e., the video is the only one in its course, which should not occur in practice).

## Guiding Principles
- The neighbor strip should feel like a helpful hint, not visual clutter. Keep it lightweight.
- Do not change the primary source ranking or card layout. The existing experience is the anchor.
- No new API endpoints. Enrich the existing `/ask` response instead.
- Keep the frontend change contained to `page.tsx` — no new component files unless the file becomes unmanageable.

## Deliverables
- Updated `/ask` API response that includes `prev_video` and `next_video` on each source.
- A working "Also in this series" strip in the frontend for all returned sources.
- The full source-to-neighbor flow tested end-to-end with at least one sample question.
