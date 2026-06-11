"use client";

import { type ReactNode } from "react";

import { SettingsMenu } from "@/components/settings-menu";

type TopbarProps = {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
};

function todayJournalDate() {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export function Topbar({ title, subtitle, trailing }: TopbarProps) {
  return (
    <header className="glass-panel torn-edge tape mb-6 flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="marker text-xs text-[var(--ink-muted)]">{todayJournalDate()}</p>
        <h1 className="handwriting mt-1 text-3xl font-bold sm:text-4xl">
          <span className="ink-underline">{title}</span>
        </h1>
        {subtitle ? (
          <p className="marker mt-1 text-sm text-[var(--ink-muted)]">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {trailing}
        <SettingsMenu />
      </div>
    </header>
  );
}
