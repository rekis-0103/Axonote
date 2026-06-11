"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

export function ScrollProgress() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const width = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  if (reduceMotion) return null;

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-0.5" aria-hidden>
      <div className="h-full w-full bg-[var(--rule-line)] opacity-20" />
      <motion.div
        className="absolute left-0 top-0 h-full origin-left bg-[var(--accent)]"
        style={{ width }}
      />
    </div>
  );
}
