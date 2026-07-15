CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  course_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(100) UNIQUE NOT NULL,
  course_id INTEGER REFERENCES courses(id),
  title VARCHAR(255) NOT NULL,
  source_url TEXT,
  transcript_path TEXT
);

CREATE TABLE IF NOT EXISTS transcript_chunks (
  id SERIAL PRIMARY KEY,
  video_id INTEGER REFERENCES videos(id),
  chunk_text TEXT NOT NULL,
  start_time INTEGER,
  end_time INTEGER,
  chunk_index INTEGER,
  embedding vector(1536)
);

CREATE TABLE IF NOT EXISTS question_logs (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  retrieved_video_id INTEGER REFERENCES videos(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
