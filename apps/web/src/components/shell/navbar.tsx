"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { type ReactNode } from "react";

import { SettingsMenu } from "@/components/settings-menu";

type NavItem = {
  href: string;
  label: string;
  match?: (path: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "My Desk", match: (p) => p === "/dashboard" },
  { href: "/dashboard", label: "Materials", match: (p) => p.startsWith("/materials") },
];

type NavbarProps = {
  trailing?: ReactNode;
  showNav?: boolean;
};

export function Navbar({ trailing, showNav = true }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--glass-border)] bg-[var(--paper)]/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 no-underline">
          <span className="stamp text-xs leading-none">AX</span>
          <span className="text-base font-bold leading-none text-[var(--ink)] sm:text-lg">
            Axonote
          </span>
        </Link>

        {showNav ? (
          <div className="flex flex-1 items-center justify-center gap-2">
            {NAV_ITEMS.map((item) => {
              const active = item.match ? item.match(pathname) : pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative rounded-md px-2 py-1.5 text-xs font-semibold no-underline transition-colors sm:px-3 sm:text-sm ${
                    active
                      ? "text-[var(--accent-strong)]"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {item.label}
                  {active ? (
                    <motion.span
                      layoutId="nav-ink"
                      className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-[var(--accent-strong)] sm:left-2 sm:right-2"
                    />
                  ) : null}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex shrink-0 items-center gap-2">
          {trailing}
          <SettingsMenu />
        </div>
      </nav>
    </header>
  );
}
