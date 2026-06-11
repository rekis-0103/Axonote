"use client";

import { type CSSProperties, type ReactNode } from "react";

export type GlassVariant = "card" | "button" | "input" | "bar" | "floating";

const VARIANT_RADIUS: Record<GlassVariant, string> = {
  card: "var(--radius-lg)",
  button: "var(--radius-md)",
  input: "var(--radius-md)",
  bar: "var(--radius-lg)",
  floating: "var(--radius-lg)",
};

type GlassSurfaceProps = {
  children: ReactNode;
  variant?: GlassVariant;
  className?: string;
  style?: CSSProperties;
  padding?: string;
  onClick?: () => void;
  fullWidth?: boolean;
};

export function GlassSurface({
  children,
  variant = "card",
  className = "",
  style,
  padding,
  onClick,
  fullWidth = false,
}: GlassSurfaceProps) {
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <div
      className={`glass-surface paper-grain ${widthClass} ${className}`.trim()}
      style={{
        borderRadius: VARIANT_RADIUS[variant],
        padding: padding ?? undefined,
        ...style,
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
