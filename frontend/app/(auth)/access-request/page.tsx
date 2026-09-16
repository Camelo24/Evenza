import { AccessForm } from "@/shared/components/access-form";
import { Logo } from "@/shared/components/logo";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function AccessRequestPage() {
  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-ink/10">
        <div className="container-shell flex h-18.5 items-center justify-between">
          <Logo />
          <Link href="/" className="flex items-center gap-2 text-xs font-bold text-ink/55"><ArrowLeft size={14}/>Home</Link>
        </div>
      </header>
      <section className="container-shell grid gap-10 py-16 lg:grid-cols-2">
        <div>
          <p className="eyebrow text-berry">Module 14 · Access request</p>
          <h1 className="display mt-4 text-5xl font-semibold leading-[.95]">Apply as a service provider.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-ink/55">Clients can sign up and begin organising immediately. Service providers are reviewed for trust and quality before they can accept bookings.</p>
          <div className="mt-8 flex items-start gap-3 text-xs text-ink/50"><ShieldCheck className="mt-0.5 text-forest" size={16}/>Trust review for service providers only</div>
        </div>
        <AccessForm />
      </section>
    </main>
  );
}
