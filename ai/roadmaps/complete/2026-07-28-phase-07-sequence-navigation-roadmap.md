# Phase 7 Roadmap: Sequence Navigation (MVP + Feedback)

Date: 2026-07-28

## Steps

1. [x] Add `NeighborVideo` Pydantic model and update `Source` model in `backend/main.py`.
   - New model: `title: str`, `source_url: Optional[str]`, `video_order: int`.
   - Add `prev_video: Optional[NeighborVideo] = None` and `next_video: Optional[NeighborVideo] = None` to the existing `Source` model.

2. [x] Implement neighbor lookup in `backend/answer.py`.
   - For each chunk/source, query `videos` for the rows in the same `course_id` with `video_order` equal to the current video's order minus one and order plus one.
   - Assign the lower-order result to `prev_video` and the higher-order result to `next_video`.
   - Attach both to the source dict before returning.

3. [x] Update `frontend/app/page.tsx` — interfaces.
   - Add `NeighborVideo` TypeScript interface: `{ title: string; source_url: string | null; video_order: number }`.
   - Add `prev_video: NeighborVideo | null` and `next_video: NeighborVideo | null` to the `Source` interface.

4. [x] Render the "Also in this series" strip in `frontend/app/page.tsx`.
   - Show the strip only when at least one neighbor exists.
   - Render a previous chip (`← [title]` + Watch link) and/or a next chip (`[title] →` + Watch link) depending on which neighbors are present.
   - Suppress a chip if its `video_order` matches any other source already displayed (dedup).
   - Neighbor Kaltura embeds open from the start of the video (no `kalturaSeekFrom` offset).
   - Apply a lighter visual style (smaller text, muted/subdued background) relative to the main source card.

5. [x] Test end-to-end.
   - Ask a representative question that returns a mid-sequence video and verify both chips appear.
   - Ask a question that returns the first video in a course and verify only the next chip appears.
   - Ask a question that returns a video already adjacent to another returned source and verify the duplicate chip is suppressed.

## Implementation Notes
- All current videos have `video_order` set; treat the field as required. No null-guard branching needed in the lookup.
- Keep all frontend changes within `page.tsx`. Do not introduce new component files unless the file becomes unmanageable.
- No new API endpoints. The neighbor data is added to the existing `/ask` response shape.
- The neighbor strip is a visual hint, not a primary navigation surface. Keep the style clearly subordinate to the main source card.

## Output
A working "Also in this series" strip beneath each returned source card, backed by a live neighbor lookup in the API response.
