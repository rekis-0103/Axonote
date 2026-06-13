"use client";

import { type ReactNode } from "react";

type GlassBadgeProps = {
  children: ReactNode;
  className?: string;
  tone?: "default" | "accent" | "success";
};

const TONE_CLASS: Record<string, string> = {
  default: "border border-dashed border-[var(--glass-border)] bg-transparent text-[var(--ink-muted)]",
  accent: "bg-[var(--accent-muted)] text-[var(--accent-strong)]",
  success: "sticky-note sticky-note--green sticky-note--flat text-[var(--ink)]",
};

export function GlassBadge({ children, className = "", tone = "default" }: GlassBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-semibold ${TONE_CLASS[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
