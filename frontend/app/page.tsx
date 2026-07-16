"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

interface Source {
  course: string;
  video: string;
  chunk_index: number;
  start_time: number;
  end_time: number;
  excerpt: string;
}

interface AskResponse {
  answer: string;
  sources: Source[];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function HomePage() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setResult(null);

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

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      {/* Header */}
      <div className="w-full max-w-2xl mb-10 text-center">
        <h1 className="text-3xl font-bold text-indigo-700 tracking-tight">
          Sage Academy
        </h1>
        <p className="mt-2 text-gray-500 text-sm">
          Ask a question about your course — get an answer grounded in lecture content.
        </p>
      </div>

      {/* Question form */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <textarea
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none placeholder-gray-400"
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
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm
                       font-medium text-white shadow hover:bg-indigo-700 transition
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Thinking…
              </>
            ) : (
              "Ask →"
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
            <h2 className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-3">
              Answer
            </h2>
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
              result.sources.length === 0 ? "text-gray-400 italic" : "text-gray-800"
            }`}>
              {result.answer}
            </p>
          </div>

          {/* Sources — only shown when relevant content was found */}
          {result.sources.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-1">
                Sources
              </h2>
              <div className="space-y-3">
                {result.sources.map((src, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{src.video}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{src.course}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-mono text-indigo-600 border border-indigo-100">
                        {formatTime(src.start_time)} – {formatTime(src.end_time)}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                      "{src.excerpt}…"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
