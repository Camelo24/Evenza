import { DevRegisterForm } from "@/shared/components/dev-register-form";
import { Logo } from "@/shared/components/logo";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

// Section 4 requires this route to be development-only. In production the
// route returns 404 so it cannot be discovered or invoked.

export default function DevRegisterPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 bg-white/70 backdrop-blur">
        <div className="container-shell flex h-[74px] items-center justify-between">
          <Logo/>
          <Link href="/" className="flex items-center gap-2 text-xs font-bold text-ink/55"><ArrowLeft size={14}/>Back to home</Link>
        </div>
      </header>
      <section className="container-shell grid gap-8 py-16 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-berry/10 px-3 py-2 text-[10px] font-bold text-berry"><AlertTriangle size={13}/>DEV ONLY · NOT SHIPPED IN PRODUCTION</span>
          <h1 className="display mt-6 text-5xl font-semibold leading-[.95] sm:text-6xl">Bootstrap a test<br/>account quickly.</h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-ink/55">This scaffold lets developers create accounts for any role while Modules 12 (Notifications) and 13 (Admin) are being iterated on. Retire the route once the Access Request flow is stable enough for QA to rely on production sign-up alone.</p>
          <div className="mt-8 rounded-2xl border border-ink/10 bg-white p-5">
            <p className="text-xs font-bold">Guardrails</p>
            <ul className="mt-3 space-y-2 text-[11px] leading-5 text-ink/55">
              <li>· Route returns 404 outside <span className="mono">NODE_ENV=development</span>.</li>
              <li>· The server action refuses to run in production.</li>
              <li>· Passwords are hashed with bcrypt like every other account.</li>
              <li>· Any created account still receives an in-app welcome notification.</li>
            </ul>
          </div>
        </div>
        <DevRegisterForm/>
      </section>
    </main>
  );
}
