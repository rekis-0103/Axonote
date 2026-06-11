"use client";

import { type ReactNode } from "react";

import { Reveal } from "@/components/motion/reveal";

type StatTileProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  color?: "yellow" | "pink" | "blue" | "green";
  delay?: number;
};

const COLOR_CLASS: Record<string, string> = {
  yellow: "sticky-note sticky-note--flat",
  pink: "sticky-note sticky-note--pink sticky-note--flat",
  blue: "sticky-note sticky-note--blue sticky-note--flat",
  green: "sticky-note sticky-note--green sticky-note--flat",
};

export function StatTile({ label, value, hint, icon, color = "yellow", delay = 0 }: StatTileProps) {
  return (
    <Reveal delay={delay}>
      <div
        className={`${COLOR_CLASS[color]} flex flex-col justify-between rounded-md p-5`}
        style={{ minHeight: "110px" }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
            {label}
          </p>
          {icon ? <span className="opacity-70">{icon}</span> : null}
        </div>
        <div>
          <p className="handwriting text-4xl font-bold">{value}</p>
          {hint ? <p className="mt-1 text-xs font-medium text-[var(--ink-muted)]">{hint}</p> : null}
        </div>
      </div>
    </Reveal>
  );
}
