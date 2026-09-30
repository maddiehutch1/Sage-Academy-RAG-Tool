# Sage Academy RAG Tool — High-Level Stage 3 Plan

Date: 2026-09-12

## Engineering Philosophy
**Avoid over-engineering, cruft, and legacy-compatibility features.**

This is a clean-start project with no existing users, no existing data, and no migration debt. Every layer of abstraction must earn its place. If a simpler approach works, use it. Delete code freely. Build for what's needed now, not for hypothetical future requirements.

This is a follow-up to Stage 2. Use these guidelines as a high-level map for adding one YouTube-hosted course without turning the tool into a multi-provider video platform.

## Overview
Stage 3 keeps the product a lightweight RAG study assistant: a student asks a course question and gets a grounded answer with video and timestamp citations. Stage 2 already proved follow-up threads, dual-example coding/layout answers, and rendered markdown. Stage 3 only adds a way to index a YouTube playlist as one more course, using the same transcript → chunk → embed → cite flow that Kaltura courses already use.

Locked approach: **Choice B** from the 2026-09-12 design discussion.

1. An offline helper lists a playlist, downloads captions, and writes `.srt` files plus JSON sidecars into `data/transcripts/<COURSE>/`.
2. Existing `scripts/ingest.py` indexes those files. No new chunk format, no new table, no live YouTube call at question time.
3. The frontend treats `videos.source_url` as either a Kaltura preview URL or a YouTube watch URL and builds the matching iframe (with timestamp seek).

Park everything else. Do not add a playlist entity, a `source_type` column, Whisper transcription, a YouTube Data API key in the web app, nightly playlist sync, or VTT parsing in ingest if captions can be converted to SRT first.

The real playlist URL and course display name are **operator inputs at implementation time**. They are not known at planning time. The code can be written and smoke-tested against a short public playlist; the live course ingest waits for those inputs.

## Project Phases
1. Phase 0 — Framing and Scope (docs)
2. Phase 1 — YouTube Playlist Ingest

Phase plan and roadmap pair:
- [Phase 1 plan](2026-09-12-phase-01-youtube-playlist-plan.md) / [roadmap](2026-09-12-phase-01-youtube-playlist-roadmap.md)

Related plans:
- [Stage 2 high-level plan](2026-09-11-high-level-plan-stage-2.md) (complete)
- [Completed MVP plan](complete/2026-07-10-high-level-plan-mvp.md)

## Locked Decisions
- **Vision:** still the [aiDocs/context.md](../../aiDocs/context.md) RAG study assistant. YouTube is another video host for the same citations, not a new product surface.
- **Data model:** course → videos → timed chunks. A playlist is only a batch of videos with `order`. No playlist table.
- **Captions:** download official English captions when they exist; fall back to auto-captions; skip and log videos with no captions. Convert to SRT so `ingest.py` stays SRT/DFXP-only.
- **Helper:** one script, `scripts/prepare_youtube_playlist.py`, driven by playlist URL/ID + course name + output folder. Calls `yt-dlp` on PATH via subprocess. Not part of the FastAPI request path. No new pip package unless subprocess is genuinely insufficient.
- **URLs:** sidecar `source_url` is the YouTube watch URL (`https://www.youtube.com/watch?v=ID`). Frontend sniffs YouTube vs Kaltura from the URL. No `source_type` column.
- **Playback:** YouTube iframe `https://www.youtube.com/embed/ID?start=SECONDS` (sidebar modal uses `start=0`). Keep Kaltura `embedPlaykitJs` + `kalturaSeekFrom` unchanged. Also show an "Open on YouTube" link with `watch?v=ID&t=SECONDS` so embed-blocked videos still work.
- **Ingest:** do not change chunking, embeddings, or retrieval. After a successful ingest, move the course folder to `data/ingest_transcripts_complete/` as today.
- **Existing courses:** Kaltura source cards, neighbor chips, and sidebar behavior stay as they are.

## In Scope
- Offline playlist → SRT + JSON sidecar helper.
- Frontend URL branch so source cards and the sidebar modal can play YouTube at a timestamp.
- Operator ingest of one YouTube course once the playlist and course name are provided.
- README / architecture notes for the new helper and mixed Kaltura/YouTube `source_url` values.
- QA: helper output looks like an existing course folder; a YouTube source card seeks; a Kaltura source card still seeks; sidebar lists the new course.

## Out of Scope for Stage 3
- Playlist object in the database, or embedding a whole playlist iframe
- `source_type` (or provider) column; URL sniffing is enough
- Adding VTT/TTML-from-YouTube parsing to `ingest.py` if SRT conversion works
- Whisper / speech-to-text when a video has no captions
- YouTube Data API key in `.env` for the web app; live caption fetch at `/ask` time
- Nightly or incremental playlist sync
- Re-uploading YouTube videos into Kaltura
- Accounts, course filter, saved chats, streaming (already out of Stage 2)
- Sidebar ↔ chat highlight sync, playback memory, favorites

## Guiding Principles
- Build the smallest thing that gets one YouTube playlist into the existing index and player.
- Prefer converting YouTube captions into the formats ingest already understands.
- Detect provider from the URL at play time. Do not generalize the schema "for later providers."
- Each milestone should produce a working increment that can be tested before the next step.

## Milestone-Based Delivery Plan

### Milestone 1 — Frame Stage 3 Scope ✅
**Goal**: Lock Choice B and write the planning docs, with playlist URL and course name left as operator inputs.

**Tasks**
- [x] Lock Choice B (playlist helper → existing ingest → YouTube iframe branch)
- [x] Lock captions, URL, playback, and out-of-scope decisions
- [x] Write this high-level plan
- [x] Add Stage 3 notes to `aiDocs/context.md`, `aiDocs/prd.md`, `aiDocs/mvp.md`, and `aiDocs/architecture.md`
- [x] Write the Phase 1 plan and roadmap pair

**Exit criteria**
- Later work cannot treat a playlist table, Whisper, or a YouTube API in `/ask` as in-vision
- Phase 1 has a plan and a roadmap that reference this file
- Operator inputs (playlist URL, course display name, output folder) are written down as fill-ins, not guessed

### Milestone 2 — YouTube Playlist Ingest
**Goal**: A YouTube playlist can be prepared on disk, ingested like any other course, and watched from source cards and the sidebar at the cited timestamp.

**Tasks**
- [x] Write `scripts/prepare_youtube_playlist.py`
- [x] Branch the frontend player on Kaltura vs YouTube URLs
- [x] Smoke-test the helper on the real playlist (216 videos prepared; all captions and sidecars validated)
- [x] Generate files, ingest IS 5750 into local Docker, and confirm the course in the sidebar (216 videos, 559 chunks)
- [ ] Confirm existing Kaltura courses play from source cards and the modal (iframe URLs verified; player returned "Media stream error" on two archived entries)

**Exit criteria**
- Helper writes SRT + sidecars that `ingest.py` accepts without format changes
- A cited YouTube chunk opens an embed (or watch link) at the timestamp
- Kaltura playback is unchanged
- Videos with no captions are skipped and listed, not silently empty-ingested

See [Phase 1 plan](2026-09-12-phase-01-youtube-playlist-plan.md) and [roadmap](2026-09-12-phase-01-youtube-playlist-roadmap.md).

## Expected Outcome
By the end of Stage 3, one additional course whose videos live on YouTube can be asked about like the Kaltura courses: grounded answers, timestamps, in-chat watch, and a sidebar entry. The product remains a RAG prototype. The host of the video is an implementation detail of `source_url`.

## Operator inputs (fill in at implementation)

| Input | Value | Notes |
| --- | --- | --- |
| Playlist URL or ID | `https://www.youtube.com/playlist?list=PLA1SJqfgQFEGZfzeSsmgJlvhLlAsmv9h0` | Public or unlisted playlist the students can play |
| Course display name | `IS 5750: JavaScript for Absolute Beginners` | Sidecar `course` string |
| Output folder | `data/transcripts/IS5750/` | Pending ingest folder; archive after successful ingest |
| Caption language | `en` (default) | Change only if the playlist is not English |
