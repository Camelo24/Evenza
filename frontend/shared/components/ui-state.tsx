import { AlertCircle, CheckCircle2, Inbox, LoaderCircle, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type StateKind = "empty" | "error" | "success" | "loading";

const defaults: Record<StateKind, { icon: LucideIcon; tone: string }> = {
  empty: { icon: Inbox, tone: "bg-paper text-ink/45" },
  error: { icon: AlertCircle, tone: "bg-berry/10 text-berry" },
  success: { icon: CheckCircle2, tone: "bg-mint text-forest" },
  loading: { icon: LoaderCircle, tone: "bg-paper text-ink/45" },
};

export function UiState({ kind = "empty", title, description, action, className = "" }: { kind?: StateKind; title: string; description: string; action?: { label: string; href: string }; className?: string }) {
  const { icon: Icon, tone } = defaults[kind];
  return <div className={`state-panel ${className}`} role={kind === "error" ? "alert" : undefined}>
    <span className={`grid size-12 place-items-center rounded-2xl ${tone}`}><Icon size={21} className={kind === "loading" ? "animate-spin" : ""} /></span>
    <div><h2 className="display text-2xl font-semibold">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-ink/55">{description}</p>
      {action && <Link className="btn-ink mt-5" href={action.href}>{action.label}</Link>}
    </div>
  </div>;
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "secure" | "attention" | "danger" }) {
  const tones = { neutral: "bg-paper text-ink/55", secure: "bg-mint text-forest", attention: "bg-marigold/20 text-ink", danger: "bg-berry/10 text-berry" };
  return <span className={`status-pill ${tones[tone]}`}>{children}</span>;
}
