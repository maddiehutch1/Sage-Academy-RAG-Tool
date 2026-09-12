"""
Retrieval layer for Phase 3.

Embeds a user question using the same model as the ingestion pipeline
and returns the top-k most similar transcript chunks from PostgreSQL.
"""

import os
import re
from openai import OpenAI
from dotenv import load_dotenv
from db import get_conn

load_dotenv()

EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
TOP_K = 5
# Chunks with cosine distance above this are too far off-topic to be useful.
# Based on eval data: legitimate answers score 0.36–0.54; 0.65 gives clear headroom.
MAX_DISTANCE = float(os.getenv("MAX_RETRIEVAL_DISTANCE", "0.65"))

# Short / deictic follow-ups should retrieve against the last substantial user
# question, not against "explain that" itself. Keep this list small and literal.
FOLLOW_UP_HINTS = (
    "explain that",
    "explain this",
    "what does that",
    "what does this",
    "tell me more",
    "say more",
    "more simply",
    "simpler version",
    "make it simpler",
    "generic example",
    "generic layout",
    "more generic",
    "in other words",
    "why is that",
    "how does that",
    "can you elaborate",
)
_DEICTIC = re.compile(r"\b(that|this|those|these)\b", re.IGNORECASE)
_SHORT_FOLLOW_UP_WORDS = 10

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def is_follow_up(text: str) -> bool:
    lowered = text.lower().strip()
    if not lowered:
        return False
    if any(hint in lowered for hint in FOLLOW_UP_HINTS):
        return True
    words = lowered.split()
    return len(words) <= _SHORT_FOLLOW_UP_WORDS and bool(_DEICTIC.search(lowered))


def retrieval_anchor(question: str, prior_user_questions: list[str]) -> str | None:
    """
    For follow-ups, return the last substantial prior user question to concat
    into the embedding. New standalone questions return None (embed current only).
    """
    priors = [q.strip() for q in prior_user_questions if q and q.strip()]
    if not priors or not is_follow_up(question):
        return None
    for prior in reversed(priors):
        if not is_follow_up(prior):
            return prior
    return priors[0]


def _embed(text: str) -> list[float]:
    response = client.embeddings.create(input=text, model=EMBEDDING_MODEL)
    return response.data[0].embedding


def _vector_to_pg(vec: list[float]) -> str:
    return "[" + ",".join(f"{v:.8f}" for v in vec) + "]"


def retrieve_chunks(
    question: str,
    top_k: int = TOP_K,
    previous_question: str | None = None,
) -> list[dict]:
    """
    Embed the question and return the top-k nearest transcript chunks.

    If previous_question is provided (follow-up turns), embed the previous
    user question and the current question together. TOP_K and MAX_DISTANCE
    stay the same.

    Each result dict contains:
        chunk_text, course, video, chunk_index, start_time, end_time, distance
    """
    embed_text = f"{previous_question}\n{question}" if previous_question else question
    vec_str = _vector_to_pg(_embed(embed_text))

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    tc.chunk_text,
                    c.name        AS course,
                    v.title       AS video,
                    v.source_url  AS source_url,
                    v.video_order AS video_order,
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
            "chunk_text":  row[0],
            "course":      row[1],
            "video":       row[2],
            "source_url":  row[3],
            "video_order": row[4],
            "chunk_index": row[5],
            "start_time":  row[6],
            "end_time":    row[7],
            "distance":    row[8],
        }
        for row in rows
        if row[8] <= MAX_DISTANCE
    ]
