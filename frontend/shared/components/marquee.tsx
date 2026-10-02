import type { CSSProperties, ReactNode } from "react";

/**
 * Seamless CSS marquee. Children are rendered twice; the track slides exactly
 * one half (-50%) so the loop never jumps. Pauses on hover/focus via CSS.
 * Each child should carry its own trailing spacing (padding) rather than
 * relying on `gap`, so both halves measure identically.
 */
export function Marquee({ children, duration = 32, className = "" }: { children: ReactNode; duration?: number; className?: string }) {
  return <div className={`marquee ${className}`}>
    <div className="marquee-track" style={{ "--marquee-duration": `${duration}s` } as CSSProperties}>
      <div className="flex shrink-0 items-stretch">{children}</div>
      <div className="flex shrink-0 items-stretch" aria-hidden="true">{children}</div>
    </div>
  </div>;
}
