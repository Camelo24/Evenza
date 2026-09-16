import Link from "next/link";

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2" aria-label="Evenza home">
      <span className={`grid size-8 place-items-center rounded-full border ${inverse ? "border-white/40 text-marigold" : "border-ink/25 text-berry"}`}>
        <span className="logo-type -mt-0.5 text-xl font-bold">t</span>
      </span>
      <span className={`logo-type text-[1.55rem] font-semibold ${inverse ? "text-white" : "text-ink"}`}>Evenza</span>
    </Link>
  );
}
