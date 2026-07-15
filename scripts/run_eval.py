"""
Phase 5 evaluation runner.

Loads questions from tests/eval_questions.json, runs each through the full
retrieval + answer pipeline, and writes a timestamped Markdown report to
tests/eval_results/.

Flags any question where the top chunk distance is above WARN_DISTANCE,
which indicates potentially weak retrieval.

Usage
-----
    python scripts/run_eval.py
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

import psycopg2
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

QUESTIONS_FILE = Path(__file__).parent.parent / "tests" / "eval_questions.json"
RESULTS_DIR    = Path(__file__).parent.parent / "tests" / "eval_results"
EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
CHAT_MODEL      = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
DATABASE_URL    = os.getenv("DATABASE_URL")
TOP_K           = 5
WARN_DISTANCE   = 0.55   # cosine distance above this is flagged as weak retrieval

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """\
You are a helpful academic assistant for Sage Academy.
Answer the student's question using ONLY the course transcript excerpts provided below.
If the answer cannot be found in the excerpts, say so clearly — do not invent information.
Keep your answer concise, accurate, and easy for a student to understand.
"""


# ---------------------------------------------------------------------------
# Helpers (duplicated from backend to keep scripts self-contained)
# ---------------------------------------------------------------------------

def _embed(text: str) -> list[float]:
    return client.embeddings.create(input=text, model=EMBEDDING_MODEL).data[0].embedding


def _vec_pg(vec: list[float]) -> str:
    return "[" + ",".join(f"{v:.8f}" for v in vec) + "]"


def retrieve(conn, question: str) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                tc.chunk_text,
                c.name        AS course,
                v.title       AS video,
                tc.chunk_index,
                tc.start_time,
                tc.end_time,
                tc.embedding <=> %s::vector AS distance
            FROM transcript_chunks tc
            JOIN videos  v ON tc.video_id  = v.id
            JOIN courses c ON v.course_id  = c.id
            ORDER BY distance ASC
            LIMIT %s
            """,
            (_vec_pg(_embed(question)), TOP_K),
        )
        rows = cur.fetchall()
    return [
        {
            "chunk_text":  r[0],
            "course":      r[1],
            "video":       r[2],
            "chunk_index": r[3],
            "start_time":  r[4],
            "end_time":    r[5],
            "distance":    r[6],
        }
        for r in rows
    ]


def answer(question: str, chunks: list[dict]) -> str:
    context_parts = []
    for i, c in enumerate(chunks, 1):
        m, s = divmod(c["start_time"], 60)
        context_parts.append(
            f"[Source {i}] {c['course']} — {c['video']} (~{m}:{s:02d})\n{c['chunk_text']}"
        )
    context = "\n\n".join(context_parts)
    user_msg = f"Transcript excerpts:\n\n{context}\n\nStudent question: {question}"

    resp = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_msg},
        ],
        temperature=0.2,
    )
    return resp.choices[0].message.content.strip()


def fmt_time(sec: int) -> str:
    m, s = divmod(sec, 60)
    return f"{m}:{s:02d}"


def keyword_hits(text: str, keywords: list[str]) -> list[str]:
    lower = text.lower()
    return [k for k in keywords if k.lower() in lower]


# ---------------------------------------------------------------------------
# Report builder
# ---------------------------------------------------------------------------

def run_eval() -> None:
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set."); sys.exit(1)
    if not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "your-openai-api-key":
        print("ERROR: OPENAI_API_KEY not set."); sys.exit(1)

    questions = json.loads(QUESTIONS_FILE.read_text(encoding="utf-8"))
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    report_path = RESULTS_DIR / f"eval_{timestamp}.md"

    conn = psycopg2.connect(DATABASE_URL)
    lines: list[str] = []
    warn_count = 0

    lines.append(f"# Eval Report — {timestamp}\n")
    lines.append(f"Model: `{CHAT_MODEL}` | Embedding: `{EMBEDDING_MODEL}` | top_k={TOP_K}\n")
    lines.append("---\n")

    try:
        for q in questions:
            qid      = q["id"]
            question = q["question"]
            topic    = q.get("topic", "")
            keywords = q.get("expected_keywords", [])

            print(f"\n[{qid}] {question}")

            chunks = retrieve(conn, question)
            generated = answer(question, chunks)

            top_dist   = chunks[0]["distance"] if chunks else 1.0
            is_weak    = top_dist > WARN_DISTANCE
            hits       = keyword_hits(generated, keywords)
            coverage   = f"{len(hits)}/{len(keywords)}" if keywords else "n/a"

            if is_weak:
                warn_count += 1

            flag = " ⚠️ WEAK RETRIEVAL" if is_weak else ""

            lines.append(f"## [{qid}] {question}{flag}\n")
            lines.append(f"**Topic:** {topic}  \n")
            lines.append(f"**Top chunk distance:** `{top_dist:.4f}`  \n")
            lines.append(f"**Keyword coverage:** {coverage} — `{hits}`  \n\n")

            lines.append("### Answer\n")
            lines.append(generated + "\n\n")

            lines.append("### Top Sources\n")
            for i, c in enumerate(chunks, 1):
                lines.append(
                    f"{i}. **{c['video']}** ({c['course']})  "
                    f"chunk {c['chunk_index']}  "
                    f"{fmt_time(c['start_time'])}–{fmt_time(c['end_time'])}  "
                    f"distance=`{c['distance']:.4f}`\n"
                )
                lines.append(f"   > {c['chunk_text'][:180]}…\n\n")

            lines.append("---\n")

            print(f"  distance={top_dist:.4f}  keywords={coverage}  {'⚠ WEAK' if is_weak else 'OK'}")
    finally:
        conn.close()

    lines.append(f"\n**Summary:** {len(questions)} questions, {warn_count} weak retrieval flag(s).\n")

    report_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nReport saved to: {report_path}")
    print(f"Summary: {len(questions)} questions, {warn_count} weak retrieval flag(s).")


if __name__ == "__main__":
    run_eval()
