import os
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from retrieval import retrieve_chunks
from answer import generate_answer
from db import get_conn

load_dotenv()

app = FastAPI(title="Sage Academy RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AskRequest(BaseModel):
    question: str


class NeighborVideo(BaseModel):
    title: str
    source_url: Optional[str] = None
    video_order: int


class Source(BaseModel):
    course: str
    video: str
    source_url: Optional[str] = None
    video_order: Optional[int] = None
    chunk_index: int
    start_time: int
    end_time: int
    excerpt: str
    prev_video: Optional[NeighborVideo] = None
    next_video: Optional[NeighborVideo] = None


class AskResponse(BaseModel):
    answer: str
    sources: list[Source]


class VideoSummary(BaseModel):
    video_id: str
    title: str
    source_url: Optional[str] = None
    video_order: Optional[int] = None


class CourseWithVideos(BaseModel):
    course_id: str
    course_name: str
    videos: list[VideoSummary]


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "sage-academy-rag-api"}


@app.post("/ask", response_model=AskResponse)
def ask(body: AskRequest):
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question must not be empty.")

    chunks = retrieve_chunks(question)
    if not chunks:
        return AskResponse(
            answer="I wasn't able to find relevant course content for that question. "
                   "Try rephrasing, or ask something related to the course topics.",
            sources=[],
        )

    result = generate_answer(question, chunks)

    _log_question(question, result["answer"], chunks[0])

    return AskResponse(answer=result["answer"], sources=result["sources"])


@app.get("/videos", response_model=list[CourseWithVideos])
def list_videos():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT c.course_id, c.name, v.video_id, v.title, v.source_url, v.video_order
                FROM courses c
                JOIN videos v ON v.course_id = c.id
                ORDER BY c.course_id, v.video_order
                """
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    courses: dict[str, CourseWithVideos] = {}
    for course_id, course_name, video_id, title, source_url, video_order in rows:
        if course_id not in courses:
            courses[course_id] = CourseWithVideos(
                course_id=course_id,
                course_name=course_name,
                videos=[],
            )
        courses[course_id].videos.append(
            VideoSummary(
                video_id=video_id,
                title=title,
                source_url=source_url,
                video_order=video_order,
            )
        )

    return list(courses.values())


def _log_question(question: str, answer: str, top_chunk: dict) -> None:
    """Write the question and answer to question_logs. Best-effort — never raises."""
    try:
        conn = get_conn()
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT v.id FROM videos v
                    JOIN courses c ON v.course_id = c.id
                    WHERE v.title = %s AND c.name = %s
                    LIMIT 1
                    """,
                    (top_chunk["video"], top_chunk["course"]),
                )
                row = cur.fetchone()
                video_db_id = row[0] if row else None

                cur.execute(
                    """
                    INSERT INTO question_logs (question_text, answer_text, retrieved_video_id)
                    VALUES (%s, %s, %s)
                    """,
                    (question, answer, video_db_id),
                )
        conn.close()
    except Exception:
        pass
