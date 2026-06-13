"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { type CSSProperties } from "react";

function DoodleStar({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M16 2L18 12L28 14L18 16L16 26L14 16L4 14L14 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DoodleArrow({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} width="48" height="32" viewBox="0 0 48 32" fill="none" aria-hidden>
      <path
        d="M4 20C12 8 28 8 36 18M36 18L30 14M36 18L32 24"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DoodleCloud({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} width="56" height="32" viewBox="0 0 56 32" fill="none" aria-hidden>
      <path
        d="M8 22C4 22 2 18 4 14C6 10 12 8 16 10C18 6 24 4 30 6C36 4 42 8 44 14C50 14 52 20 48 22H8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AuroraBackground() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 800], [0, -60]);
  const y2 = useTransform(scrollY, [0, 800], [0, -100]);
  const y3 = useTransform(scrollY, [0, 800], [0, -40]);
  const rotate1 = useTransform(scrollY, [0, 800], [0, 8]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Desk / chalkboard texture */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 3px,
            rgba(0,0,0,0.03) 3px,
            rgba(0,0,0,0.03) 4px
          )`,
        }}
      />

      {/* Main paper sheet */}
      <div
        className="aurora-paper notebook-rule absolute left-[8%] right-[8%] top-[3%] bottom-[5%] rounded-sm opacity-90"
        style={{
          background: "var(--paper)",
          boxShadow: "var(--glass-shadow-lg)",
          borderLeft: "2px solid var(--margin-line)",
        }}
      />

      {/* Margin line */}
      <div
        className="aurora-margin-line absolute top-[3%] bottom-[5%] w-0"
        style={{
          left: "calc(8% + 2.5rem)",
          borderLeft: "2px solid var(--margin-line)",
          opacity: 0.5,
        }}
      />

      <div className="aurora-cover-band" />
      <div className="aurora-cover-label" />
      <div className="aurora-binder-rings" />
      <div className="aurora-page-tabs">
        <span />
        <span />
        <span />
      </div>
      <div className="aurora-folder-tab" />
      <div className="aurora-paper-stack aurora-paper-stack--one" />
      <div className="aurora-paper-stack aurora-paper-stack--two" />

      {/* Parallax doodles */}
      {!reduceMotion ? (
        <>
          <motion.div style={{ y: y1, rotate: rotate1 }} className="aurora-doodle absolute left-[12%] top-[18%] text-[var(--ink-muted)] opacity-40">
            <DoodleStar />
          </motion.div>
          <motion.div style={{ y: y2 }} className="aurora-doodle absolute right-[14%] top-[28%] text-[var(--ink-muted)] opacity-35">
            <DoodleArrow />
          </motion.div>
          <motion.div style={{ y: y3 }} className="aurora-doodle absolute left-[20%] bottom-[22%] text-[var(--ink-muted)] opacity-30">
            <DoodleCloud />
          </motion.div>
          <motion.div
            style={{ y: y1 }}
            className="aurora-doodle absolute right-[18%] bottom-[30%] text-[var(--accent)] opacity-25"
          >
            <DoodleStar />
          </motion.div>
        </>
      ) : (
        <>
          <div className="aurora-doodle absolute left-[12%] top-[18%] text-[var(--ink-muted)] opacity-40">
            <DoodleStar />
          </div>
          <div className="aurora-doodle absolute right-[14%] top-[28%] text-[var(--ink-muted)] opacity-35">
            <DoodleArrow />
          </div>
        </>
      )}

      {/* Paper grain */}
      <div className="paper-grain absolute inset-0 opacity-60" />
    </div>
  );
}
