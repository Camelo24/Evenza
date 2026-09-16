"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function DashboardContent({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  return <motion.main initial={reducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .32, ease: [0.22, 1, 0.36, 1] }} className="p-4 sm:p-7 lg:p-9">{children}</motion.main>;
}
