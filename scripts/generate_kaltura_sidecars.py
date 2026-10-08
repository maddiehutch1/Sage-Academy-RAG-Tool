"""Generate transcript JSON sidecars from data/transcripts/course_vids.csv."""

import argparse
import csv
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).parent.parent
TRANSCRIPTS_DIR = ROOT / "data" / "transcripts"
MANIFEST_PATH = TRANSCRIPTS_DIR / "course_vids.csv"

COURSES = {
    "DATA5500": (
        "DATA 5500 Transcripts",
        "DATA 5500: Intro to Python for Data and Computer Science",
    ),
    "DATA5510": (
        "DATA 5510 Transcripts",
        "DATA 5510: Advanced Python and Data Structures",
    ),
}

# The transcript filenames and Kaltura display titles differ for these videos.
TITLE_ALIASES = {
    "AWS VSCode and GitHub Setup": "AWS VScode setup",
    "AWS_EC2_VSCode_Django_ReactExpo_Installation_Steps": (
        "AWS_EC2_VSCode_Django_ReactExpo_Installation_Steps-1"
    ),
    "Expo 1": "expo1_edited",
    "Expo 2 Routing continued": "Expo_2_edited",
    "Expo 3 Redux Integration": "Expo3_redux",
    "Creating AWS Account": "data3500_creating_AWS_account-1",
    "GitHub Updating Repo with New code": "github_updating_repo_with_new_code",
    "Graph Data Structure Overview": "Graphs Overview",
    "Graph Traversal": "Graphs Traversal",
    "Graphs - Python Network Library Example": "Graphs - Python Networkx Library Example",
    "But what is a neural network - Deep learning": (
        "But what is a neural network? | Chapter 1, Deep learning"
    ),
    "How ChatGPT Works - Working of ChatGPT in 6 Minutes": (
        "How ChatGPT Works? | Working of ChatGPT in 6 Minutes | ChatGPT For Beginners | Simplilearn"
    ),
    "Neural Network in 5 Minutes": (
        "Neural Network In 5 Minutes | What Is A Neural Network? | How Neural Networks Work | Simplilearn"
    ),
    "Quick Sort": "Quicksort",
    "Week 10 Exam Review": "week10_exam_review",
}


def normalize_title(title: str) -> str:
    return re.sub(r"[^a-z0-9]", "", title.casefold())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--write",
        action="store_true",
        help="Write sidecars after validating all transcript-to-video matches.",
    )
    args = parser.parse_args()

    with MANIFEST_PATH.open(encoding="utf-8-sig", newline="") as manifest_file:
        rows = list(csv.DictReader(manifest_file))

    rows_by_course_and_title = {}
    for row in rows:
        course_code = row.get("A", "").strip()
        title = row.get("C", "").strip()
        source_url = row.get("E", "").strip()
        if course_code not in COURSES or not title or not source_url:
            print(f"Invalid manifest row: {row}", file=sys.stderr)
            return 1
        key = (course_code, normalize_title(title))
        if key in rows_by_course_and_title:
            print(f"Duplicate manifest title: {course_code} / {title}", file=sys.stderr)
            return 1
        rows_by_course_and_title[key] = row

    matched_keys = set()
    planned = []
    unmatched_transcripts = []

    for course_code, (folder_name, course_name) in COURSES.items():
        folder = TRANSCRIPTS_DIR / folder_name
        transcript_files = sorted(folder.glob("*.srt"))
        course_matches = []

        for transcript_path in transcript_files:
            transcript_title = transcript_path.stem
            manifest_title = TITLE_ALIASES.get(transcript_title, transcript_title)
            key = (course_code, normalize_title(manifest_title))
            row = rows_by_course_and_title.get(key)
            if row is None:
                unmatched_transcripts.append(str(transcript_path.relative_to(ROOT)))
                continue
            if key in matched_keys:
                print(f"Manifest row matched more than once: {course_code} / {row['C']}", file=sys.stderr)
                return 1
            matched_keys.add(key)
            course_matches.append((row, transcript_path, course_name))

        # Use a contiguous order for videos that have transcripts.
        course_matches.sort(key=lambda match: rows.index(match[0]))
        for order, (row, transcript_path, course_name) in enumerate(course_matches, start=1):
            sidecar_path = transcript_path.with_suffix(".json")
            if sidecar_path.exists():
                print(f"Refusing to overwrite existing sidecar: {sidecar_path}", file=sys.stderr)
                return 1
            metadata = {
                "course": course_name,
                "video": row["C"].strip(),
                "source_url": row["E"].strip(),
                "order": order,
            }
            planned.append((sidecar_path, metadata))

    if unmatched_transcripts:
        print("Transcripts without a matching manifest row:", file=sys.stderr)
        for transcript in unmatched_transcripts:
            print(f"  {transcript}", file=sys.stderr)
        return 1

    unmatched_rows = [row for key, row in rows_by_course_and_title.items() if key not in matched_keys]
    print(f"Validated {len(planned)} transcript-to-video matches.")
    if unmatched_rows:
        print("Manifest videos without transcript files:")
        for row in unmatched_rows:
            print(f"  {row['A']}: {row['C']} ({row['D']})")

    if not args.write:
        print("Dry run only. Re-run with --write to create sidecars.")
        return 0

    for sidecar_path, metadata in planned:
        sidecar_path.write_text(
            json.dumps(metadata, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    print(f"Wrote {len(planned)} sidecar file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())