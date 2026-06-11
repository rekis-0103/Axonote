"use client";

import { motion, useReducedMotion } from "motion/react";
import { type ReactNode } from "react";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  enabled?: boolean;
};

export function TiltCard({ children, className = "", enabled = true }: TiltCardProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion || !enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
