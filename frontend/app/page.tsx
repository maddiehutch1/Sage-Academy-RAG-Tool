"use client";

import { useState, useEffect } from "react";
import ChatThread, { type ThreadTurn } from "./ChatThread";
import { buildKalturaIframeSrc } from "./SourceCards";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

interface VideoSummary {
  video_id: string;
  title: string;
  source_url: string | null;
  video_order: number | null;
}

interface CourseLibrary {
  course_id: string;
  course_name: string;
  videos: VideoSummary[];
}

export default function HomePage() {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<ThreadTurn[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [library, setLibrary] = useState<CourseLibrary[]>([]);
  const [libraryError, setLibraryError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  const [selectedVideo, setSelectedVideo] = useState<{
    video: VideoSummary;
    courseName: string;
  } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/videos`)
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json() as Promise<CourseLibrary[]>;
      })
      .then((data) => {
        setLibrary(data);
        setExpandedCourses(new Set());
      })
      .catch(() => setLibraryError(true));
  }, []);

  useEffect(() => {
    if (!selectedVideo) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedVideo(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedVideo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    const history = turns.flatMap((t) => [
      { role: "user" as const, content: t.question },
      { role: "assistant" as const, content: t.answer },
    ]);

    setLoading(true);
    setError(null);
    setQuestion("");
    setPendingQuestion(q);

    try {
      const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail ?? `Request failed (${res.status})`);
      }

      const data: { answer: string; sources: ThreadTurn["sources"] } = await res.json();
      setTurns((prev) => [
        ...prev,
        { question: q, answer: data.answer, sources: data.sources },
      ]);
      setPendingQuestion(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setQuestion(q);
      setPendingQuestion(null);
    } finally {
      setLoading(false);
    }
  }

  function handleNewThread() {
    setTurns([]);
    setPendingQuestion(null);
    setQuestion("");
    setError(null);
    setLoading(false);
  }

  function toggleCourse(courseId: string) {
    setExpandedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  }

  return (
    <div className="h-screen flex flex-row overflow-hidden bg-gray-50">
      <div
        className={`flex-shrink-0 flex flex-col border-r border-gray-200 bg-white
                    transition-[width] duration-200 overflow-hidden
                    ${sidebarOpen ? "w-72" : "w-10"}`}
      >
        <div
          className={`flex items-center border-b border-gray-200 ${
            sidebarOpen
              ? "px-3 py-3 justify-between"
              : "flex-col py-3 justify-center"
          }`}
        >
          {sidebarOpen && (
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-500 select-none whitespace-nowrap">
              Video Library
            </span>
          )}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-1.5 rounded-md hover:bg-gray-100 transition text-gray-500"
            title={sidebarOpen ? "Collapse library" : "Browse videos"}
          >
            {sidebarOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
            ) : (
              <div className="h-6 w-6 rounded-md overflow-hidden">
                <img src="/sage-crest.png" alt="Open video library" className="h-full w-full object-cover" />
              </div>
            )}
          </button>
        </div>

        {sidebarOpen && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search videos…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs
                           focus:outline-none focus:ring-2 focus:ring-sage-400 focus:bg-white
                           placeholder-gray-400"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {libraryError ? (
                <p className="px-3 py-4 text-xs text-red-500">Could not load videos.</p>
              ) : library.length === 0 ? (
                <div className="px-3 py-4 flex items-center gap-2 text-xs text-gray-400">
                  <span className="h-3 w-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  Loading…
                </div>
              ) : (
                library.map((course) => {
                  const isSearching = searchQuery.trim().length > 0;
                  const filteredVideos = isSearching
                    ? course.videos.filter((v) =>
                        v.title.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                    : course.videos;

                  if (isSearching && filteredVideos.length === 0) return null;

                  const isExpanded = isSearching || expandedCourses.has(course.course_id);

                  return (
                    <div key={course.course_id}>
                      <button
                        onClick={() => {
                          if (!isSearching) toggleCourse(course.course_id);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2.5
                                   text-left hover:bg-gray-50 transition border-b border-gray-100"
                      >
                        <span className="text-xs font-semibold text-gray-700 leading-snug">
                          {course.course_name}
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className={`h-3.5 w-3.5 flex-shrink-0 text-gray-400 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        >
                          <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {isExpanded && (
                        <div>
                          {filteredVideos.map((video) => (
                            <button
                              key={video.video_id}
                              onClick={() =>
                                setSelectedVideo({ video, courseName: course.course_name })
                              }
                              className="w-full flex items-start gap-2 px-3 py-2 text-left
                                         hover:bg-sage-50 transition group
                                         border-b border-gray-100/70"
                            >
                              {video.video_order !== null && (
                                <span className="mt-0.5 flex-shrink-0 rounded bg-gray-200
                                                 group-hover:bg-sage-100 px-1.5 py-0.5
                                                 text-[10px] font-mono text-gray-500
                                                 group-hover:text-sage-500">
                                  {video.video_order}
                                </span>
                              )}
                              <span className="text-xs text-gray-600 group-hover:text-sage-700 leading-snug line-clamp-2">
                                {video.title}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <ChatThread
        turns={turns}
        pendingQuestion={pendingQuestion}
        question={question}
        onQuestionChange={setQuestion}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onNewThread={handleNewThread}
      />

      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 rounded-md bg-sage-50 px-2 py-0.5 text-xs font-medium text-sage-600 border border-sage-200">
                  {selectedVideo.courseName}
                </span>
                <p className="text-sm font-medium text-gray-800 truncate">
                  {selectedVideo.video.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="shrink-0 p-1.5 rounded-md hover:bg-gray-100 transition text-gray-500"
                aria-label="Close video"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                  <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                </svg>
              </button>
            </div>

            {selectedVideo.video.source_url ? (
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                <iframe
                  src={buildKalturaIframeSrc(selectedVideo.video.source_url, 0)}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  allow="autoplay *; fullscreen *; encrypted-media *"
                  title={selectedVideo.video.title}
                />
              </div>
            ) : (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                Video link not available yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
