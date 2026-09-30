import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path


def run_ytdlp(arguments: list[str]) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(
            ["yt-dlp", *arguments],
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
    except FileNotFoundError as exc:
        raise RuntimeError(
            "yt-dlp was not found on PATH. Install it on the machine running this helper."
        ) from exc


def list_playlist(playlist: str) -> list[dict]:
    result = run_ytdlp([
        "--flat-playlist",
        "--dump-single-json",
        "--skip-download",
        "--no-warnings",
        playlist,
    ])
    if result.returncode != 0:
        detail = result.stderr.strip() or "yt-dlp could not read the playlist"
        raise RuntimeError(detail)

    try:
        playlist_data = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError("yt-dlp returned invalid playlist JSON") from exc

    entries = playlist_data.get("entries") or []
    return [entry for entry in entries if entry]


def title_slug(title: str) -> str:
    return title.lower().replace(" ", "-")


def existing_video_slugs(output_dir: Path) -> set[str]:
    data_dir = output_dir.parent.parent
    slugs = set()
    for folder_name in ("transcripts", "ingest_transcripts_complete"):
        folder = data_dir / folder_name
        if not folder.exists():
            continue
        for sidecar in folder.rglob("*.json"):
            try:
                title = json.loads(sidecar.read_text(encoding="utf-8-sig")).get("video")
            except (OSError, json.JSONDecodeError):
                continue
            if title:
                slugs.add(title_slug(title))
    return slugs


def unique_video_title(
    title: str,
    course: str,
    video_id: str,
    order: int,
    used_slugs: set[str],
) -> str:
    clean_title = re.sub(r"\s+", " ", title).strip() or video_id
    course_label = course.split(":", 1)[0].strip() or course.strip()
    suffix = ""
    candidate = clean_title

    if len(title_slug(candidate)) > 100:
        suffix = f" - {course_label}"

    if title_slug(candidate + suffix) in used_slugs:
        suffix = f" - {course_label}"
    if title_slug(candidate + suffix) in used_slugs:
        suffix = f" - {course_label} - {video_id}"
    if title_slug(candidate + suffix) in used_slugs:
        suffix = f" - {course_label} - {video_id} - {order}"

    max_title_length = 100 - len(title_slug(suffix))
    candidate = candidate[:max_title_length].rstrip()
    result = f"{candidate}{suffix}"
    used_slugs.add(title_slug(result))
    return result


def download_subtitle(video_id: str, language: str) -> tuple[str | None, str | None]:
    watch_url = f"https://www.youtube.com/watch?v={video_id}"
    errors = []

    for subtitle_flag, label in (("--write-subs", "official subtitles"), ("--write-auto-subs", "auto subtitles")):
        with tempfile.TemporaryDirectory(prefix="sage-youtube-") as temp_dir:
            output_template = str(Path(temp_dir) / "%(id)s.%(ext)s")
            result = run_ytdlp([
                "--skip-download",
                subtitle_flag,
                "--sub-langs",
                f"{language}.*",
                "--sub-format",
                "srt/best",
                "--convert-subs",
                "srt",
                "--output",
                output_template,
                "--no-warnings",
                watch_url,
            ])
            subtitle_files = sorted(Path(temp_dir).glob("*.srt"))
            if result.returncode == 0 and subtitle_files:
                return subtitle_files[0].read_text(encoding="utf-8-sig"), None

            detail = result.stderr.strip()
            if detail:
                errors.append(f"{label}: {detail.splitlines()[-1]}")

    if errors:
        return None, "; ".join(errors)
    return None, f"no {language} captions found"


def prepare_playlist(
    playlist: str,
    course: str,
    output_dir: Path,
    language: str = "en",
    limit: int | None = None,
) -> tuple[int, list[tuple[str, str, str]]]:
    entries = list_playlist(playlist)
    if limit is not None:
        entries = entries[:limit]

    if not entries:
        raise RuntimeError("The playlist did not contain any videos.")

    output_dir.mkdir(parents=True, exist_ok=True)
    used_slugs = existing_video_slugs(output_dir)
    skipped = []
    written = 0

    for position, entry in enumerate(entries, start=1):
        order = entry.get("playlist_index") or position
        video_id = entry.get("id")
        title = entry.get("title") or "Untitled video"
        if not video_id:
            skipped.append(("unknown", title, "playlist entry has no video id"))
            continue

        stem = f"{int(order):02d}_{video_id}"
        subtitle_path = output_dir / f"{stem}.srt"
        sidecar_path = output_dir / f"{stem}.json"
        if subtitle_path.exists() or sidecar_path.exists():
            raise RuntimeError(f"Refusing to overwrite existing output for video {video_id}: {stem}")

        subtitle, reason = download_subtitle(video_id, language)
        if not subtitle or not subtitle.strip():
            skipped.append((video_id, title, reason or "empty captions"))
            continue

        clean_title = unique_video_title(title, course, video_id, int(order), used_slugs)
        metadata = {
            "course": course,
            "video": clean_title,
            "source_url": f"https://www.youtube.com/watch?v={video_id}",
            "order": int(order),
        }
        subtitle_path.write_text(subtitle.rstrip() + "\n", encoding="utf-8")
        sidecar_path.write_text(
            json.dumps(metadata, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        written += 1
        print(f"[OK] {int(order):02d} {clean_title}")

    print(f"\nPrepared {written} video(s) in {output_dir}")
    if skipped:
        print(f"Skipped {len(skipped)} video(s):")
        for video_id, title, reason in skipped:
            print(f"  [SKIP] {video_id} | {title} | {reason}")
    return written, skipped


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Download YouTube playlist captions as SRT files with Sage sidecars."
    )
    parser.add_argument("--playlist", required=True, help="YouTube playlist URL or ID")
    parser.add_argument("--course", required=True, help="Course display name for each sidecar")
    parser.add_argument("--outdir", required=True, type=Path, help="Output course folder")
    parser.add_argument("--lang", default="en", help="Caption language (default: en)")
    parser.add_argument("--limit", type=int, help="Maximum videos to process, for smoke tests")
    args = parser.parse_args()

    if args.limit is not None and args.limit < 1:
        parser.error("--limit must be greater than zero")

    try:
        prepare_playlist(args.playlist, args.course, args.outdir, args.lang, args.limit)
    except (RuntimeError, OSError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())