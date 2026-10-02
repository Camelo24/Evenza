import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, MapPin, Sparkles } from "lucide-react";
import { DashboardShell } from "@/shared/components/dashboard-shell";
import { EventApplicationButton } from "@/shared/components/event-application-button";
import { TicketPurchaseForm } from "@/shared/components/ticket-purchase-form";
import { formatXaf } from "@/shared/lib/format";
import { getClientData } from "@backend/client/queries";
import { getVendorDashboard } from "@backend/bookings/queries";
import { getVendor } from "@backend/vendors/queries";
import { getVendorEventApplications } from "@backend/events/queries";
import { getOpenHiringPostsForVendor, getVendorHiringInterviews } from "@backend/hiring/queries";
import { HiringApplicationButton } from "@/shared/components/hiring-application-button";
import { requireRole } from "@backend/auth/session";

export const dynamic = "force-dynamic";

export default async function ServiceProviderEventsPage() {
  const session = await requireRole("service_provider");
  const [data, dashboard] = await Promise.all([getClientData(session.userId), getVendorDashboard(session.userId)]);
  const [vendor, applications, hiringDomains, hiringInterviews] = dashboard ? await Promise.all([getVendor(dashboard.profile.slug), getVendorEventApplications(dashboard.profile.id), getOpenHiringPostsForVendor(dashboard.profile.id), getVendorHiringInterviews(dashboard.profile.id)]) : [null, [], [], []];
  const now = new Date();
  const events = data.events.filter((event) => event.visibility === "public" && event.startsAt > now).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const domains = vendor?.categories ?? [];
  const applied = new Map(applications.map((application) => [application.eventId, application.status]));

  return <DashboardShell role="service_provider" name={session.fullName} active="Find events">
    <header className="relative overflow-hidden rounded-[26px] bg-forest px-6 py-8 text-white sm:px-9 sm:py-10">
      <div className="pointer-events-none absolute -right-12 -top-24 size-72 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-2 -top-14 size-52 rounded-full border border-white/10" />
      <div className="relative max-w-3xl">
        <p className="eyebrow text-marigold">Service provider event board</p>
        <h1 className="display mt-3 text-4xl font-semibold sm:text-5xl">Find events to attend or work.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">Reserve a ticket to attend any public event. Apply to work an event when its requested service category matches your listed domain.</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-2 text-xs text-white/75"><BriefcaseBusiness size={14} className="text-marigold" />Your domains: {domains.length ? domains.map((category) => category.name).join(" · ") : "Set up your provider profile"}</span>
          {!dashboard && <Link href="/vendor/dashboard/services" className="rounded-full bg-marigold px-4 py-2 text-xs font-bold text-ink">Set up your profile</Link>}
          <Link href="/vendor/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 transition hover:text-white"><ArrowLeft size={14}/>Dashboard overview</Link>
        </div>
      </div>
    </header>

    {hiringInterviews.length > 0 && <section className="mt-9"><p className="eyebrow text-berry">Your interviews</p><div className="mt-4 grid gap-3">{hiringInterviews.map(({ interview, event, category }) => <article key={interview.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white p-4"><div><p className="text-sm font-semibold">{event.title} · {category.name}</p><p className="mt-1 text-xs capitalize text-ink/55">{interview.status} · {interview.scheduledAt.toLocaleString("en-CM", { dateStyle: "medium", timeStyle: "short" })}</p>{interview.location ? <p className="mt-1 text-xs text-ink/55">{interview.location}</p> : null}</div>{interview.status === "scheduled" && (interview.meetingUrl ? <a href={interview.meetingUrl} target="_blank" rel="noreferrer" className="btn-primary !min-h-9 !px-3 text-xs">Join live interview</a> : interview.location ? <span className="rounded-xl border border-ink/12 px-3 py-2 text-xs text-ink/60">In-person · {interview.location}</span> : null)}</article>)}</div></section>}

    <section className="mt-9"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow text-berry">Recruitment listings</p><h2 className="display mt-2 text-3xl font-semibold">Open service roles</h2></div><p className="text-xs text-ink/45">{hiringDomains.length} open {hiringDomains.length === 1 ? "domain" : "domains"}</p></div>{hiringDomains.length ? <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{hiringDomains.map(({ post, event, domain, category, application }) => <article key={domain.id} className="rounded-[22px] border border-ink/10 bg-white p-5 shadow-sm"><p className="eyebrow text-berry">{category.name}</p><h3 className="display mt-2 text-2xl font-semibold">{event.title}</h3><p className="mt-3 text-xs text-ink/55">{domain.placesNeeded - domain.placesFilled} of {domain.placesNeeded} places available</p><p className="mt-1 text-xs text-ink/55">Apply by {post.deadline.toLocaleString("en-CM", { dateStyle: "medium", timeStyle: "short" })}</p><div className="mt-4"><HiringApplicationButton hiringPostId={post.id} hiringDomainId={domain.id} applicationStatus={application?.status}/></div></article>)}</div> : <p className="mt-5 rounded-[22px] border border-dashed border-ink/15 bg-white/60 px-6 py-10 text-center text-sm text-ink/50">No matching recruitment listings are open right now.</p>}</section>

    <section className="mt-9">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow text-berry">Public events</p><h2 className="display mt-2 text-3xl font-semibold">Upcoming opportunities</h2></div><p className="text-xs text-ink/45">{events.length} {events.length === 1 ? "event" : "events"} open</p></div>
      {events.length ? <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{events.map((event) => {
        const categoryMatches = Boolean(event.serviceCategoryId && domains.some((category) => category.id === event.serviceCategoryId));
        const applicationStatus = applied.get(event.id);
        return <article key={event.id} className="overflow-hidden rounded-[22px] border border-ink/10 bg-white shadow-sm">
          <div className="relative aspect-[1.7] overflow-hidden bg-[#e8ece7]">{event.coverUrl ? <img src={event.coverUrl} alt={event.title} className="size-full object-cover"/> : <div className="grid size-full place-items-center text-forest/30"><Sparkles size={34}/></div>}<span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-forest">{event.eventType}</span></div>
          <div className="p-5"><h3 className="display text-2xl font-semibold leading-tight">{event.title}</h3><div className="mt-4 grid gap-2 text-xs text-ink/55"><span className="flex items-center gap-2"><CalendarDays size={14} className="text-berry"/>{event.startsAt.toLocaleString("en-CM", { dateStyle: "medium", timeStyle: "short" })}</span><span className="flex items-center gap-2"><MapPin size={14} className="text-berry"/>{event.venue}, {event.city}</span></div>
            {event.serviceCategoryId && <p className="mt-3 inline-flex rounded-full bg-forest/8 px-3 py-1.5 text-[10px] font-semibold text-forest">Service needed: {categoryMatches ? domains.find((category) => category.id === event.serviceCategoryId)?.name : "Different domain"}</p>}
            {event.ticketPrice !== null ? <TicketPurchaseForm eventId={event.id} price={event.ticketPrice} buttonLabel={event.ticketPrice === 0 ? "Reserve free ticket" : "Reserve ticket"} className="mt-4"/> : <p className="mt-4 rounded-xl bg-ink/4 px-4 py-3 text-center text-xs text-ink/55">This event is not accepting ticket reservations.</p>}
            {categoryMatches && <div className="mt-3 border-t border-ink/8 pt-3"><EventApplicationButton eventId={event.id} status={applicationStatus}/></div>}
          </div>
        </article>;
      })}</div> : <div className="mt-5 rounded-[22px] border border-dashed border-ink/15 bg-white/60 px-6 py-16 text-center"><CalendarDays className="mx-auto text-ink/25" size={26}/><h3 className="display mt-4 text-2xl font-semibold">No public events are open right now.</h3><p className="mt-2 text-sm text-ink/50">New events will appear here when organisers publish them.</p></div>}
    </section>
  </DashboardShell>;
}
