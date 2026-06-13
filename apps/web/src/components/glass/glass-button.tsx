"use client";

import { motion } from "motion/react";
import { type ReactNode } from "react";

type GlassButtonProps = {
  children: ReactNode;
  className?: string;
  variant?: "solid" | "glass" | "ghost";
  fullWidth?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
};

export function GlassButton({
  children,
  className = "",
  variant = "glass",
  fullWidth = false,
  disabled,
  onClick,
  type = "button",
}: GlassButtonProps) {
  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer";

  const base =
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-semibold transition";

  if (variant === "solid") {
    return (
      <motion.button
        type={type}
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
        className={`${base} ${widthClass} ${disabledClass} ${className}`}
        style={{
          background: "var(--accent)",
          color: "var(--accent-ink)",
          border: "0",
          boxShadow: "0 10px 22px rgba(230, 111, 0, 0.22)",
        }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.button>
    );
  }

  if (variant === "ghost") {
    return (
      <motion.button
        type={type}
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
        className={`${base} ${widthClass} ${disabledClass} text-[var(--ink-muted)] hover:text-[var(--ink)] ${className}`}
        whileTap={disabled ? undefined : { scale: 0.98 }}
      >
        {children}
      </motion.button>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`glass-surface paper-grain ${base} ${widthClass} ${disabledClass} text-[var(--ink)] ${className}`}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.button>
  );
}
