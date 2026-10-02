"use client";

import { Sparkles } from "lucide-react";

export function AssistantSidebarButton({ label, compact = false }: { label: string; compact?: boolean }) {
  return <button
    type="button"
    onClick={() => window.dispatchEvent(new Event("evenza:open-ai-assistant"))}
    className={compact
      ? "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-[#f2f3f5] px-3 py-1.5 text-xs text-ink/60 transition hover:bg-mint hover:text-forest"
      : "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] text-ink/60 transition hover:bg-mint/50 hover:text-forest"}
  >
    <Sparkles size={compact ? 14 : 16} className={compact ? "text-forest" : "text-forest/70"} />
    {label}
  </button>;
}
