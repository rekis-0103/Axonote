"use client";

import { motion } from "motion/react";
import { type ReactNode } from "react";

type IconButtonProps = {
  children: ReactNode;
  label: string;
  className?: string;
  onClick?: () => void;
  "aria-expanded"?: boolean;
};

export function IconButton({
  children,
  label,
  className = "",
  onClick,
  "aria-expanded": ariaExpanded,
}: IconButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      aria-expanded={ariaExpanded}
      onClick={onClick}
      className={`glass-surface paper-grain inline-flex h-9 min-w-9 items-center justify-center gap-2 rounded-full px-2.5 text-[var(--ink-muted)] ${className}`}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.button>
  );
}
