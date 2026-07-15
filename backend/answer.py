"""
Answer generation layer for Phase 3.

Takes retrieved transcript chunks and the original question,
builds a grounded prompt, and returns a GPT-generated answer
together with source citation metadata.
"""

import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """\
You are a helpful academic assistant for Sage Academy.
Answer the student's question using ONLY the course transcript excerpts provided below.
If the answer cannot be found in the excerpts, say so clearly — do not invent information.
Keep your answer concise, accurate, and easy for a student to understand.
"""


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
            "chunk_index": chunk["chunk_index"],
            "start_time":  chunk["start_time"],
            "end_time":    chunk["end_time"],
            "excerpt":     chunk["chunk_text"][:200],
        }
        for chunk in chunks
    ]

    return {"answer": answer_text, "sources": sources}
