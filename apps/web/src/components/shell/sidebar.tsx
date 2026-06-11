"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  match?: (path: string) => boolean;
};

function NotebookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 4h12a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M8 4v16M5 8h3M5 12h3M5 16h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PagesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 3h9l5 5v13a1 1 0 01-1 1H6a2 2 0 01-2-2V5a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M14 3v6h6M8 13h8M8 17h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "My Desk",
    icon: <NotebookIcon />,
    match: (p) => p === "/dashboard",
  },
  {
    href: "/dashboard",
    label: "Pages",
    icon: <PagesIcon />,
    match: (p) => p.startsWith("/materials"),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile bookmark tabs */}
      <aside className="glass-rail tape fixed bottom-4 left-4 right-4 z-40 flex items-center justify-around gap-1 p-2 md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = item.match ? item.match(pathname) : pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`glass-nav-item flex-1 justify-center px-2 py-2 ${active ? "glass-nav-item--active" : ""}`}
            >
              {item.icon}
            </Link>
          );
        })}
      </aside>

      {/* Desktop notebook tabs */}
      <aside className="glass-rail tape fixed left-4 top-4 bottom-4 z-40 hidden w-[var(--sidebar-width)] flex-col p-4 md:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="stamp text-sm">Ax</div>
          <div>
            <p className="handwriting text-2xl font-bold leading-none">Axonote</p>
            <p className="marker mt-1 text-xs text-[var(--ink-muted)]">~ my study notes ~</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = item.match ? item.match(pathname) : pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`glass-nav-item ${active ? "glass-nav-item--active" : ""}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <p className="marker px-2 text-xs text-[var(--ink-muted)]">page 1 of ∞</p>
      </aside>
    </>
  );
}
