"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import AppearanceMenu from "./AppearanceMenu";
import SourceCards, { type Source } from "./SourceCards";

export interface ThreadTurn {
  question: string;
  answer: string;
  sources: Source[];
}

interface ChatThreadProps {
  turns: ThreadTurn[];
  pendingQuestion: string | null;
  question: string;
  onQuestionChange: (value: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onNewThread: () => void;
}

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => <h1 className="mb-2 text-base font-semibold">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 text-sm font-semibold">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 text-sm font-semibold">{children}</h3>,
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-gray-300 pl-3 text-gray-600 dark:border-gray-700 dark:text-gray-300">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-lg bg-gray-100 p-3 last:mb-0 dark:bg-gray-950">
      {children}
    </pre>
  ),
  code: ({ className, children }) => {
    if (className) {
      return <code className="font-mono text-xs text-gray-800 dark:text-gray-100">{children}</code>;
    }
    return (
      <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs dark:bg-gray-700">
        {children}
      </code>
    );
  },
};

function AssistantBody({ answer, empty }: { answer: string; empty: boolean }) {
  return (
    <div
      className={`text-sm leading-relaxed ${
        empty ? "text-gray-400 italic dark:text-gray-500" : "text-gray-800 dark:text-gray-100"
      }`}
    >
      <ReactMarkdown components={markdownComponents}>{answer}</ReactMarkdown>
    </div>
  );
}

function Composer({
  question,
  onQuestionChange,
  loading,
  onSubmit,
  textareaRef,
}: {
  question: string;
  onQuestionChange: (value: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}) {
  return (
    <form onSubmit={onSubmit} className="w-full">
      <textarea
        ref={textareaRef}
        autoFocus
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm
             focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none placeholder-gray-400
             dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        rows={3}
        placeholder="e.g. What is the difference between IaaS, PaaS, and SaaS?"
        value={question}
        onChange={(e) => onQuestionChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e as unknown as React.FormEvent);
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
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-sage-100 bg-sage-50 px-4 py-3 dark:border-sage-800 dark:bg-sage-900/40">
      <p className="text-xs font-semibold uppercase tracking-widest text-sage-500 mb-1 dark:text-sage-300">
        You
      </p>
      <p className="text-sm text-gray-800 whitespace-pre-wrap dark:text-gray-100">{text}</p>
    </div>
  );
}

function NewThreadButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="New Thread"
      aria-label="New Thread"
      className="group relative z-20 flex h-10 w-10 items-center justify-center
                 overflow-hidden rounded-full bg-sage-600 text-white shadow-md
                 transition-all duration-300 ease-out
                 hover:w-40 hover:justify-start hover:gap-2 hover:px-3 hover:bg-sage-700"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-5 w-5 shrink-0 transition-transform duration-500 ease-out group-hover:rotate-[360deg]"
      >
        <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
      </svg>
      <span className="whitespace-nowrap text-sm font-medium opacity-0 max-w-0 overflow-hidden
                       transition-all duration-300
                       group-hover:max-w-[7rem] group-hover:opacity-100">
        New Thread
      </span>
    </button>
  );
}

function ThreadControls({ onNewThread }: { onNewThread?: () => void }) {
  return (
    <div className="absolute right-5 top-5 z-30 flex items-center gap-2">
      {onNewThread && <NewThreadButton onClick={onNewThread} />}
      <AppearanceMenu />
    </div>
  );
}

function Header() {
  return (
    <div className="w-full max-w-2xl mb-10 text-center">
      <div className="flex justify-center mb-3">
        <div className="h-14 w-14 rounded-xl overflow-hidden">
          <img src="/sage-crest.png" alt="Sage Tool crest" className="h-full w-full object-cover" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-sage-700 tracking-tight dark:text-sage-300">Sage Tool</h1>
      <p className="mt-2 text-gray-500 text-sm dark:text-gray-400">
        Ask a question about your course — get an answer grounded in lecture content.
      </p>
    </div>
  );
}

export default function ChatThread({
  turns,
  pendingQuestion,
  question,
  onQuestionChange,
  loading,
  error,
  onSubmit,
  onNewThread,
}: ChatThreadProps) {
  const hasThread = turns.length > 0;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const latestTurnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [hasThread, loading, pendingQuestion]);

  useEffect(() => {
    if (!hasThread) return;
    const scroller = scrollerRef.current;
    const target = latestTurnRef.current;
    if (!scroller || !target) return;
    const offset = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    scroller.scrollTop += offset;
  }, [hasThread, turns.length, pendingQuestion]);

  const errorBanner = error ? (
    <div className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700
            dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
      {error}
    </div>
  ) : null;

  if (!hasThread) {
    return (
      <main className="relative flex-1 overflow-y-auto flex flex-col items-center px-4 py-12">
        <ThreadControls />
        <Header />
        <div className="w-full max-w-2xl">
          <Composer
            question={question}
            onQuestionChange={onQuestionChange}
            loading={loading}
            onSubmit={onSubmit}
            textareaRef={textareaRef}
          />
        </div>
        {error && <div className="w-full max-w-2xl mt-6">{errorBanner}</div>}
      </main>
    );
  }

  return (
    <main className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
      <ThreadControls onNewThread={onNewThread} />
      <div
        ref={scrollerRef}
        className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]"
      >
        <div className="mx-auto w-full max-w-2xl px-4 py-6 space-y-8">
          {turns.map((turn, i) => {
            const isLatest = i === turns.length - 1 && !pendingQuestion;
            return (
              <div
                key={i}
                ref={isLatest ? latestTurnRef : undefined}
                className="space-y-3"
              >
                <UserBubble text={turn.question} />
                <div
                  className={`rounded-xl border p-6 shadow-sm ${
                    turn.sources.length === 0
                      ? "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                  }`}
                >
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-sage-500 mb-3">
                    Answer
                  </h2>
                  <AssistantBody answer={turn.answer} empty={turn.sources.length === 0} />
                </div>
                <SourceCards sources={turn.sources} />
              </div>
            );
          })}

          {pendingQuestion && (
            <div ref={latestTurnRef} className="space-y-3">
              <UserBubble text={pendingQuestion} />
              {loading && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                    Thinking…
                  </div>
                </div>
              )}
            </div>
          )}

          {errorBanner}
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-gray-50 [scrollbar-gutter:stable]
              dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto w-full max-w-2xl px-4 py-3">
          <Composer
            question={question}
            onQuestionChange={onQuestionChange}
            loading={loading}
            onSubmit={onSubmit}
            textareaRef={textareaRef}
          />
        </div>
      </div>
    </main>
  );
}
