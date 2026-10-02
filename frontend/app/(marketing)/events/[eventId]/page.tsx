import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, CalendarDays, Clock3, MapPin, ShieldCheck, Ticket, Users } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/shared/components/site-header";
import { TicketPurchaseForm } from "@/shared/components/ticket-purchase-form";
import { getPublicEventById } from "@backend/events/queries";
import { formatXaf } from "@/shared/lib/format";

export const dynamic = "force-dynamic";

export default async function PublicEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await getPublicEventById(eventId);
  if (!event) notFound();

  const startsAt = new Date(event.startsAt);
  const now = new Date();
  const isLive = startsAt.getTime() <= now.getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const eventDay = new Date(startsAt.getFullYear(), startsAt.getMonth(), startsAt.getDate()).getTime();
  const daysUntil = Math.max(0, Math.round((eventDay - today) / 86_400_000));
  const badge = isLive ? "Happening now" : daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`;

  return <main className="min-h-screen bg-paper text-ink">
    <SiteHeader dark />
    <section className="container-shell pb-16 pt-8 sm:pb-24 sm:pt-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-forest transition hover:text-berry"><ArrowLeft size={16} />All events</Link>
      <div className="relative mt-6 min-h-[340px] overflow-hidden rounded-[28px] bg-forest sm:min-h-[450px]">
        {event.coverUrl ? <img src={event.coverUrl} alt={event.title} className="absolute inset-0 size-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-forest via-ink to-berry" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/15 to-ink/10" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10 lg:p-12">
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-marigold px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-ink">{event.eventType}</span><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${isLive ? "bg-berry text-white" : "bg-paper text-forest"}`}>{badge}</span></div>
          <h1 className="display mt-4 max-w-4xl text-4xl font-semibold leading-tight sm:text-6xl">{event.title}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/80"><span className="inline-flex items-center gap-2"><CalendarDays size={16} className="text-marigold" />{startsAt.toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}</span><span className="inline-flex items-center gap-2"><MapPin size={16} className="text-marigold" />{event.city}</span></p>
        </div>
      </div>
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <article className="rounded-[22px] border border-ink/10 bg-white p-6 sm:p-8">
            <p className="eyebrow text-berry">The experience</p><h2 className="display mt-2 text-2xl font-semibold">About this event</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-ink/65">{event.description || `Join us for ${event.title} in ${event.city}.`}</p>
          </article>
          <article className="rounded-[22px] border border-ink/10 bg-white p-6 sm:p-8">
            <p className="eyebrow text-berry">Plan your visit</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-forest"><CalendarDays size={18} /></span><div><p className="text-xs text-ink/45">Date and time</p><p className="mt-1 text-sm font-semibold">{startsAt.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}</p></div></div>
              <div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-forest"><MapPin size={18} /></span><div><p className="text-xs text-ink/45">Venue</p><p className="mt-1 text-sm font-semibold">{event.venue}, {event.city}</p></div></div>
              <div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-forest"><Users size={18} /></span><div><p className="text-xs text-ink/45">Event capacity</p><p className="mt-1 text-sm font-semibold">{event.guestCount.toLocaleString("en-CM")} guests</p></div></div>
              <div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-forest"><Clock3 size={18} /></span><div><p className="text-xs text-ink/45">Event status</p><p className="mt-1 text-sm font-semibold">{badge}</p></div></div>
            </div>
          </article>
          <article className="flex items-center justify-between gap-4 rounded-[22px] border border-ink/10 bg-white p-5 sm:p-6">
            <div><p className="eyebrow text-ink/42">Hosted by</p><p className="mt-1 font-semibold">{event.organiserName ?? "Event organiser"}</p></div>
            {event.organiserVerified && <span className="inline-flex items-center gap-2 rounded-full bg-mint px-3 py-2 text-xs font-bold text-forest"><BadgeCheck size={15} />Verified organiser</span>}
          </article>
        </div>
        <aside className="rounded-[22px] border border-forest/15 bg-white p-5 shadow-[0_16px_40px_rgba(23,35,31,.08)] lg:sticky lg:top-24 sm:p-6">
          <p className="eyebrow text-berry">Make it yours</p><h2 className="display mt-2 text-2xl font-semibold">Reserve your place</h2>
          <p className="mt-2 text-xs leading-5 text-ink/55">Your ticket details will be available in your Evenza wallet after reservation.</p>
          <div className="my-5 flex items-end justify-between border-y border-ink/10 py-4"><span className="text-xs text-ink/50">Ticket price</span><strong className="mono text-lg text-forest">{event.ticketPrice === null ? "Invite only" : formatXaf(event.ticketPrice)}</strong></div>
          {event.ticketPrice !== null ? <TicketPurchaseForm eventId={event.id} price={event.ticketPrice} buttonLabel="Reserve ticket" buttonClassName="btn-primary" /> : <p className="rounded-xl bg-paper p-4 text-sm leading-6 text-ink/60">Contact the organiser for reservation details.</p>}
          <p className="mt-4 flex items-start gap-2 text-[10px] leading-5 text-ink/45"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-forest" />Secure payment with mobile money.</p>
        </aside>
      </div>
    </section>
    <SiteFooter />
  </main>;
}
