"""
Sync source_url values from JSON sidecar files into the videos table.

Run this any time you add or update a source_url in a sidecar .json without
wanting to re-run the full ingest (which re-embeds everything).

Usage
-----
    python scripts/sync_source_urls.py

What it does
------------
- Scans all .json sidecar files under data/transcripts/ recursively.
- For each file that has a non-null source_url, finds the matching row in
  the videos table by (title, course name) and updates source_url.
- Prints a summary of updates made and any sidecars it could not match.
"""

import json
import sys
from pathlib import Path

import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

TRANSCRIPTS_DIR = Path(__file__).parent.parent / "data" / "transcripts"
DATABASE_URL = os.getenv("DATABASE_URL")


def main() -> None:
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set in .env")
        sys.exit(1)

    sidecar_files = sorted(TRANSCRIPTS_DIR.rglob("*.json"))
    if not sidecar_files:
        print(f"No .json sidecar files found under {TRANSCRIPTS_DIR}")
        sys.exit(0)

    print(f"Found {len(sidecar_files)} sidecar file(s). Scanning for source_url values...\n")

    updated = 0
    skipped_no_url = 0
    skipped_no_match = 0

    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn:
            with conn.cursor() as cur:
                for path in sidecar_files:
                    try:
                        data = json.loads(path.read_text(encoding="utf-8"))
                    except Exception as exc:
                        print(f"  [SKIP] {path.name} -- could not parse JSON: {exc}")
                        continue

                    source_url = data.get("source_url")
                    course_name = data.get("course")
                    video_title = data.get("video")

                    if not source_url:
                        skipped_no_url += 1
                        continue

                    if not course_name or not video_title:
                        print(f"  [SKIP] {path.name} -- missing 'course' or 'video' key")
                        skipped_no_match += 1
                        continue

                    cur.execute(
                        """
                        UPDATE videos
                        SET    source_url = %s
                        FROM   courses
                        WHERE  videos.course_id = courses.id
                          AND  videos.title      = %s
                          AND  courses.name       = %s
                        """,
                        (source_url, video_title, course_name),
                    )

                    if cur.rowcount > 0:
                        print(f"  [OK]   {path.name} -- updated source_url for '{video_title}'")
                        updated += 1
                    else:
                        print(f"  [MISS] {path.name} -- no DB row found for '{video_title}' / '{course_name}' (not yet ingested?)")
                        skipped_no_match += 1

        print(f"\nDone. {updated} updated, {skipped_no_url} skipped (no URL), {skipped_no_match} not found in DB.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
