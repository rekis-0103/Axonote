"use client";

import { motion } from "motion/react";

type SegmentedProps<T extends string> = {
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: SegmentedProps<T>) {
  return (
    <div className={`segmented ${className}`} role="tablist">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={value === opt.id}
          className={`segmented-item ${value === opt.id ? "segmented-item--active" : ""}`}
          onClick={() => onChange(opt.id)}
        >
          {value === opt.id ? (
            <motion.span layoutId="segment-ink" className="block">
              {opt.label}
            </motion.span>
          ) : (
            opt.label
          )}
        </button>
      ))}
    </div>
  );
}
