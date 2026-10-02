import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, Check, ChevronRight, CreditCard, MapPin, ShieldCheck, Star, Ticket, Users } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/shared/components/site-header";
import { UiState } from "@/shared/components/ui-state";
import { ScrollAnimation } from "@/shared/components/scroll-animation";
import { BackToTop } from "@/shared/components/back-to-top";
import { HeroAnimation } from "@/shared/components/hero-animation";
import { HeroCard } from "@/shared/components/hero-card";
import { HeroHeadline } from "@/shared/components/hero-headline";
import { TrustMarquee } from "@/shared/components/trust-marquee";
import { TestimonialsMarquee } from "@/shared/components/testimonials-marquee";
import { ClosingCta } from "@/shared/components/closing-cta";
import { CategoriesParallax } from "@/shared/components/categories-parallax";
import { Reveal } from "@/shared/components/reveal";
import { getCategories, getVendors } from "@backend/vendors/queries";
import { getLiveEvents, getUpcomingEvents } from "@backend/events/queries";
import { getPublicReviews } from "@backend/reviews/queries";
import { formatRating, formatXaf } from "@/shared/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, categories, liveEvents, upcomingEvents, reviews] = await Promise.all([getVendors({ featured: true }), getCategories(), getLiveEvents(), getUpcomingEvents(), getPublicReviews()]);
  const eventsToShow = [...liveEvents, ...upcomingEvents].slice(0, 6);

  return <main className="bg-[#101716] text-white">
    <ScrollAnimation>
      <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#101716]">
        <SiteHeader dark />
        <HeroAnimation />
        <div className="container-shell grid min-h-[760px] gap-14 pb-16 pt-36 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:pb-24">
          <div className="max-w-3xl"><p className="eyebrow flex items-center gap-2 text-[#d4ff59]"><span className="size-1.5 rounded-full bg-[#d4ff59]" /> Event services, structured</p><HeroHeadline /><p className="mt-8 max-w-xl text-[1.04rem] leading-8 text-white/60">Evenza connects you with verified event professionals, clear service terms, and protected payments in one considered workspace.</p><div className="mt-10 flex flex-wrap gap-3"><Link href="/vendors" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#d4ff59] px-5 text-sm font-bold text-[#101716] transition hover:-translate-y-0.5 hover:bg-[#e2ff8e]">Explore professionals <ArrowUpRight size={17} /></Link><Link href="#how-it-works" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 px-5 text-sm font-bold text-white transition hover:bg-white/10">How it works <ArrowRight size={16} /></Link></div><div className="mt-14 grid max-w-2xl gap-4 border-t border-white/12 pt-6 sm:grid-cols-3">{[["01", "Verified professionals"], ["02", "Protected payments"], ["03", "Clear delivery terms"]].map(([number, label]) => <div key={number}><p className="mono text-xl text-[#d4ff59]">{number}</p><p className="mt-2 text-xs text-white/52">{label}</p></div>)}</div></div>
          <HeroCard />
        </div>
      </section>
    </ScrollAnimation>
    <ScrollAnimation>
      <TrustMarquee />
    </ScrollAnimation>
    <ScrollAnimation>
      <section className="bg-[#f3f5f0] py-24 text-[#101716] sm:py-32"><div className="container-shell"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="eyebrow text-[#3f725d]">One trusted network</p><h2 className="display mt-5 text-5xl font-semibold leading-[.94] sm:text-6xl">Every detail,<br />one place.</h2></div><p className="max-w-xl text-sm leading-7 text-[#59645f]">Find teams that fit your celebration, agree on the work before funds move, and follow every booking without chasing messages or receipts.</p></div><div className="mt-14 grid overflow-hidden rounded-[24px] border border-[#dbe2dc] bg-[#dbe2dc] sm:grid-cols-3">{[["Discover", "Browse reviewed professionals and compare service packages."], ["Book clearly", "Save the scope, date, and payment terms in one booking."], ["Celebrate calmly", "Follow delivery and approve release when work is complete."]].map(([title, copy], index) => <article key={title} className="min-h-60 bg-white p-7"><span className="mono text-xs text-[#3f725d]">0{index + 1}</span><h3 className="mt-14 text-2xl font-bold tracking-tight">{title}</h3><p className="mt-3 max-w-xs text-sm leading-6 text-[#68736d]">{copy}</p></article>)}</div></div></section>
    </ScrollAnimation>
    <ScrollAnimation>
      <section className="bg-ink py-14 text-paper sm:py-20"><div className="container-shell"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="eyebrow text-marigold">Events in Cameroon</p><h2 className="display mt-2 text-3xl font-semibold sm:text-4xl">{eventsToShow.length} événements trouvés</h2></div><p className="max-w-xs text-sm leading-6 text-white/60">Find an event, check the details, and reserve your place.</p></div><div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{eventsToShow.length ? eventsToShow.map((event) => {
        const startsAt = new Date(event.startsAt);
        const now = new Date();
        const isLive = startsAt.getTime() <= now.getTime();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const eventDay = new Date(startsAt.getFullYear(), startsAt.getMonth(), startsAt.getDate()).getTime();
        const daysUntil = Math.max(0, Math.round((eventDay - today) / 86_400_000));
        const timeBadge = isLive ? "Happening now" : daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `Starts in ${daysUntil} days`;
        return <article key={event.id} className="grid min-h-[218px] grid-cols-[40%_60%] overflow-hidden rounded-[17px] border border-white/12 bg-forest text-paper shadow-[0_12px_32px_rgba(0,0,0,.18)]">
          <div className="relative min-h-[218px] overflow-hidden bg-ink">
            {event.coverUrl ? <img src={event.coverUrl} alt={event.title} className="absolute inset-0 size-full object-cover" /> : <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-forest to-ink"><CalendarDays size={54} className="text-white/30" /></div>}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-black/10" />
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-lg border border-white/70 bg-paper/95 px-3 py-2 text-[10px] font-bold text-forest shadow-sm backdrop-blur"><span className={`size-2 rounded-full ${isLive ? "animate-pulse bg-berry" : "bg-marigold"}`} />{timeBadge}</span>
          </div>
          <div className="flex min-w-0 flex-col p-3 sm:p-3.5">
            <h3 className="truncate text-sm font-semibold tracking-tight sm:text-base">{event.title}</h3>
            <div className="mt-1.5 grid gap-1 text-[11px] leading-4 text-white/65 sm:text-xs">
              <p className="flex min-w-0 items-center gap-1.5"><CalendarDays size={14} className="shrink-0 text-marigold" />{startsAt.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</p>
              <p className="flex min-w-0 items-center gap-1.5"><MapPin size={14} className="shrink-0 text-berry" /><span className="truncate">{event.venue}, {event.city}</span></p>
              <p className="flex min-w-0 items-center gap-1.5"><Users size={14} className="shrink-0 text-marigold" />Capacity: {event.guestCount.toLocaleString("en-CM")}</p>
            </div>
            <p className="mt-1.5 truncate text-sm font-medium text-mint">{event.ticketPrice === null ? "Invitation only" : `From ${formatXaf(event.ticketPrice)}`}</p>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1 text-[10px] text-white/65"><span className="truncate">by {event.organiserName ?? "Event organiser"}</span>{event.organiserVerified && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-1.5 py-0.5 text-marigold"><BadgeCheck size={11} />Verified</span>}</div>
            <Link href={`/events/${event.id}`} className="mt-auto inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-full bg-berry px-2 text-xs font-medium text-white transition hover:bg-berry/85"><Ticket size={14} />View &amp; reserve</Link>
          </div>
        </article>;
      }) : <div className="rounded-2xl border border-dashed border-[#b9c8bd] bg-white/60 p-8 text-sm text-[#65716b]">No public events are scheduled right now. Check back soon for upcoming events across Cameroon.</div>}</div></div></section>
    </ScrollAnimation>
    <ScrollAnimation>
      <CategoriesParallax categories={categories} />
    </ScrollAnimation>
    <ScrollAnimation>
      <section id="trust" className="scroll-mt-24 bg-[#101716] py-24 sm:py-32"><div id="how-it-works" className="container-shell grid gap-12 lg:grid-cols-[.9fr_1.1fr]"><div><p className="eyebrow text-[#d4ff59]">Payment, with a clear path</p><h2 className="display mt-5 text-5xl font-semibold leading-[.94] sm:text-6xl">Confidence in every commitment.</h2><p className="mt-6 max-w-xl text-[15px] leading-8 text-white/57">Payment stays protected while the agreed work happens. Delivery, review, and release are visible to everyone involved.</p><Link href="/access-request" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#d4ff59]">Become a professional <ArrowRight size={16} /></Link></div><div className="grid gap-3">{[[CreditCard, "Payment is protected", "Funds follow the terms saved with the booking."], [ShieldCheck, "People are reviewed", "Trust checks help keep the marketplace deliberate."], [Check, "The work stays clear", "A shared record keeps every booking on the same page."]].map(([Icon, title, copy]) => { const FeatureIcon = Icon as typeof CreditCard; return <div key={title as string} className="rounded-2xl border border-white/12 bg-white/5 p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#d4ff59] text-[#101716]"><FeatureIcon size={18} /></span><div><h3 className="font-bold">{title as string}</h3><p className="mt-1 text-xs text-white/50">{copy as string}</p></div></div></div>; })}</div></div></section>
    </ScrollAnimation>
    <ScrollAnimation>
      <section className="bg-[#e9eee9] py-24 text-[#101716] sm:py-32"><div className="container-shell"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="eyebrow text-[#3f725d]">Selected for you</p><h2 className="display mt-5 text-5xl font-semibold leading-[.94] sm:text-6xl">Meet the people<br />behind the plan.</h2></div><div className="max-w-xs text-sm leading-6 text-[#65716b]">Each public profile is built around clear services, availability, and trust signals.</div></div><div className="mt-12 grid gap-5 md:grid-cols-3">{featured.length ? featured.slice(0, 3).map((vendor) => <Link href={`/vendors/${vendor.slug}`} key={vendor.id} className="group overflow-hidden rounded-[20px] border border-[#d6dfd8] bg-white transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(16,23,22,.12)]"><div className="relative aspect-[4/3] overflow-hidden"><img src={vendor.imageUrl} alt={vendor.businessName} className="size-full object-cover transition duration-700 group-hover:scale-[1.04]" /><span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#101716] px-3 py-1.5 text-[9px] font-bold text-[#d4ff59]"><BadgeCheck size={12} /> VERIFIED</span></div><div className="p-5"><div className="flex justify-between gap-4"><div><p className="text-xl font-bold tracking-tight">{vendor.businessName}</p><p className="mt-1 text-xs text-[#68736d]">{vendor.categories.map((category) => category.name).join(" · ")}</p></div><span className="flex items-center gap-1 text-xs font-bold"><Star size={13} fill="currentColor" className="text-[#d69918]" />{formatRating(vendor.rating)}</span></div><div className="mt-5 flex justify-between border-t border-[#e4e9e5] pt-4 text-xs text-[#68736d]"><span className="flex items-center gap-1"><MapPin size={13} />{vendor.city}</span><strong className="text-[#101716]">{formatXaf(vendor.startingPrice)}</strong></div></div></Link>) : <UiState className="md:col-span-3" title="Our first vendors are on their way" description="We're reviewing every profile before it appears." />}</div><div className="mt-10 text-center"><Link href="/vendors" className="inline-flex items-center gap-2 rounded-full bg-[#101716] px-6 py-3 text-sm font-bold text-[#d4ff59] transition hover:bg-[#1b2b27]">View marketplace <ArrowUpRight size={16} /></Link></div></div></section>
    </ScrollAnimation>
    <ScrollAnimation>
      <TestimonialsMarquee reviews={reviews} />
    </ScrollAnimation>
    <ScrollAnimation>
      <ClosingCta />
    </ScrollAnimation>
    <BackToTop />
    <SiteFooter />
  </main>;
}
