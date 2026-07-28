"""
Answer generation layer for Phase 3.

Takes retrieved transcript chunks and the original question,
builds a grounded prompt, and returns a GPT-generated answer
together with source citation metadata.
"""

import os
from openai import OpenAI
from dotenv import load_dotenv
from db import get_conn

load_dotenv()

CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """\
You are a helpful academic assistant for Sage Academy.
Answer the student's question using the course transcript excerpts provided below.
Draw on the information in the excerpts, even when the answer requires combining details \
across multiple passages or reading between the lines.
If the excerpts contain no relevant information at all, say so — but do not refuse \
when the answer can reasonably be inferred from what is present.
Keep your answer concise, accurate, and easy for a student to understand.
"""


def _fetch_neighbors(
    course_name: str, video_order: int, conn
) -> tuple[dict | None, dict | None]:
    """
    Return (prev_video, next_video) dicts for the video immediately before and
    after `video_order` within the same course. Either may be None if the video
    is at the start or end of the course sequence.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT v.title, v.source_url, v.video_order
            FROM videos v
            JOIN courses c ON v.course_id = c.id
            WHERE c.name = %s
              AND v.video_order IN (%s, %s)
            ORDER BY v.video_order
            """,
            (course_name, video_order - 1, video_order + 1),
        )
        rows = cur.fetchall()

    prev_video: dict | None = None
    next_video: dict | None = None
    for title, source_url, order in rows:
        neighbor = {"title": title, "source_url": source_url, "video_order": order}
        if order == video_order - 1:
            prev_video = neighbor
        else:
            next_video = neighbor

    return prev_video, next_video


def _format_context(chunks: list[dict]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, 1):
        minutes = chunk["start_time"] // 60
        seconds = chunk["start_time"] % 60
        parts.append(
            f"[Source {i}] {chunk['course']} — {chunk['video']} "
            f"(~{minutes}:{seconds:02d})\n{chunk['chunk_text']}"
        )
    return "\n\n".join(parts)


def generate_answer(question: str, chunks: list[dict]) -> dict:
    """
    Call the LLM with the retrieved context and return:
        {
            "answer": str,
            "sources": [
                {
                    "course": str,
                    "video": str,
                    "chunk_index": int,
                    "start_time": int,   # seconds
                    "end_time": int,     # seconds
                    "excerpt": str       # first 200 chars of chunk
                },
                ...
            ]
        }
    """
    context = _format_context(chunks)
    user_message = f"Transcript excerpts:\n\n{context}\n\nStudent question: {question}"

    response = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_message},
        ],
        temperature=0.2,
    )

    answer_text = response.choices[0].message.content.strip()

    sources = [
        {
            "course":      chunk["course"],
            "video":       chunk["video"],
            "source_url":  chunk.get("source_url"),
            "video_order": chunk.get("video_order"),
            "chunk_index": chunk["chunk_index"],
            "start_time":  chunk["start_time"],
            "end_time":    chunk["end_time"],
            "excerpt":     chunk["chunk_text"][:200],
            "prev_video":  None,
            "next_video":  None,
        }
        for chunk in chunks
    ]

    try:
        conn = get_conn()
        for source in sources:
            order = source.get("video_order")
            if order is not None:
                prev_v, next_v = _fetch_neighbors(source["course"], order, conn)
                source["prev_video"] = prev_v
                source["next_video"] = next_v
        conn.close()
    except Exception:
        pass

    return {"answer": answer_text, "sources": sources}
