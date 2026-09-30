"use client";

import { useState } from "react";

export interface NeighborVideo {
  title: string;
  source_url: string | null;
  video_order: number;
}

export interface Source {
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

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Parse partner_id, uiconf_id, and entry_id from a Kaltura extwidget/preview URL.
 * Returns null if the URL doesn't match the expected pattern.
 */
export function parseKalturaUrl(sourceUrl: string) {
  const match = sourceUrl.match(
    /partner_id\/(\d+)\/uiconf_id\/(\d+)\/entry_id\/([^/]+)\/embed/
  );
  if (!match) return null;
  return { partnerId: match[1], uiconfId: match[2], entryId: match[3] };
}

/**
 * Convert an extwidget/preview URL into a cdnapisec embedPlaykitJs iframe src
 * that seeks to startSec on load.
 */
export function buildKalturaIframeSrc(sourceUrl: string, startSec: number): string {
  const parsed = parseKalturaUrl(sourceUrl);
  if (!parsed) return sourceUrl;
  const { partnerId, uiconfId, entryId } = parsed;
  return (
    `https://cdnapisec.kaltura.com/p/${partnerId}/embedPlaykitJs/uiconf_id/${uiconfId}` +
    `?iframeembed=true&entry_id=${entryId}&kalturaSeekFrom=${startSec}&autoplay=true`
  );
}

export function parseYouTubeVideoId(sourceUrl: string): string | null {
  try {
    const url = new URL(sourceUrl);
    const host = url.hostname.toLowerCase();
    let videoId: string | null = null;

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)) {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v");
      } else if (url.pathname.startsWith("/embed/")) {
        videoId = url.pathname.split("/")[2] ?? null;
      }
    }

    return videoId && /^[A-Za-z0-9_-]+$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

export function buildYouTubeWatchUrl(sourceUrl: string, startSec: number): string | null {
  const videoId = parseYouTubeVideoId(sourceUrl);
  if (!videoId) return null;
  const seconds = Number.isFinite(startSec) ? Math.max(0, Math.floor(startSec)) : 0;
  return `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`;
}

export function buildVideoIframeSrc(sourceUrl: string, startSec: number): string {
  if (parseKalturaUrl(sourceUrl)) {
    return buildKalturaIframeSrc(sourceUrl, startSec);
  }

  const videoId = parseYouTubeVideoId(sourceUrl);
  if (!videoId) return sourceUrl;
  const seconds = Number.isFinite(startSec) ? Math.max(0, Math.floor(startSec)) : 0;
  return `https://www.youtube.com/embed/${videoId}?start=${seconds}`;
}

export default function SourceCards({ sources }: { sources: Source[] }) {
  const [expandedSource, setExpandedSource] = useState<number | null>(null);
  const [expandedNeighbor, setExpandedNeighbor] = useState<string | null>(null);

  if (sources.length === 0) return null;

  const primaryOrders = new Set(
    sources.map((s) => s.video_order).filter((o): o is number => o != null)
  );

  function toggleVideo(index: number) {
    setExpandedNeighbor(null);
    setExpandedSource((prev) => (prev === index ? null : index));
  }

  function toggleNeighbor(key: string) {
    setExpandedSource(null);
    setExpandedNeighbor((prev) => (prev === key ? null : key));
  }

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-1">
        Sources
      </h2>
      <div className="space-y-3">
        {sources.map((src, i) => {
          const isExpanded = expandedSource === i;
          const iframeSrc = src.source_url
            ? buildVideoIframeSrc(src.source_url, src.start_time)
            : null;
          const youtubeWatchUrl = src.source_url
            ? buildYouTubeWatchUrl(src.source_url, src.start_time)
            : null;

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

          const prevIframeSrc = prevNeighbor?.source_url
            ? buildVideoIframeSrc(prevNeighbor.source_url, 0)
            : null;
          const nextIframeSrc = nextNeighbor?.source_url
            ? buildVideoIframeSrc(nextNeighbor.source_url, 0)
            : null;

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
                <p className="mt-3 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3 whitespace-pre-wrap">
                  "{src.excerpt}…"
                </p>
                {youtubeWatchUrl && (
                  <a
                    href={youtubeWatchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-xs font-medium text-sage-700 hover:text-sage-800 underline underline-offset-2"
                  >
                    Open on YouTube
                  </a>
                )}
              </div>

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
        })}
      </div>
    </div>
  );
}
