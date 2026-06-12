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
    <header className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2">
      <nav className="glass-rail flex items-center justify-between gap-3 px-3 py-2 sm:px-4 sm:py-2.5">
        {/* Brand — always visible */}
        <Link href="/" className="flex shrink-0 items-center gap-2 no-underline">
          <span className="stamp text-xs leading-none">Ax</span>
          <span className="handwriting text-xl font-bold leading-none text-[var(--ink)] sm:text-2xl">
            Axonote
          </span>
        </Link>

        {/* Center nav */}
        {showNav ? (
          <div className="flex flex-1 items-center justify-center gap-0.5 sm:gap-1">
            {NAV_ITEMS.map((item) => {
              const active = item.match ? item.match(pathname) : pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative rounded-md px-2 py-1.5 text-xs font-semibold no-underline transition-colors sm:px-3 sm:text-sm ${
                    active ? "text-[var(--ink)]" : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {item.label}
                  {active ? (
                    <motion.span
                      layoutId="nav-ink"
                      className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-[var(--accent)] sm:left-2 sm:right-2"
                    />
                  ) : null}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Right slot */}
        <div className="flex shrink-0 items-center gap-2">
          {trailing}
          <SettingsMenu />
        </div>
      </nav>
    </header>
  );
}
