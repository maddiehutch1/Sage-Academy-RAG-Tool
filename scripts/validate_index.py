"""
Phase 2 index validation.

Embeds a question and retrieves the top-k most similar transcript chunks
from PostgreSQL to confirm the ingestion pipeline and vector index work.

Run this after scripts/ingest.py has completed successfully.

Usage
-----
    python scripts/validate_index.py
    python scripts/validate_index.py "What is the difference between WHERE and HAVING?"
"""

import os
import sys
from dotenv import load_dotenv
import psycopg2
from openai import OpenAI

load_dotenv()

EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
DATABASE_URL = os.getenv("DATABASE_URL")
TOP_K = 3

SAMPLE_QUESTIONS = [
    "What is the cloud and why are we using it?",
    "What are the costs associated with cloud computing?",
    "What tools will we be using in the cloud?",
    "What is the difference between vCPUs and cores?",
]

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def embed(text: str) -> list[float]:
    response = client.embeddings.create(input=text, model=EMBEDDING_MODEL)
    return response.data[0].embedding


def vector_to_pg(vec: list[float]) -> str:
    return "[" + ",".join(f"{v:.8f}" for v in vec) + "]"


def retrieve(cur, question: str) -> list[tuple]:
    vec_str = vector_to_pg(embed(question))
    cur.execute(
        """
        SELECT
            tc.chunk_text,
            v.title   AS video_title,
            c.name    AS course_name,
            tc.chunk_index,
            tc.embedding <=> %s::vector AS distance
        FROM transcript_chunks tc
        JOIN videos  v ON tc.video_id  = v.id
        JOIN courses c ON v.course_id  = c.id
        ORDER BY distance ASC
        LIMIT %s
        """,
        (vec_str, TOP_K),
    )
    return cur.fetchall()


def run_question(cur, question: str) -> None:
    print(f"\nQuestion: {question}")
    print("-" * 60)
    rows = retrieve(cur, question)
    if not rows:
        print("  No results. Run scripts/ingest.py first.")
        return
    for rank, (chunk_text, video_title, course_name, chunk_index, distance) in enumerate(rows, 1):
        preview = chunk_text[:200].replace("\n", " ")
        print(f"  [{rank}] distance={distance:.4f}  chunk={chunk_index}")
        print(f"       Course : {course_name}")
        print(f"       Video  : {video_title}")
        print(f"       Excerpt: {preview}...")


def main() -> None:
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set in .env")
        sys.exit(1)
    if not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "your-openai-api-key":
        print("ERROR: OPENAI_API_KEY not set in .env")
        sys.exit(1)

    questions = [" ".join(sys.argv[1:])] if len(sys.argv) > 1 else SAMPLE_QUESTIONS

    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            for q in questions:
                run_question(cur, q)
    finally:
        conn.close()

    print("\nValidation complete.")


if __name__ == "__main__":
    main()
