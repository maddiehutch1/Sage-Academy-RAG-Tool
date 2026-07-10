# Sage Academy RAG Tool Vision
For v0.1 of the Sage Academy question-answering (QA) system, we will be implementing a Retrieval Augmented Generation (RAG) system for identifying the appropriate context to pass to an LLM to answer a student’s question. The high-level flow is as follows with necessary components to build bolded:
1. All transcripts across all courses will be extracted using the tool from member of team. (before RAG system uses it)
2. Every sentence of every transcript will be passed through an embedding API or pretrained embedding model to return a single vector representation for each sentence. 
3. The embeddings will be stored in a vector database with the metadata of the video the sentence came from, where that video falls in the sequence of the course, and the timestamp within that specific video of the sentence. Some vector databases to consider are Pinecone DB, Neo4j (for graph based approach), MongoDB, and many others.
4. Student types a question into a web application for QA.
5. The question is passed through the same embedding model or API as the transcripts to return an embedding vector for the question.
6. The question embedding vector is compared to the sentence vectors in the vector database via cosine similarity (or some other distance/similarity measure). The most similar sentence will be extracted and, depending on context window of the QA model, either the full relevant video where that sentence appeared will be passed to the QA system or simply a few sentences around that specific one.
7. This text/video context will be passed along with the student question to an LLM via an API call to provide as relevant of a response as possible that contextualizes the answer based on our curriculum. The timestamp and video link should also be returned with the answer to provide students with a reference point for where in the video they should start watching.
8. (Bonus) If possible, it would be ideal to return the graph of where the content in the answer falls in the “knowledge graph” of all of our Sage Academy curriculum, that way the student knows what may be foundational material that they haven’t completed yet before jumping to that next step.

So to breakdown the things we’ll need to build/implement:
* Embedding model or API
* Vector database
* Web application for question answering

This is basically just a RAG system so any tutorial on that will be relevant. It’s also not critical to implement the most robust, efficient solution yet. Functionality and time-to-test are the most important things right now, since we can always make things better. My biggest concern is that we have something to show.

## Behavior
Whenever creating plan docs and roadmap docs, always save them in ai/roadmaps. Prefix the name with the date. Add a note that we need to avoid over-engineering, cruft, and legacy-compatibility features in this clean code project. Make sure they reference each other.

Whenever finishing with implementing a plan / roadmap doc pair, make sure the roadmap is up to date (tasks checked off, etc). Then save the docs to ai/roadmaps/complete. Then update aiDocs/changelog.md accordingly.

## Coding Style

* Keep files small and single-responsibility. One screen per file.
* No over-engineering, no premature abstractions, no legacy-compatibility shims.
* Avoid adding dependencies unless necessary — check [aiDocs/architecture.md](architecture.md) first.

## Project File Reference
| File Path | Purpose |
| --- | --- |
| [aiDocs/context.md](context.md) | Core product vision and initial system description |
| [aiDocs/mvp.md](mvp.md) | Defines the v0.1 scope and success criteria |
| [aiDocs/prd.md](prd.md) | Captures product requirements and expectations |
| [aiDocs/architecture.md](architecture.md) | Describes the recommended stack, architecture, and data flow |
| [ai/roadmaps/2026-07-10-high-level-plan.md](../ai/roadmaps/2026-07-10-high-level-plan.md) | Main phased roadmap for implementation |
| [ai/roadmaps/2026-07-10-milestone-delivery-plan.md](../ai/roadmaps/2026-07-10-milestone-delivery-plan.md) | Ordered milestone-based delivery plan |
| [aiDocs/changelog.md](../aiDocs/changelog.md) | Log of changes as project progresses |