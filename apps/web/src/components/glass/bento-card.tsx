"use client";

import { type CSSProperties, type ReactNode } from "react";

import { Reveal } from "@/components/motion/reveal";
import { TiltCard } from "@/components/motion/tilt-card";

type BentoCardProps = {
  children: ReactNode;
  className?: string;
  span?: 3 | 4 | 6 | 8 | 12;
  padding?: string;
  style?: CSSProperties;
  tape?: boolean;
  revealDelay?: number;
  interactive?: boolean;
};

const SPAN_CLASS: Record<number, string> = {
  3: "bento-span-3",
  4: "bento-span-4",
  6: "bento-span-6",
  8: "bento-span-8",
  12: "bento-span-12",
};

export function BentoCard({
  children,
  className = "",
  span = 12,
  padding = "1.25rem",
  style,
  tape = false,
  revealDelay = 0,
  interactive = false,
}: BentoCardProps) {
  return (
    <Reveal className={SPAN_CLASS[span]} delay={revealDelay}>
      <TiltCard enabled={interactive}>
        <div
          className={`glass-panel paper-grain ${tape ? "tape" : ""} ${className}`}
          style={{ padding, ...style }}
        >
          {children}
        </div>
      </TiltCard>
    </Reveal>
  );
}
