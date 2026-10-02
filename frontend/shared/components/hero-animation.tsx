"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export function HeroAnimation() {
  const { scrollYProgress } = useScroll();
  const filter = useTransform(scrollYProgress, [0, 1], ["blur(0px)", "blur(10px)"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0.25, 0]);

  return (
    <div className="absolute inset-0 -z-10">
      <motion.div
        className="absolute -right-24 top-20 size-[38rem] rounded-full bg-[#d4ff59] blur-[150px]"
        style={{ filter, opacity }}
        animate={{
          y: [0, -20, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -left-36 bottom-0 size-[28rem] rounded-full bg-[#315e51] blur-[120px]"
        style={{ filter, opacity }}
        animate={{
          y: [0, 20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
