"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ThemePreference = "system" | "light" | "dark";

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const STORAGE_KEY = "sage-theme-preference";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function applyPreference(preference: ThemePreference, systemIsDark: boolean) {
  const isDark = preference === "dark" || (preference === "system" && systemIsDark);
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const preferenceRef = useRef<ThemePreference>("system");

  useEffect(() => {
    const systemPreference = window.matchMedia("(prefers-color-scheme: dark)");
    let storedPreference: string | null = null;

    try {
      storedPreference = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      storedPreference = null;
    }

    const initialPreference = isThemePreference(storedPreference)
      ? storedPreference
      : "system";

    preferenceRef.current = initialPreference;
    setPreferenceState(initialPreference);
    applyPreference(initialPreference, systemPreference.matches);

    const handleSystemChange = (event: MediaQueryListEvent) => {
      if (preferenceRef.current === "system") {
        applyPreference("system", event.matches);
      }
    };

    systemPreference.addEventListener("change", handleSystemChange);
    return () => systemPreference.removeEventListener("change", handleSystemChange);
  }, []);

  function setPreference(nextPreference: ThemePreference) {
    preferenceRef.current = nextPreference;
    setPreferenceState(nextPreference);

    try {
      window.localStorage.setItem(STORAGE_KEY, nextPreference);
    } catch {
      // The selected mode still applies when browser storage is unavailable.
    }

    applyPreference(
      nextPreference,
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  return (
    <ThemeContext.Provider value={{ preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemePreference must be used within ThemeProvider");
  }
  return context;
}