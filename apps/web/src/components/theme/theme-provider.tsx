"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type GlassStyle = "clear" | "tinted";

const THEME_MODE_KEY = "axonote-theme-mode";
const GLASS_STYLE_KEY = "axonote-glass-style";

type ThemeContextValue = {
  mode: ThemeMode;
  glassStyle: GlassStyle;
  resolvedTheme: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  setGlassStyle: (style: GlassStyle) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_MODE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

function readStoredGlassStyle(): GlassStyle {
  if (typeof window === "undefined") return "tinted";
  const stored = window.localStorage.getItem(GLASS_STYLE_KEY);
  if (stored === "clear" || stored === "tinted") return stored;
  return "tinted";
}

function subscribeSystemTheme(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function useSystemTheme(): "light" | "dark" {
  return useSyncExternalStore(subscribeSystemTheme, getSystemTheme, () => "light");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
  const [glassStyle, setGlassStyleState] = useState<GlassStyle>(readStoredGlassStyle);
  const systemTheme = useSystemTheme();
  const resolvedTheme = mode === "system" ? systemTheme : mode;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.documentElement.setAttribute("data-glass", glassStyle);
  }, [resolvedTheme, glassStyle]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    window.localStorage.setItem(THEME_MODE_KEY, next);
  }, []);

  const setGlassStyle = useCallback((next: GlassStyle) => {
    setGlassStyleState(next);
    window.localStorage.setItem(GLASS_STYLE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({ mode, glassStyle, resolvedTheme, setMode, setGlassStyle }),
    [mode, glassStyle, resolvedTheme, setMode, setGlassStyle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
