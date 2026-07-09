# Product Requirements Document (v0.1)

## Product Overview
Sage Academy RAG Tool is a study assistant for students in data analytics and information systems courses. It helps users find the most relevant course video content and receive answers grounded in that curriculum.

## Target Users
- Students in data analytics, information systems, and related courses
- Instructors or teaching assistants who want a searchable study aid

## Key Features
- Natural-language question answering
- Retrieval of relevant transcript chunks from course videos
- Return of the matching video and timestamp
- Clear source attribution so students can jump to the right place in the video
- Simple web experience for asking questions and reviewing results

## Functional Requirements
- Support transcript ingestion from common formats
- Chunk transcripts into searchable units
- Store embeddings with video, course, and timestamp metadata
- Retrieve the most relevant content for a student question
- Generate an answer using the retrieved context
- Display source references in the response

## Non-Functional Requirements
- Simple enough to build and demo quickly
- Easy for future students to extend
- Reasonable performance for a prototype experience

## Success Metrics
- Students can find relevant video content for common course questions
- Answers include useful source references
- The prototype is clear enough to demonstrate value in a short demo
