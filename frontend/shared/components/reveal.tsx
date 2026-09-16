"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Direction = "up" | "left" | "right";

export function Reveal({ children, className = "", delay = 0, direction = "up" }: { children: ReactNode; className?: string; delay?: number; direction?: Direction }) {
  const reducedMotion = useReducedMotion();
  const offset = { x: direction === "left" ? -36 : direction === "right" ? 36 : 0, y: direction === "up" ? 18 : 0 };
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
