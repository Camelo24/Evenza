import type { ReactNode } from "react";

export function PageHeading({ eyebrow, title, description, aside }: { eyebrow: string; title: string; description?: string; aside?: ReactNode }) {
  return <header className="page-heading">
    <div><p className="eyebrow text-berry">{eyebrow}</p><h1 className="display mt-3 text-[clamp(2.3rem,4vw,3.3rem)] font-semibold leading-[.95]">{title}</h1>{description && <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/56">{description}</p>}</div>
    {aside && <div className="shrink-0">{aside}</div>}
  </header>;
}
