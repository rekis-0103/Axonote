"use client";

import { useEffect, type ReactNode } from "react";

import { Navbar } from "./navbar";

type AppShellProps = {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  background?: "desk" | "folder";
  children: ReactNode;
};

export function AppShell({ title, subtitle, trailing, background = "desk", children }: AppShellProps) {
  useEffect(() => {
    document.body.setAttribute("data-surface", "workspace");
    document.body.setAttribute("data-background", background);
    return () => {
      document.body.removeAttribute("data-surface");
      document.body.removeAttribute("data-background");
    };
  }, [background]);

  return (
    <div className="workspace-shell min-h-screen pt-20">
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
