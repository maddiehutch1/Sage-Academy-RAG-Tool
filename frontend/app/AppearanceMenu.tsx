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
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.61l-1.92-3.32a.5.5 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.75a.5.5 0 0 0-.48-.41h-3.84a.5.5 0 0 0-.47.41L9.25 5.29c-.59.24-1.13.57-1.62.94l-2.39-.96a.5.5 0 0 0-.59.22L2.74 8.87a.5.5 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.5.5 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.5.5 0 0 0-.12-.61l-2.01-1.58ZM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2Z"
          />
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