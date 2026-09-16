import Link from "next/link";
import { ArrowUpRight, LogOut, Menu } from "lucide-react";
import { Logo } from "@/shared/components/logo";
import { dashboardForRole, getSession } from "@backend/auth/session";
import { logoutAction } from "@backend/auth/actions";
import { ScrollAwareHeader } from "@/shared/components/scroll-aware-header";

export async function SiteHeader({ dark = false }: { dark?: boolean }) {
  const session = await getSession();
  if (dark) return <ScrollAwareHeader dashboardHref={session ? dashboardForRole(session.role) : undefined} firstName={session?.fullName.split(" ")[0]} />;
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 text-ink backdrop-blur-xl">
      <div className="container-shell flex h-18.5 items-center justify-between gap-2 sm:gap-6">
        <div className="shrink-0"><Logo inverse={dark} /></div>
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex" aria-label="Primary navigation">
          <Link className="transition-opacity hover:opacity-55" href="/vendors">Find service providers</Link>
          <Link className="transition-opacity hover:opacity-55" href="/#how-it-works">How it works</Link>
          <Link className="transition-opacity hover:opacity-55" href="/#trust">Trust & escrow</Link>
        </nav>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {session ? (
            <>
              <Link className={`hidden sm:inline-flex ${dark ? "btn-secondary border-white/20! bg-white/10! text-white!" : "btn-secondary"}`} href={dashboardForRole(session.role)}>
                {session.fullName.split(" ")[0]} <ArrowUpRight size={15} />
              </Link>
              <form action={logoutAction} className="hidden sm:block">
                <button className="btn-ghost size-11! min-h-0! p-0!" title="Sign out" aria-label="Sign out"><LogOut size={17} /></button>
              </form>
            </>
          ) : (
            <>
              <Link className="hidden px-3 text-sm font-semibold sm:block" href="/login">Sign in</Link>
              <Link className="btn-primary hidden sm:inline-flex" href="/register">Create account <ArrowUpRight size={15} /></Link>
              <Link className="btn-secondary hidden sm:inline-flex" href="/access-request">Request access <ArrowUpRight size={15} /></Link>
            </>
          )}
          <details className="group relative md:hidden">
            <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-full border border-current/15" aria-label="Open navigation"><Menu size={21} /><span className="sr-only">Open navigation</span></summary>
              <nav className={`absolute right-0 top-[calc(100%+10px)] grid w-64 gap-1 rounded-2xl border p-2 shadow-2xl ${dark ? "border-white/15 bg-ink text-white" : "border-ink/10 bg-white text-ink"}`} aria-label="Mobile navigation">
               <Link className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-ink/5" href="/vendors">Find service providers</Link>
               <Link className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-ink/5" href="/#how-it-works">How it works</Link>
               <Link className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-ink/5" href="/#trust">Trust & escrow</Link>
              <div className={`my-1 h-px ${dark ? "bg-white/12" : "bg-ink/10"}`} />
              {session ? <Link className="btn-primary mx-2 mb-2" href={dashboardForRole(session.role)}>My dashboard <ArrowUpRight size={15} /></Link> : <><Link className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-ink/5" href="/login">Sign in</Link><Link className="btn-primary mx-2 mb-2" href="/register">Create account <ArrowUpRight size={15} /></Link><Link className="btn-secondary mx-2 mb-2" href="/access-request">Request access <ArrowUpRight size={15} /></Link></>}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-ink pb-8 pt-16 text-white">
      <div className="container-shell">
        <div className="grid gap-12 border-b border-white/12 pb-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo inverse />
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/58">Trusted people make unforgettable gatherings. Find, book, and pay Cameroon’s best event professionals with confidence.</p>
          </div>
          <div><p className="eyebrow text-marigold">Explore</p><div className="mt-5 grid gap-3 text-sm text-white/67"><Link href="/vendors">Marketplace</Link><Link href="/#how-it-works">How it works</Link><Link href="/#trust">Escrow protection</Link></div></div>
          <div><p className="eyebrow text-marigold">For partners</p><div className="mt-5 grid gap-3 text-sm text-white/67"><Link href="/access-request">Become a service provider</Link><Link href="/login">Partner sign in</Link></div></div>
          <div><p className="eyebrow text-marigold">Cameroon</p><div className="mt-5 grid gap-3 text-sm text-white/67"><span>Douala</span><span>Yaoundé</span><span>Buea · Limbe</span></div></div>
        </div>
        <div className="flex flex-col gap-3 pt-7 text-xs text-white/38 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Evenza. Celebrate with confidence.</span><span className="mono">TRUSTED DIGITAL FÊTES · CM</span></div>
      </div>
    </footer>
  );
}
