"use client";

import { type ReactNode } from "react";

import { Navbar } from "./navbar";

type AppShellProps = {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, subtitle, trailing, children }: AppShellProps) {
  return (
    <div className="min-h-screen pt-20">
      <Navbar trailing={trailing} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="handwriting text-3xl font-bold text-[var(--ink)] sm:text-4xl">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm font-medium text-[var(--ink-muted)]">{subtitle}</p>
          ) : null}
        </header>
        {children}
      </main>
    </div>
  );
}
