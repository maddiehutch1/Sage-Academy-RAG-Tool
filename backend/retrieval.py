"""
Retrieval layer for Phase 3.

Embeds a user question using the same model as the ingestion pipeline
and returns the top-k most similar transcript chunks from PostgreSQL.
"""

import os
from openai import OpenAI
from dotenv import load_dotenv
from db import get_conn

load_dotenv()

EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
TOP_K = 5

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _embed(text: str) -> list[float]:
    response = client.embeddings.create(input=text, model=EMBEDDING_MODEL)
    return response.data[0].embedding


def _vector_to_pg(vec: list[float]) -> str:
    return "[" + ",".join(f"{v:.8f}" for v in vec) + "]"


def retrieve_chunks(question: str, top_k: int = TOP_K) -> list[dict]:
    """
    Embed the question and return the top-k nearest transcript chunks.

    Each result dict contains:
        chunk_text, course, video, chunk_index, start_time, end_time, distance
    """
    vec_str = _vector_to_pg(_embed(question))

    conn = get_conn()
    try:
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
                (vec_str, top_k),
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    return [
        {
            "chunk_text": row[0],
            "course":     row[1],
            "video":      row[2],
            "chunk_index": row[3],
            "start_time":  row[4],
            "end_time":    row[5],
            "distance":    row[6],
        }
        for row in rows
    ]
