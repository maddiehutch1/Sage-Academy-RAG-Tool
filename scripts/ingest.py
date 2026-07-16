"""
Phase 2 ingestion pipeline.

Reads SRT transcript files from data/transcripts/, groups subtitle entries
into overlapping token-bounded chunks with real timestamps, generates OpenAI
embeddings, and stores everything in PostgreSQL with pgvector.

Each .srt file must have a companion .json sidecar in the same folder with
the following fields:
    {
        "course": "Course Name",
        "video": "Video Title",
        "source_url": "https://..."   (optional, omit or null if unknown)
    }

Usage
-----
    python scripts/ingest.py
"""

import json
import os
import re
import sys
from pathlib import Path

import psycopg2
import tiktoken
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

TRANSCRIPTS_DIR = Path(__file__).parent.parent / "data" / "transcripts"
CHUNK_MAX_TOKENS = 400
CHUNK_OVERLAP_ENTRIES = 5   # SRT entries to carry over between chunks for context
EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
DATABASE_URL = os.getenv("DATABASE_URL")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
enc = tiktoken.get_encoding("cl100k_base")

# Matches speaker labels like "INSTRUCTOR: " or "STUDENT A: " at line start
SPEAKER_RE = re.compile(r"^[A-Z][A-Z\s]+:\s*")


# ---------------------------------------------------------------------------
# SRT parsing
# ---------------------------------------------------------------------------

def srt_time_to_seconds(ts: str) -> int:
    """Convert HH:MM:SS,mmm to integer seconds."""
    h, m, rest = ts.split(":")
    s, _ = rest.split(",")
    return int(h) * 3600 + int(m) * 60 + int(s)


def parse_srt(path: Path) -> list[dict]:
    """
    Parse an SRT file into a list of entries:
        {"start_sec": int, "end_sec": int, "text": str}
    Skips empty entries and strips speaker labels.
    """
    raw = path.read_text(encoding="utf-8")
    blocks = re.split(r"\n\s*\n", raw.strip())
    entries = []

    for block in blocks:
        lines = block.strip().splitlines()
        if len(lines) < 3:
            continue

        time_match = re.match(
            r"(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})",
            lines[1],
        )
        if not time_match:
            continue

        start_sec = srt_time_to_seconds(time_match.group(1))
        end_sec = srt_time_to_seconds(time_match.group(2))

        # Join multi-line subtitle text; strip speaker labels
        text = " ".join(lines[2:]).strip()
        text = SPEAKER_RE.sub("", text).strip()

        if text:
            entries.append({"start_sec": start_sec, "end_sec": end_sec, "text": text})

    return entries


def load_sidecar(srt_path: Path) -> dict:
    """Load companion .json metadata file for a given .srt path."""
    sidecar = srt_path.with_suffix(".json")
    if not sidecar.exists():
        raise FileNotFoundError(
            f"Missing metadata sidecar: {sidecar}\n"
            f"Create a JSON file with keys: course, video, source_url (optional)."
        )
    with sidecar.open(encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

def chunk_entries(entries: list[dict], max_tokens: int, overlap_entries: int) -> list[dict]:
    """
    Group SRT entries into overlapping token-bounded chunks.
    Returns list of:
        {"text": str, "start_sec": int, "end_sec": int}
    """
    chunks = []
    start_idx = 0

    while start_idx < len(entries):
        token_count = 0
        end_idx = start_idx

        while end_idx < len(entries):
            entry_tokens = len(enc.encode(entries[end_idx]["text"]))
            if token_count + entry_tokens > max_tokens and end_idx > start_idx:
                break
            token_count += entry_tokens
            end_idx += 1

        group = entries[start_idx:end_idx]
        chunks.append({
            "text": " ".join(e["text"] for e in group),
            "start_sec": group[0]["start_sec"],
            "end_sec": group[-1]["end_sec"],
        })

        if end_idx >= len(entries):
            break

        # Step forward but keep the last `overlap_entries` for context
        start_idx = max(start_idx + 1, end_idx - overlap_entries)

    return chunks


# ---------------------------------------------------------------------------
# Embeddings
# ---------------------------------------------------------------------------

def embed(text: str) -> list[float]:
    response = client.embeddings.create(input=text, model=EMBEDDING_MODEL)
    return response.data[0].embedding


def vector_to_pg(vec: list[float]) -> str:
    """Format a float list as a pgvector literal string."""
    return "[" + ",".join(f"{v:.8f}" for v in vec) + "]"


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_or_create_course(cur, name: str) -> int:
    cur.execute("SELECT id FROM courses WHERE name = %s", (name,))
    row = cur.fetchone()
    if row:
        return row[0]
    course_id = name.lower().replace(" ", "-")
    cur.execute(
        "INSERT INTO courses (course_id, name) VALUES (%s, %s) RETURNING id",
        (course_id, name),
    )
    return cur.fetchone()[0]


def get_or_create_video(
    cur, course_db_id: int, title: str, source_url: str | None, transcript_path: str
) -> int:
    cur.execute(
        "SELECT id FROM videos WHERE title = %s AND course_id = %s",
        (title, course_db_id),
    )
    row = cur.fetchone()
    if row:
        return row[0]
    video_id = title.lower().replace(" ", "-")
    cur.execute(
        """
        INSERT INTO videos (video_id, course_id, title, source_url, transcript_path)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
        """,
        (video_id, course_db_id, title, source_url, transcript_path),
    )
    return cur.fetchone()[0]


# ---------------------------------------------------------------------------
# Per-file ingestion
# ---------------------------------------------------------------------------

def ingest_file(cur, srt_path: Path) -> None:
    print(f"\nIngesting: {srt_path.name}")

    meta = load_sidecar(srt_path)
    course_name = meta.get("course")
    video_title = meta.get("video")
    source_url = meta.get("source_url")

    if not course_name or not video_title:
        print("  Skipping — sidecar JSON missing 'course' or 'video' key.")
        return

    entries = parse_srt(srt_path)
    if not entries:
        print("  Skipping — no valid subtitle entries found.")
        return

    print(f"  Parsed {len(entries)} subtitle entries")

    course_db_id = get_or_create_course(cur, course_name)
    video_db_id = get_or_create_video(
        cur, course_db_id, video_title, source_url, str(srt_path)
    )

    # Idempotent: clear existing chunks before re-inserting
    cur.execute("DELETE FROM transcript_chunks WHERE video_id = %s", (video_db_id,))

    chunks = chunk_entries(entries, CHUNK_MAX_TOKENS, CHUNK_OVERLAP_ENTRIES)
    print(f"  {len(chunks)} chunk(s) -> '{video_title}'")

    for i, chunk in enumerate(chunks):
        vec = embed(chunk["text"])
        cur.execute(
            """
            INSERT INTO transcript_chunks
                (video_id, chunk_text, chunk_index, start_time, end_time, embedding)
            VALUES (%s, %s, %s, %s, %s, %s::vector)
            """,
            (
                video_db_id,
                chunk["text"],
                i,
                chunk["start_sec"],
                chunk["end_sec"],
                vector_to_pg(vec),
            ),
        )
        print(f"  Stored chunk {i}  [{chunk['start_sec']}s – {chunk['end_sec']}s]  "
              f"({len(enc.encode(chunk['text']))} tokens)")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set in .env")
        sys.exit(1)
    if not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "your-openai-api-key":
        print("ERROR: OPENAI_API_KEY not set in .env — add your real key before running.")
        sys.exit(1)

    files = sorted(TRANSCRIPTS_DIR.glob("*.srt"))
    if not files:
        print(f"No .srt files found in {TRANSCRIPTS_DIR}")
        sys.exit(1)

    print(f"Found {len(files)} SRT file(s) in {TRANSCRIPTS_DIR}")

    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn:
            with conn.cursor() as cur:
                for path in files:
                    ingest_file(cur, path)
        print("\nIngestion complete.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
