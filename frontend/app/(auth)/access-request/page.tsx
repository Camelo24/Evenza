import { AccessForm } from "@/shared/components/access-form";
import { Logo } from "@/shared/components/logo";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function AccessRequestPage() {
  return (
    <main className="relative min-h-screen bg-[#f3f5f0] text-ink overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-berry/5 rounded-full blur-3xl animate-drift"></div>
        <div className="absolute top-60 -left-20 w-72 h-72 bg-forest/5 rounded-full blur-3xl animate-drift" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-marigold/5 rounded-full blur-3xl animate-drift" style={{animationDelay: '4s'}}></div>
      </div>
      <header className="relative border-b border-[#dbe2dc] bg-[#f7f9f5]">
        <div className="container-shell flex h-18.5 items-center justify-between">
          <Logo />
          <Link href="/" className="flex items-center gap-2 text-xs font-bold text-ink/55"><ArrowLeft size={14}/>Home</Link>
        </div>
      </header>
      <section className="relative container-shell grid gap-8 py-10 lg:grid-cols-[.86fr_1.14fr] lg:py-20">
        <div className="rounded-[28px] bg-[#101716] p-7 text-white sm:p-10 lg:py-14">
          <h1 className="display mt-4 text-5xl font-semibold leading-[.95]">Apply as a service provider.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/70">Clients can sign up and begin organising immediately. Service providers are reviewed for trust and quality before they can accept bookings.</p>
          <div className="mt-8 flex items-start gap-3 text-xs text-white/60"><ShieldCheck className="mt-0.5 text-forest" size={16}/>Trust review for service providers only</div>
        </div>
        <div className="rounded-[28px] border border-[#dbe2dc] bg-white p-1 text-ink shadow-[0_24px_70px_rgba(16,23,22,.08)]"><AccessForm /></div>
      </section>
    </main>
  );
}
