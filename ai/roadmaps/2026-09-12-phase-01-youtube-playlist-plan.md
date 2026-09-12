# Phase 1 Plan: YouTube Playlist Ingest

Date: 2026-09-12

See `ai/roadmaps/2026-09-12-phase-01-youtube-playlist-roadmap.md` for the step-by-step implementation roadmap.
See `ai/roadmaps/2026-09-12-high-level-plan-stage-3.md` Milestone 2 for how this phase sits in Stage 3.

## Engineering Philosophy
**Avoid over-engineering, cruft, and legacy-compatibility features.**

This is a clean-start project with no existing users, no existing data, and no migration debt. Every layer of abstraction must earn its place. If a simpler approach works, use it. Delete code freely. Build for what's needed now, not for hypothetical future requirements.

## Context
All five live courses are Kaltura-hosted. Transcripts are `.srt` or `.dfxp` with a JSON sidecar (`course`, `video`, `source_url`, `order`). `ingest.py` chunks those files; the frontend assumes `source_url` is a Kaltura `extwidget/preview` URL and rewrites it to `embedPlaykitJs` with `kalturaSeekFrom`.

A new course needs videos from a YouTube playlist. Retrieval does not care about the host. The gaps are (1) getting timed captions onto disk in the existing sidecar layout, and (2) playing a YouTube URL in source cards and the sidebar modal.

Stage 3 locked **Choice B**: an offline playlist helper writes SRT + sidecars; existing ingest indexes them; the frontend branches on URL shape. Playlist URL and course name are operator inputs and may not be available on the first implementation day. Smoke-test the helper on a short public playlist if needed; delay the live ingest until the real inputs exist.

## Goal
Prepare one YouTube playlist as a normal course folder, ingest it with the current pipeline, and let students watch cited moments in-chat (and from the sidebar) the same way they watch Kaltura lectures.

## Scope

### In scope
- `scripts/prepare_youtube_playlist.py`: playlist → `.srt` + `.json` under `data/transcripts/<COURSE>/`.
- Frontend: parse YouTube watch / `youtu.be` / embed URLs; build `youtube.com/embed/ID?start=SECONDS`; keep Kaltura behavior; add an "Open on YouTube" fallback link.
- Use that player helper in source cards, neighbor chips, and the sidebar modal (`page.tsx` already imports `buildKalturaIframeSrc` from `SourceCards.tsx`).
- Operator ingest of the real course when the playlist and course name are filled in.
- Short README / architecture notes for the helper and mixed hosts.

### Out of scope
- Schema changes (`source_type`, playlist table, new columns).
- Changing `ingest.py` parsers, chunking, or embeddings. Convert captions to SRT instead of adding VTT.
- Whisper or any speech-to-text path for captionless videos.
- YouTube Data API, API keys in `.env`, or any YouTube call from FastAPI / `/ask`.
- Nightly sync, incremental updates, or re-download of an already-ingested playlist as a product feature (re-run the helper by hand if the playlist grows).
- Re-hosting videos in Kaltura.
- Stage 2 follow-ups, dual-example prompt, or markdown rendering changes.

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Prep vs ingest | Separate helper; `ingest.py` unchanged in spirit | Matches DATA1100 / DATA5300 "files on disk, then ingest." Keeps caption-download mess out of the indexer |
| Caption tool | `yt-dlp` on PATH, via subprocess | Lists a playlist and dumps captions without a YouTube API key or a new pip dependency |
| Caption preference | Official English subs, then auto-subs, then skip | Official text retrieves better; skipping is better than empty chunks |
| Caption format | Convert to `.srt` | Ingest already parses SRT; no `parse_vtt()` |
| Sidecar `source_url` | `https://www.youtube.com/watch?v=<id>` | Generic TEXT column; `sync_source_urls.py` still works |
| Provider detection | URL sniff in the frontend | Avoids a schema change for one extra host |
| YouTube embed | `https://www.youtube.com/embed/<id>?start=<sec>` | Same seek idea as `kalturaSeekFrom` |
| Embed-blocked videos | Keep a watch-URL link with `&t=<sec>s` | Some videos disable iframe playback; the citation must still be usable |
| Playlist in the DB | No | `video_order` already models sequence |
| Filenames | `{index:02d}_{youtube_id}.srt` (+ matching `.json`) | Stable, unique, independent of messy titles |
| Sidecar `video` title | YouTube title, trimmed / uniqued if needed | Ingest slugs `video_id` from the title (`VARCHAR(100)`). Helper must not emit colliding or huge slugs |
| Videos with no captions | Skip + print a list at the end | Do not invent transcript text |

## Helper contract

CLI shape (names can be tightened in implementation, not expanded):

```text
python scripts/prepare_youtube_playlist.py \
  --playlist <URL_OR_ID> \
  --course "<COURSE CODE: Human Title>" \
  --outdir data/transcripts/<COURSECODE>
```

Optional later flags only if needed while implementing: `--lang en` (default), `--limit N` for smoke tests. Do not add a config file or interactive wizard.

For each playlist item the script should:

1. Read playlist index (1-based) and YouTube video id + title.
2. Try official English captions, then auto-captions.
3. Write `<outdir>/{index:02d}_{id}.srt` and a sidecar:

```json
{
  "course": "<value of --course>",
  "video": "<YouTube title, sanitized>",
  "source_url": "https://www.youtube.com/watch?v=<id>",
  "order": <playlist index>
}
```

4. If captions are missing or the video is unavailable, skip and record the id/title/reason.

`yt-dlp` is a **local operator tool**, not a production web dependency. Do not add it to the FastAPI/Next image. Document "install `yt-dlp` on the machine that runs the helper."

Do not download video files (`--skip-download`). Do not write `.vtt` into `data/transcripts/` if an SRT can be produced.

## Frontend contract

Today `buildKalturaIframeSrc` returns the original string when the Kaltura regex misses. A YouTube watch URL in an iframe will not play or seek.

Replace the call sites with one helper, still in `frontend/app/SourceCards.tsx` (exported for `page.tsx`):

- If the URL matches the existing Kaltura `extwidget/preview` pattern → current `embedPlaykitJs` + `kalturaSeekFrom`.
- If the URL is YouTube (`watch?v=`, `youtu.be/`, `/embed/`) → `https://www.youtube.com/embed/<id>?start=<seconds>` (`autoplay` optional; do not fight the existing Kaltura autoplay behavior more than needed).
- Otherwise return the URL unchanged (null `source_url` still shows "Video link not available yet").

On YouTube source cards, also render a plain "Open on YouTube" link to `https://www.youtube.com/watch?v=<id>&t=<seconds>s`. Do not build a runtime "did the embed fail?" detector.

Kaltura cards do not need a YouTube link.

## Operator inputs (fill in before live ingest)

| Input | Value |
| --- | --- |
| Playlist URL or ID | _TBD_ |
| Course display name (`--course`) | _TBD_ |
| Output folder (`--outdir`) | _TBD_ |

Until those are filled, implement and smoke-test against a short **public** playlist. Do not invent the real course name in sidecars.

## Files expected to change

| File | Change |
| --- | --- |
| `scripts/prepare_youtube_playlist.py` | New helper |
| `frontend/app/SourceCards.tsx` | YouTube parse + `buildVideoIframeSrc` (or extend the current builder); "Open on YouTube" on YouTube cards |
| `frontend/app/page.tsx` | Sidebar modal uses the shared builder so YouTube library items play |
| `README.md` | Helper usage, `yt-dlp` prerequisite, YouTube `source_url` examples |
| `aiDocs/architecture.md` | After implementation: YouTube as a second `source_url` host |

No schema changes. No new npm packages. No new pip packages unless subprocess + `yt-dlp` on PATH is blocked, in which case stop and decide — do not quietly add `google-api-python-client`.

`scripts/ingest.py` and `scripts/sync_source_urls.py` should not need edits. If ingest's `video_id` slug collides or exceeds 100 characters, fix it in the helper's title sanitization first, not by growing ingest.

## Assumptions
- The playlist is public or unlisted, and students can play the watch URLs without extra auth.
- At least some videos have English captions (official or auto). Captionless videos are omitted from the index.
- Operator has `yt-dlp` available when running the helper.
- Live ingest still uses `DATABASE_URL` in `.env` (Render for production index, local Docker for a dry run). Confirm which target before embedding.

## Deliverables
- [ ] Playlist helper that writes SRT + sidecars ingest already understands
- [ ] Source cards + sidebar modal play YouTube at a timestamp (Kaltura unchanged)
- [ ] "Open on YouTube" fallback on YouTube cards
- [ ] README note for the helper
- [ ] Live course ingest **or** a written deferral if operator inputs are still TBD (helper + player still ship)

## Exit Criteria
- Running the helper on a playlist produces a course folder `ingest.py` can index without parser changes.
- Asking a question that retrieves a YouTube chunk shows a watchable embed (or watch link) at the cited time.
- Asking a question that retrieves a Kaltura chunk still seeks with `kalturaSeekFrom`.
- The new course appears in the sidebar, grouped and ordered, and the modal opens the YouTube player at t=0.
- Videos without captions are listed as skipped, not stored as empty transcripts.
- No playlist table, no `source_type` column, no YouTube I/O inside `/ask`.
