import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/** Closing call to action — a large statement band before the footer. */
export function ClosingCta() {
  return <section className="dark-grid relative overflow-hidden py-24 text-white sm:py-32">
    <div className="pointer-events-none absolute -right-24 top-0 size-[26rem] rounded-full bg-[#d4ff59]/10 blur-[130px]" />
    <div className="container-shell relative text-center">
      <p className="eyebrow text-[#d4ff59]">Ready when you are</p>
      <h2 className="display mx-auto mt-6 max-w-3xl text-5xl font-semibold leading-[.94] sm:text-6xl">Let&rsquo;s make your next event unforgettable.</h2>
      <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/57">Create an account to plan with protected payments — or join as a reviewed professional when you are ready to be discovered.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/register" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#d4ff59] px-6 text-sm font-bold text-[#101716] transition hover:-translate-y-0.5 hover:bg-[#e2ff8e]">Create account <ArrowUpRight size={16} /></Link>
        <Link href="/access-request" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-sm font-bold text-white transition hover:bg-white/10">Become a professional</Link>
      </div>
      <p className="mono mt-12 text-[10px] uppercase tracking-[.18em] text-white/40">Weddings · Birthdays · Corporate · Festivals</p>
    </div>
  </section>;
}
