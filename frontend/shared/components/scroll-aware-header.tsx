"use client";

import Link from "next/link";
import { ArrowUpRight, LogOut, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Logo } from "@/shared/components/logo";
import { logoutAction } from "@backend/auth/actions";

type HeaderState = "full" | "logo" | "hidden";

export function ScrollAwareHeader({ dashboardHref, firstName }: { dashboardHref?: string; firstName?: string }) {
  const [headerState, setHeaderState] = useState<HeaderState>("full");
  const lastY = useRef(0);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 72) {
        if (revealTimer.current) clearTimeout(revealTimer.current);
        setHeaderState("full");
      } else if (currentY > lastY.current + 8) {
        if (revealTimer.current) clearTimeout(revealTimer.current);
        setHeaderState("hidden");
      } else if (currentY < lastY.current - 8) {
        setHeaderState("logo");
        if (revealTimer.current) clearTimeout(revealTimer.current);
        revealTimer.current = setTimeout(() => setHeaderState("full"), 520);
      }
      lastY.current = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (revealTimer.current) clearTimeout(revealTimer.current); };
  }, []);

  function scrollToTrust(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const target = document.getElementById("trust");
    if (!target) {
      window.location.assign("/#trust");
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    // Account for the fixed header after the browser has begun the smooth scroll.
    window.setTimeout(() => window.scrollBy({ top: -82, behavior: "smooth" }), 80);
    window.history.pushState(null, "", "#trust");
  }

  return <header className={`marketing-scroll-header is-${headerState}`}>
    <div className="container-shell marketing-scroll-header-inner">
      <div className="shrink-0"><Logo inverse /></div>
      <nav className="marketing-scroll-nav" aria-label="Primary navigation"><Link href="/vendors">Find service providers</Link><Link href="/#how-it-works">How it works</Link><a href="#trust" onClick={scrollToTrust}>Trust &amp; escrow</a></nav>
      <div className="marketing-scroll-actions">{dashboardHref && firstName ? <><Link className="btn-secondary border-white/20! bg-white/10! text-white!" href={dashboardHref}>{firstName} <ArrowUpRight size={15} /></Link><form action={logoutAction}><button className="btn-ghost size-11! min-h-0! p-0!" aria-label="Sign out"><LogOut size={17} /></button></form></> : <><Link className="px-3 text-sm font-semibold" href="/login">Sign in</Link><Link className="btn-primary" href="/register">Create account <ArrowUpRight size={15} /></Link><Link className="btn-secondary" href="/access-request">Request access <ArrowUpRight size={15} /></Link></>}<details className="marketing-scroll-menu"><summary aria-label="Open navigation"><Menu size={21} /></summary><nav><Link href="/vendors">Find service providers</Link><Link href="/#how-it-works">How it works</Link><a href="#trust" onClick={scrollToTrust}>Trust &amp; escrow</a>{!dashboardHref && <Link href="/access-request">Request access</Link>}</nav></details></div>
    </div>
  </header>;
}
