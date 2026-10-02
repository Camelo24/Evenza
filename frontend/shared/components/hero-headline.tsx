"use client";

import { motion, useReducedMotion } from "framer-motion";

const lines: Array<Array<{ word: string; accent?: boolean }>> = [
  [{ word: "Bring" }, { word: "every" }],
  [{ word: "celebration" }, { word: "together.", accent: true }],
];

/** Hero headline with a staggered word reveal, inspired by studio-site hero animations. */
export function HeroHeadline() {
  const reducedMotion = useReducedMotion();
  let wordIndex = 0;

  return <h1 className="display mt-7 text-[clamp(3.6rem,7vw,6.6rem)] font-semibold leading-[.91] tracking-[-.035em]">
    {lines.map((line, lineIndex) => <span key={lineIndex} className="block">
      {line.map(({ word, accent }) => {
        const delay = wordIndex++ * 0.09;
        return <motion.span
          key={word}
          className={`mr-[.22em] inline-block last:mr-0${accent ? " text-[#d4ff59]" : ""}`}
          initial={reducedMotion ? false : { opacity: 0, y: 26, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
        >
          {word}
        </motion.span>;
      })}
    </span>)}
  </h1>;
}
