"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// ── Types ──────────────────────────────────────────────────────────────────────

interface NeighborVideo {
  title: string;
  source_url: string | null;
  video_order: number;
}

interface Source {
  course: string;
  video: string;
  source_url?: string | null;
  video_order?: number | null;
  chunk_index: number;
  start_time: number;
  end_time: number;
  excerpt: string;
  prev_video?: NeighborVideo | null;
  next_video?: NeighborVideo | null;
}

interface AskResponse {
  answer: string;
  sources: Source[];
}

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

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Parse partner_id, uiconf_id, and entry_id from a Kaltura extwidget/preview URL.
 * Returns null if the URL doesn't match the expected pattern.
 *
 * Input:  https://www.kaltura.com/index.php/extwidget/preview/partner_id/1530551/uiconf_id/51947332/entry_id/1_abc123/embed/iframe
 * Output: { partnerId: "1530551", uiconfId: "51947332", entryId: "1_abc123" }
 */
function parseKalturaUrl(sourceUrl: string) {
  const match = sourceUrl.match(
    /partner_id\/(\d+)\/uiconf_id\/(\d+)\/entry_id\/([^/]+)\/embed/
  );
  if (!match) return null;
  return { partnerId: match[1], uiconfId: match[2], entryId: match[3] };
}

/**
 * Convert an extwidget/preview URL into a cdnapisec embedPlaykitJs iframe src
 * that seeks to startSec on load. The embedPlaykitJs format explicitly supports
 * the kalturaSeekFrom parameter; extwidget/preview does not.
 *
 * Falls back to the original URL if it cannot be parsed.
 */
function buildKalturaIframeSrc(sourceUrl: string, startSec: number): string {
  const parsed = parseKalturaUrl(sourceUrl);
  if (!parsed) return sourceUrl;
  const { partnerId, uiconfId, entryId } = parsed;
  return (
    `https://cdnapisec.kaltura.com/p/${partnerId}/embedPlaykitJs/uiconf_id/${uiconfId}` +
    `?iframeembed=true&entry_id=${entryId}&kalturaSeekFrom=${startSec}&autoplay=true`
  );
}

// ── Page component ─────────────────────────────────────────────────────────────

export default function HomePage() {
  // Chat state
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Index of the source card whose main video is currently expanded (null = none)
  const [expandedSource, setExpandedSource] = useState<number | null>(null);
  // Key of the neighbor chip whose video is expanded, e.g. "0-prev" or "2-next"
  const [expandedNeighbor, setExpandedNeighbor] = useState<string | null>(null);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [library, setLibrary] = useState<CourseLibrary[]>([]);
  const [libraryError, setLibraryError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  // Modal state — null when closed
  const [selectedVideo, setSelectedVideo] = useState<{
    video: VideoSummary;
    courseName: string;
  } | null>(null);

  // Fetch the full video library once on mount
  useEffect(() => {
    fetch(`${API_URL}/videos`)
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json() as Promise<CourseLibrary[]>;
      })
      .then((data) => {
        setLibrary(data);
        // All courses collapsed by default
        setExpandedCourses(new Set());
      })
      .catch(() => setLibraryError(true));
  }, []);

  // ESC key closes the modal
  useEffect(() => {
    if (!selectedVideo) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedVideo(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedVideo]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedSource(null);
    setExpandedNeighbor(null);

    try {
      const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail ?? `Request failed (${res.status})`);
      }

      const data: AskResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function toggleVideo(index: number) {
    setExpandedNeighbor(null);
    setExpandedSource((prev) => (prev === index ? null : index));
  }

  function toggleNeighbor(key: string) {
    setExpandedSource(null);
    setExpandedNeighbor((prev) => (prev === key ? null : key));
  }

  function toggleCourse(courseId: string) {
    setExpandedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-row overflow-hidden bg-gray-50">

      {/* ── Video Library Sidebar ────────────────────────────────────────────── */}
      <div
        className={`flex-shrink-0 flex flex-col border-r border-gray-200 bg-white
                    transition-[width] duration-200 overflow-hidden
                    ${sidebarOpen ? "w-72" : "w-10"}`}
      >
        {/* Header row: label + toggle button */}
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
              /* Chevron left — collapse */
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
            ) : (
              /* Crest logo — expand */
              <div className="h-6 w-6 rounded-md overflow-hidden">
                <img src="/sage-crest.png" alt="Open video library" className="h-full w-full object-cover" />
              </div>
            )}
          </button>
        </div>

        {/* Sidebar body — search + course accordion */}
        {sidebarOpen && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search input */}
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

            {/* Course list */}
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

                  // Hide courses with no matches when searching
                  if (isSearching && filteredVideos.length === 0) return null;

                  // Force-expand all courses while a search is active
                  const isExpanded = isSearching || expandedCourses.has(course.course_id);

                  return (
                    <div key={course.course_id}>
                      {/* Course accordion header */}
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

                      {/* Video rows */}
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

      {/* ── Main chat area ───────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto flex flex-col items-center px-4 py-12">
        {/* Header */}
        <div className="w-full max-w-2xl mb-10 text-center">
          <div className="flex justify-center mb-3">
            <div className="h-14 w-14 rounded-xl overflow-hidden">
              <img src="/sage-crest.png" alt="Sage Tool crest" className="h-full w-full object-cover" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-sage-700 tracking-tight">
            Sage Tool
          </h1>
          <p className="mt-2 text-gray-500 text-sm">
            Ask a question about your course — get an answer grounded in lecture content.
          </p>
        </div>

        {/* Question form */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl">
          <textarea
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none placeholder-gray-400"
            rows={3}
            placeholder="e.g. What is the difference between IaaS, PaaS, and SaaS?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-sage-600 px-5 py-2.5 text-sm
                         font-medium text-white shadow hover:bg-sage-700 transition
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Thinking…
                </>
              ) : (
                "Ask Sage"
              )}
            </button>
          </div>
        </form>

        {/* Error state */}
        {error && (
          <div className="w-full max-w-2xl mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="w-full max-w-2xl mt-8 space-y-6">
            {/* Answer */}
            <div className={`rounded-xl border p-6 shadow-sm ${
              result.sources.length === 0
                ? "border-gray-200 bg-gray-50"
                : "border-gray-200 bg-white"
            }`}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-sage-500 mb-3">
                Answer
              </h2>
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                result.sources.length === 0 ? "text-gray-400 italic" : "text-gray-800"
              }`}>
                {result.answer}
              </p>
            </div>

            {/* Sources */}
            {result.sources.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-1">
                  Sources
                </h2>
                <div className="space-y-3">
                  {(() => {
                    // Build a set of video_order values already shown as primary sources
                    // so we can suppress duplicate neighbor chips.
                    const primaryOrders = new Set(
                      result.sources
                        .map((s) => s.video_order)
                        .filter((o): o is number => o != null)
                    );

                    return result.sources.map((src, i) => {
                      const isExpanded = expandedSource === i;
                      const iframeSrc =
                        src.source_url
                          ? buildKalturaIframeSrc(src.source_url, src.start_time)
                          : null;

                      // Neighbor chips — suppressed if their video is already a primary source
                      const prevNeighbor =
                        src.prev_video && !primaryOrders.has(src.prev_video.video_order)
                          ? src.prev_video
                          : null;
                      const nextNeighbor =
                        src.next_video && !primaryOrders.has(src.next_video.video_order)
                          ? src.next_video
                          : null;
                      const hasNeighbors = !!(prevNeighbor || nextNeighbor);

                      const prevKey = `${i}-prev`;
                      const nextKey = `${i}-next`;
                      const isPrevExpanded = expandedNeighbor === prevKey;
                      const isNextExpanded = expandedNeighbor === nextKey;

                      const prevIframeSrc =
                        prevNeighbor?.source_url
                          ? buildKalturaIframeSrc(prevNeighbor.source_url, 0)
                          : null;
                      const nextIframeSrc =
                        nextNeighbor?.source_url
                          ? buildKalturaIframeSrc(nextNeighbor.source_url, 0)
                          : null;

                      // Which neighbor embed (if any) is currently open in this card
                      const openNeighborTitle = isPrevExpanded
                        ? prevNeighbor?.title
                        : isNextExpanded
                        ? nextNeighbor?.title
                        : null;
                      const openNeighborIframeSrc = isPrevExpanded
                        ? prevIframeSrc
                        : isNextExpanded
                        ? nextIframeSrc
                        : null;

                      return (
                        <div
                          key={i}
                          className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                        >
                          {/* Card header */}
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div>
                                <p className="text-sm font-medium text-gray-800">{src.video}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{src.course}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                <span className="rounded-md bg-sage-50 px-2.5 py-1 text-xs font-mono text-sage-600 border border-sage-200">
                                  {formatTime(src.start_time)} – {formatTime(src.end_time)}
                                </span>
                                {iframeSrc && (
                                  <button
                                    onClick={() => toggleVideo(i)}
                                    className="inline-flex items-center gap-1 rounded-md bg-sage-600 px-2.5 py-1
                                               text-xs font-medium text-white hover:bg-sage-700 transition"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                                          <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                                        </svg>
                                        Close video
                                      </>
                                    ) : (
                                      <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                                          <path d="M3 2.5a.5.5 0 0 1 .765-.424l10 5.5a.5.5 0 0 1 0 .848l-10 5.5A.5.5 0 0 1 3 13.5v-11Z" />
                                        </svg>
                                        Watch at {formatTime(src.start_time)}
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="mt-3 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                              "{src.excerpt}…"
                            </p>
                          </div>

                          {/* Embedded video — shown when this card's main video is expanded */}
                          {isExpanded && iframeSrc && (
                            <div className="border-t border-gray-200 bg-black">
                              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                                <iframe
                                  src={iframeSrc}
                                  className="absolute inset-0 w-full h-full"
                                  allowFullScreen
                                  allow="autoplay *; fullscreen *; encrypted-media *"
                                  title={src.video}
                                />
                              </div>
                            </div>
                          )}

                          {/* "Also in this series" neighbor strip */}
                          {hasNeighbors && (
                            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                                Also in this series
                              </p>
                              <div className="flex gap-2 flex-wrap">
                                {prevNeighbor && (
                                  <div className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2">
                                    <p className="text-xs text-gray-600 font-medium truncate mb-1.5">
                                      ← {prevNeighbor.title}
                                    </p>
                                    {prevIframeSrc && (
                                      <button
                                        onClick={() => toggleNeighbor(prevKey)}
                                        className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5
                                                   text-xs font-medium text-gray-600 hover:bg-gray-200 transition border border-gray-200"
                                      >
                                        {isPrevExpanded ? (
                                          <>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                                              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                                            </svg>
                                            Close
                                          </>
                                        ) : (
                                          <>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                                              <path d="M3 2.5a.5.5 0 0 1 .765-.424l10 5.5a.5.5 0 0 1 0 .848l-10 5.5A.5.5 0 0 1 3 13.5v-11Z" />
                                            </svg>
                                            Watch
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                )}
                                {nextNeighbor && (
                                  <div className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2">
                                    <p className="text-xs text-gray-600 font-medium truncate mb-1.5">
                                      {nextNeighbor.title} →
                                    </p>
                                    {nextIframeSrc && (
                                      <button
                                        onClick={() => toggleNeighbor(nextKey)}
                                        className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5
                                                   text-xs font-medium text-gray-600 hover:bg-gray-200 transition border border-gray-200"
                                      >
                                        {isNextExpanded ? (
                                          <>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                                              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                                            </svg>
                                            Close
                                          </>
                                        ) : (
                                          <>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                                              <path d="M3 2.5a.5.5 0 0 1 .765-.424l10 5.5a.5.5 0 0 1 0 .848l-10 5.5A.5.5 0 0 1 3 13.5v-11Z" />
                                            </svg>
                                            Watch
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Neighbor video embed — shown when a neighbor chip is expanded */}
                          {openNeighborIframeSrc && openNeighborTitle && (
                            <div className="border-t border-gray-200 bg-black">
                              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                                <iframe
                                  src={openNeighborIframeSrc}
                                  className="absolute inset-0 w-full h-full"
                                  allowFullScreen
                                  allow="autoplay *; fullscreen *; encrypted-media *"
                                  title={openNeighborTitle}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Video Modal ──────────────────────────────────────────────────────── */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
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

            {/* Kaltura embed or placeholder */}
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
