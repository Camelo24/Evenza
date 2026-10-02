import Link from "next/link";

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2" aria-label="Evenza home">
      <span className={`grid size-8 place-items-center rounded-lg ${inverse ? "bg-[#d4ff59]" : "bg-[#d4ff59]"}`}>
        <div className="flex flex-col gap-1.5">
          <span className={`h-0.5 w-4 ${inverse ? "bg-[#101716]" : "bg-[#101716]"}`}></span>
          <span className={`h-0.5 w-2.5 ${inverse ? "bg-[#101716]" : "bg-[#101716]"}`}></span>
          <span className={`h-0.5 w-4 ${inverse ? "bg-[#101716]" : "bg-[#101716]"}`}></span>
        </div>
      </span>
      <span className={`logo-type text-[1.55rem] font-semibold ${inverse ? "text-white" : "text-[#101716]"}`}>Evenza</span>
    </Link>
  );
}
