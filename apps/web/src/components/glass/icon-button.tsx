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
      className={`glass-surface paper-grain grid h-9 w-9 place-items-center rounded-full text-[var(--ink-muted)] ${className}`}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.button>
  );
}
