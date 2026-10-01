# Phase 1 Roadmap: YouTube Playlist Ingest

Date: 2026-09-12

See `ai/roadmaps/2026-09-12-phase-01-youtube-playlist-plan.md` for goal, decisions, and exit criteria.

**Avoid over-engineering, cruft, and legacy-compatibility features.** This phase is one helper script plus a frontend URL branch. Do not add a playlist table, a `source_type` column, VTT parsing in `ingest.py`, Whisper, or a YouTube client inside FastAPI.

## Steps

1. [x] Confirm operator inputs.
   - Playlist: `https://www.youtube.com/playlist?list=PLA1SJqfgQFEGZfzeSsmgJlvhLlAsmv9h0`
   - Course display name: `IS 5750: JavaScript for Absolute Beginners`
   - Pending output folder: `data/transcripts/IS5750/`

2. [x] Confirm `yt-dlp` is available on the machine that will run the helper.
   - `yt-dlp --version`
   - Installed in the repository `.venv` with `python -m pip install yt-dlp`; added `.venv/Scripts` to PATH for helper runs. It is not a web-app dependency.

3. [x] Add and run `scripts/prepare_youtube_playlist.py`.
   - Args: `--playlist`, `--course`, `--outdir`. Optional `--lang` (default `en`) and `--limit` only if useful for smoke-test.
   - Resolve playlist items (index, id, title) with `yt-dlp` subprocess. `--flat-playlist` / print fields; do not download video bytes (`--skip-download`).
   - For each item: prefer official English subs, then auto-subs; convert to SRT; write `{index:02d}_{id}.srt`.
   - Write a matching `.json` sidecar: `course`, `video`, `source_url` (`https://www.youtube.com/watch?v=<id>`), `order` (playlist index).
   - Sanitize `video` titles so ingest's slug (`title.lower().replace(" ", "-")`) stays unique and fits `videos.video_id VARCHAR(100)`. Add the course code to duplicate titles; use the YouTube id only if the course-qualified title still collides.
   - Skip captionless / unavailable videos; print a skip list at the end (id, title, reason). Print a success count.

4. [x] Smoke-test the helper on the real playlist.
   - Prepared all 216 videos in `data/transcripts/IS5750/`; no videos were skipped.
   - Confirmed 216 paired SRT/JSON files, valid sidecar fields, unique order 1–216, and valid timestamped captions.
   - Existing `ingest.parse_srt()` parsed all 216 files (19,695 subtitle entries; zero empty parses).

5. [x] Add YouTube URL helpers in `frontend/app/SourceCards.tsx`.
   - Parse video id from `watch?v=`, `youtu.be/`, and `/embed/` URLs.
   - `buildVideoIframeSrc(sourceUrl, startSec)` (name can stay close to the existing Kaltura helper): Kaltura pattern → current `embedPlaykitJs` + `kalturaSeekFrom`; YouTube → `https://www.youtube.com/embed/<id>?start=<startSec>`; else return the original URL.
   - Keep `parseKalturaUrl` / Kaltura seek behavior byte-for-byte for existing URLs.
   - Point source-card and neighbor iframes at the shared builder.

6. [x] YouTube fallback link on source cards.
   - When `source_url` is YouTube, show "Open on YouTube" → `https://www.youtube.com/watch?v=<id>&t=<start_time>s`.
   - Do not add that link on Kaltura cards.
   - Do not add embed-failure detection.

7. [x] Sidebar modal in `frontend/app/page.tsx`.
   - Use the same builder (`startSec = 0`) so a YouTube library item plays in the modal.
   - Null `source_url` still shows "Video link not available yet."
   - Do not change sidebar fetch, accordion, or search.

8. [x] README.
   - Document the helper, `yt-dlp` as a local prerequisite, and that `source_url` may be Kaltura or YouTube.
   - Do not rewrite the ingest section; add a short "YouTube playlist" subsection next to the existing sidecar instructions.

9. [x] Ingest the course into local Docker.
   - Ran `python scripts/ingest.py`; the latest run exited successfully.
   - Verified local Postgres has 216 IS 5750 videos, 559 chunks, 216 YouTube URLs, and order 1–216.
   - Moved the verified course folder to `data/ingest_transcripts_complete/IS5750/`; `scripts/ingest.py` does not move it automatically.

10. [x] QA (production behavior confirmed by the project owner on 2026-09-30).
    - [x] Asked a question that returned IS 5750 sources; a source at 5:11 built `youtube.com/embed/O2UbjUJ5hgo?start=311` and the fallback URL used `t=311s`.
    - [x] Sidebar lists all 216 videos in order; its YouTube modal builds an embed at t=0.
    - [x] Kaltura source-card and modal builders produced the expected `embedPlaykitJs` URLs with `kalturaSeekFrom` (timestamp and t=0 respectively); Kaltura cards did not show the YouTube fallback.
   - [x] Confirm existing Kaltura playback in production (owner confirmation).
   - [x] Confirm sidebar modal close behavior and chat-thread behavior in production (owner confirmation).
   - [x] Confirm Stage 2 follow-up, dual-example, and markdown behavior in production (owner confirmation); these areas were not changed in Phase 1.
    - Optional: `python scripts/run_eval.py` against the index if the live course was ingested (existing questions should still retrieve; do not expand the eval set in this phase unless a YouTube-course smoke question is cheap and wanted).

11. [x] Close the phase after production QA confirmation.
   - [x] Check off Milestone 2 in `ai/roadmaps/2026-09-12-high-level-plan-stage-3.md`.
   - [x] Update `aiDocs/architecture.md` finalized decisions (YouTube as a second `source_url` host; helper path).
   - [x] Move this plan/roadmap pair to `ai/roadmaps/complete/`.
   - [x] Add a changelog entry.

## Implementation Notes
- Prefer subprocess to `yt-dlp` over a Python YouTube client. If `yt-dlp` cannot see the playlist (private, age-gate, etc.), stop and record it — do not add OAuth.
- `--limit` is only for smoke-test. The real run should process the full playlist.
- Do not commit `.srt` dumps of a throwaway public playlist. Commit the real course files when they are the intended corpus, same as other courses.
- Do not download mp4/webm. Captions only.
- `buildKalturaIframeSrc` call sites should all go through the shared builder so a future host is not half-updated. That is still two hosts, not a provider plugin system.
- If a YouTube video disables embedding, the iframe may show YouTube's error UI; the watch link is the supported fallback. Do not scrape or workaround that restriction.

## Output
A repeatable "playlist URL in → course folder out → ingest → watch at timestamp" path for one YouTube-hosted course, without changing how Kaltura courses are indexed or cited.
