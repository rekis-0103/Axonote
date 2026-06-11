"use client";

import { type InputHTMLAttributes, useId } from "react";

const PLACEHOLDER_HINTS: Record<string, string> = {
  email: "you@example.com",
  password: "At least 8 characters",
  name: "Your name",
  title: "Optional page title",
};

type GlassFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

function resolvePlaceholder(label: string, type?: string, explicit?: string) {
  if (explicit) return explicit;
  const key = label.toLowerCase();
  if (key.includes("email") || type === "email") return PLACEHOLDER_HINTS.email;
  if (key.includes("password") || type === "password") return PLACEHOLDER_HINTS.password;
  if (key.includes("name")) return PLACEHOLDER_HINTS.name;
  if (key.includes("title")) return PLACEHOLDER_HINTS.title;
  return `Enter ${label.toLowerCase()}`;
}

export function GlassField({ label, className = "", type, placeholder, ...props }: GlassFieldProps) {
  const id = useId();
  const inputId = props.id ?? id;
  const resolvedPlaceholder = resolvePlaceholder(label, type, placeholder);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={inputId} className="block text-sm font-semibold text-[var(--ink)]">
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        placeholder={resolvedPlaceholder}
        className="w-full rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[var(--paper)] px-3 py-2.5 text-sm font-medium text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none transition focus:border-[var(--ink)] focus:ring-2 focus:ring-[var(--accent-muted)]"
        {...props}
      />
    </div>
  );
}
