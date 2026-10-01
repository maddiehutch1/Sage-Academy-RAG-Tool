"use client";

import { useEffect, useRef, useState } from "react";
import { useThemePreference, type ThemePreference } from "./ThemeProvider";

const options: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function AppearanceMenu() {
  const { preference, setPreference } = useThemePreference();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    containerRef.current
      ?.querySelector<HTMLInputElement>('input[type="radio"]:checked')
      ?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function choosePreference(nextPreference: ThemePreference) {
    setPreference(nextPreference);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Appearance settings"
        aria-expanded={isOpen}
        aria-controls="appearance-menu"
        title="Appearance settings"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200
                   bg-white text-gray-600 shadow-sm transition hover:bg-gray-100
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400
                   dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 2.94-.08-.03a1.7 1.7 0 0 0-1.85.36l-.06.06h-3.4l-.02-.08a1.7 1.7 0 0 0-1.37-1.35l-.08-.02-1.7-2.94.06-.06A1.7 1.7 0 0 0 9.9 14l-.08-.03v-3.4l.08-.02a1.7 1.7 0 0 0 1.35-1.37l.02-.08 2.94-1.7.06.06a1.7 1.7 0 0 0 1.88.34l.06-.03 2.94 1.7-.03.08a1.7 1.7 0 0 0 .36 1.85l.06.06v3.4l-.08.02A1.7 1.7 0 0 0 19.4 15Z" />
        </svg>
      </button>

      {isOpen && (
        <div
          id="appearance-menu"
          className="absolute right-0 top-12 z-50 w-52 rounded-lg border border-gray-200
                     bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        >
          <fieldset>
            <legend className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider
                               text-gray-500 dark:text-gray-400">
              Appearance
            </legend>
            <div className="space-y-1">
              {options.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center justify-between rounded-md px-2.5 py-2
                    text-sm transition focus-within:ring-2 focus-within:ring-sage-400
                    ${preference === option.value
                      ? "bg-sage-50 font-medium text-sage-800 dark:bg-sage-900/50 dark:text-sage-200"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"}`}
                >
                  <span>{option.label}</span>
                  <input
                    type="radio"
                    name="appearance"
                    value={option.value}
                    checked={preference === option.value}
                    onChange={() => choosePreference(option.value)}
                    className="h-4 w-4 accent-sage-600"
                  />
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}
    </div>
  );
}