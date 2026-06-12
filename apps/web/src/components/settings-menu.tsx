"use client";

import { useState } from "react";

import { IconButton } from "@/components/glass/icon-button";
import {
  type GlassStyle,
  type ThemeMode,
  useTheme,
} from "@/components/theme/theme-provider";

const THEME_OPTIONS: { id: ThemeMode; label: string }[] = [
  { id: "light", label: "Paper" },
  { id: "dark", label: "Chalk" },
  { id: "system", label: "Auto" },
];

const PAPER_OPTIONS: { id: GlassStyle; label: string }[] = [
  { id: "clear", label: "Ruled" },
  { id: "tinted", label: "Plain" },
];

export function SettingsMenu() {
  const { mode, glassStyle, setMode, setGlassStyle } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <IconButton label="Notebook settings" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 20L20 4M6 17l-1 3 3-1M17 7l1-3-3 1"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="hidden text-xs font-semibold lg:inline">Settings</span>
      </IconButton>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64">
          <div className="glass-panel p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              Notebook theme
            </p>
            <div className="mb-4 grid grid-cols-3 gap-1">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMode(opt.id)}
                  className={`rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                    mode === opt.id
                      ? "bg-[var(--accent-muted)] text-[var(--ink)]"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              Paper style
            </p>
            <div className="grid grid-cols-2 gap-1">
              {PAPER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setGlassStyle(opt.id)}
                  className={`rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                    glassStyle === opt.id
                      ? "bg-[var(--accent-muted)] text-[var(--ink)]"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
