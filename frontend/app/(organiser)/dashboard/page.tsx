import { confirmCompletion } from "@backend/escrow/actions";
import { raiseDispute } from "@backend/disputes/actions";
import { DashboardShell } from "@/shared/components/dashboard-shell";
import { ReviewForm } from "@/shared/components/review-form";
import { requireRole } from "@backend/auth/session";
import { getOrganiserDashboard, getBookingReview } from "@backend/bookings/queries";
import { formatXaf } from "@/shared/lib/format";
import { ArrowRight, CalendarDays, CheckCircle2, CreditCard, MapPin, Plus, Search, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = { pending_vendor_acceptance: "Awaiting vendor", confirmed: "Confirmed", rejected: "Rejected", awaiting_review: "Review delivery", completed: "Completed", disputed: "In dispute", cancelled: "Cancelled", in_progress: "In progress" };
type AgreementSnapshot = { version?: string; capturedAt?: string; service?: { name?: string; description?: string; durationHours?: number; price?: number }; payment?: { serviceTotal?: number; escrowMode?: string; depositPercent?: number; protectedNow?: number }; cancellationAndRefundPolicy?: string[] };

export default async function OrganiserDashboard() {
  const session = await requireRole("organiser");
  const data = await getOrganiserDashboard(session.userId);
  const primary = data.bookings[0];
  const agreement = (primary?.booking.termsSnapshot ?? null) as AgreementSnapshot | null;
  const existingReview = primary ? await getBookingReview(primary.booking.id) : null;
  const held = data.bookings.reduce((sum, item) => sum + (["held", "release_scheduled", "disputed"].includes(item.escrow?.status ?? "") ? item.escrow?.amount ?? 0 : 0), 0);
  const confirmedCount = data.bookings.filter((item) => ["confirmed", "in_progress", "awaiting_review"].includes(item.booking.status)).length;
  const daysUntil = primary ? Math.max(0, Math.ceil((primary.booking.eventDate.getTime() - Date.now()) / 86400000)) : 0;
  return (
    <DashboardShell role="organiser" name={session.fullName} allowViewSwitch={true}>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="eyebrow text-berry">Organiser overview</p><h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">Your celebrations, clearly held.</h1><p className="mt-3 text-sm text-ink/50">Bookings, protected funds, and conversations in one calm place.</p></div>
        <Link href="/vendors" className="btn-primary"><Search size={16} />Find a service provider</Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-ink p-5 text-white"><div className="flex justify-between"><p className="eyebrow text-white/38">Funds protected</p><ShieldCheck size={18} className="text-marigold" /></div><p className="mono mt-6 text-2xl font-semibold">{formatXaf(held)}</p><p className="mt-2 text-[10px] text-white/38">Across active escrow</p></div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5"><div className="flex justify-between"><p className="eyebrow text-ink/38">Active bookings</p><CalendarDays size={18} className="text-berry" /></div><p className="display mt-5 text-4xl font-semibold">{confirmedCount}</p><p className="mt-1 text-[10px] text-ink/38">Confirmed or in delivery</p></div>
        <div className="rounded-2xl border border-ink/10 bg-marigold p-5"><div className="flex justify-between"><p className="eyebrow text-ink/45">Next fête</p><Sparkles size={18} /></div><p className="display mt-5 text-4xl font-semibold">{primary ? daysUntil : "—"}<span className="ml-1 text-sm">days</span></p><p className="mt-1 truncate text-[10px] text-ink/48">{primary?.booking.eventType ?? "No event scheduled"}</p></div>
      </div>

      {primary ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <div className="min-w-0 space-y-6">
            <section id="bookings" className="overflow-hidden rounded-[22px] border border-ink/10 bg-white">
              <div className="relative h-48 overflow-hidden"><img src={primary.vendor.coverUrl} alt="" className="size-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" /><div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white"><div><span className="rounded-full bg-marigold px-2.5 py-1 text-[9px] font-bold text-ink">{statusLabels[primary.booking.status]?.toUpperCase()}</span><h2 className="display mt-3 text-3xl font-semibold">{primary.booking.eventType} · {primary.vendor.businessName}</h2></div><p className="mono text-xs text-white/55">{primary.booking.reference}</p></div></div>
              <div className="grid gap-6 p-5 sm:grid-cols-3 sm:p-7"><div><p className="eyebrow text-ink/35">Date</p><p className="mt-2 text-sm font-bold">{primary.booking.eventDate.toLocaleDateString("en-CM", { day: "numeric", month: "long", year: "numeric" })}</p></div><div><p className="eyebrow text-ink/35">Location</p><p className="mt-2 flex items-center gap-1.5 text-sm font-bold"><MapPin size={13} className="text-berry" />{primary.booking.venue}</p></div><div><p className="eyebrow text-ink/35">Service</p><p className="mt-2 text-sm font-bold">{primary.service?.name ?? "Custom service"}</p></div></div>
              {primary.booking.status === "awaiting_review" ? (
                <div className="border-t border-ink/10 bg-marigold/15 p-5 sm:p-7">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm font-bold">Review delivery before escrow releases</p><p className="mt-1 text-xs text-ink/52">Deadline: {primary.booking.reviewDeadline?.toLocaleString("en-CM", { dateStyle: "medium", timeStyle: "short" })}</p></div><form action={confirmCompletion}><input type="hidden" name="bookingId" value={primary.booking.id} /><button className="btn-ink"><CheckCircle2 size={15} />Confirm completion</button></form></div>
                  <details className="mt-5 border-t border-ink/10 pt-4"><summary className="cursor-pointer text-xs font-bold text-berry">Something is wrong? Raise an evidence-backed dispute</summary><form action={raiseDispute} className="mt-4 grid gap-3 sm:grid-cols-2"><input type="hidden" name="bookingId" value={primary.booking.id} /><input className="field" name="reason" placeholder="Short reason" required /><input className="field" name="evidenceUrl" type="url" placeholder="Evidence URL (optional)" /><textarea className="textarea-field sm:col-span-2" name="description" placeholder="Describe what was agreed and what happened…" required /><button className="btn-secondary justify-self-start !border-berry/30 !text-berry">Freeze escrow & open dispute</button></form></details>
                </div>
              ) : null}
              {primary.booking.status === "completed" && !existingReview ? (
                <div className="border-t border-ink/10 bg-mint/40 p-5 sm:p-7"><p className="text-sm font-bold">Escrow released — share how it went.</p><div className="mt-4"><ReviewForm bookingId={primary.booking.id} serviceProviderName={primary.vendor.businessName} /></div></div>
              ) : null}
              {existingReview ? <div className="border-t border-ink/10 bg-paper p-5 sm:p-7"><p className="text-xs font-bold text-forest">You reviewed this booking {existingReview.rating}★ — thank you.</p></div> : null}
            </section>

            {agreement && primary.booking.termsAcceptedAt && (
              <section className="rounded-[22px] border border-forest/20 bg-mint/30 p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-forest">Confirmed agreement</p><h2 className="display mt-2 text-3xl font-semibold">These terms are fixed.</h2><p className="mt-2 text-xs leading-5 text-ink/55">Accepted by both parties on {primary.booking.termsAcceptedAt.toLocaleString("en-CM", { dateStyle: "medium", timeStyle: "short" })}. Later listing edits cannot change this booking.</p></div><div className="text-right"><ShieldCheck className="ml-auto text-forest" size={22} /><p className="mt-2 text-[9px] font-bold uppercase text-forest">{primary.contract?.status === "executed" ? "Contract executed" : "Agreement recorded"}</p></div></div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-white/75 p-4"><p className="text-[10px] font-bold uppercase text-ink/42">Service promised</p><p className="mt-2 text-sm font-bold">{agreement.service?.name ?? primary.service?.name ?? "Saved service"}</p><p className="mt-1 text-xs leading-5 text-ink/55">{agreement.service?.description}</p><p className="mono mt-3 text-xs">{formatXaf(agreement.payment?.serviceTotal ?? agreement.service?.price ?? primary.booking.totalAmount)} · {agreement.service?.durationHours ?? primary.service?.durationHours ?? "—"} hours</p></div><div className="rounded-xl bg-white/75 p-4"><p className="text-[10px] font-bold uppercase text-ink/42">Protected payment</p><p className="mono mt-2 text-sm font-bold">{formatXaf(agreement.payment?.protectedNow ?? primary.booking.fundedAmount)} held now</p><p className="mt-1 text-xs leading-5 text-ink/55">{agreement.payment?.escrowMode === "deposit" ? `${agreement.payment.depositPercent}% deposit` : "Full escrow"} · total {formatXaf(agreement.payment?.serviceTotal ?? primary.booking.totalAmount)}</p></div></div>
                <div className="mt-4 rounded-xl border border-forest/15 bg-white/70 p-4"><p className="text-[10px] font-bold uppercase text-ink/42">Cancellation & refund policy</p><ul className="mt-2 grid gap-1.5 text-xs leading-5 text-ink/58">{agreement.cancellationAndRefundPolicy?.map((policy) => <li key={policy}>• {policy}</li>) ?? <li>Terms are retained with this booking for review.</li>}</ul></div>
              </section>
            )}

            <section id="escrow" className="rounded-[22px] border border-ink/10 bg-white p-5 sm:p-7"><div className="flex items-start justify-between"><div><p className="eyebrow text-berry">Escrow protection</p><h2 className="display mt-2 text-3xl font-semibold">Your money has a clear path.</h2></div><span className="rounded-full bg-mint px-3 py-1.5 text-[9px] font-bold text-forest">{primary.escrow?.status.replaceAll("_", " ").toUpperCase()}</span></div>
              <div className="mt-7 grid gap-0 sm:grid-cols-4">{[["1", "Authorised", true], ["2", "Held in escrow", true], ["3", "Delivery", ["awaiting_review", "completed"].includes(primary.booking.status)], ["4", "Released", primary.escrow?.status === "released"]].map(([number, label, done], index) => <div key={String(label)} className="relative flex gap-3 pb-5 sm:block sm:pb-0"><span className={`relative z-10 grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${done ? "bg-forest text-white" : "bg-paper text-ink/32"}`}>{done ? "✓" : number}</span>{index < 3 && <span className="absolute bottom-0 left-3.5 top-7 w-px bg-ink/10 sm:left-7 sm:right-0 sm:top-3.5 sm:h-px sm:w-auto" />}<p className={`text-xs sm:mt-3 ${done ? "font-bold" : "text-ink/36"}`}>{String(label)}</p></div>)}</div>
              <div className="mt-7 flex flex-col justify-between gap-4 rounded-xl bg-paper p-4 sm:flex-row sm:items-center"><div><p className="text-[10px] text-ink/42">Amount protected</p><p className="mono mt-1 text-lg font-semibold">{formatXaf(primary.escrow?.amount ?? primary.booking.fundedAmount)}</p></div><p className="max-w-xs text-[10px] leading-5 text-ink/45">Funds release only on your confirmation, after five clear review days, or following a logged admin resolution.</p></div>
            </section>

          </div>
          <aside className="space-y-6">
            <section className="rounded-[22px] border border-ink/10 bg-white p-5"><div className="flex items-center justify-between"><p className="eyebrow text-ink/40">Recent updates</p><span className="size-2 rounded-full bg-berry" /></div><div className="mt-4 divide-y divide-ink/10">{data.notifications.slice(0, 4).map((note) => <div className="py-4" key={note.id}><p className="text-xs font-bold">{note.title}</p><p className="mt-1 text-[10px] leading-5 text-ink/45">{note.body}</p></div>)}</div></section>
            <section className="rounded-[22px] bg-forest p-6 text-white"><CreditCard size={20} className="text-marigold" /><h3 className="display mt-6 text-2xl font-semibold">Need another expert?</h3><p className="mt-2 text-xs leading-5 text-white/50">Build your event team from independently verified vendors.</p><Link href="/vendors" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-marigold">Browse marketplace <ArrowRight size={13} /></Link></section>
          </aside>
        </div>
      ) : (
        <div className="paper-card mt-8 py-20 text-center"><Plus className="mx-auto text-ink/25" /><h2 className="display mt-4 text-3xl font-semibold">Your first fête starts here.</h2><p className="mt-2 text-sm text-ink/50">Explore trusted vendors and make a protected booking.</p><Link href="/vendors" className="btn-primary mt-6">Find a vendor <ArrowRight size={15} /></Link></div>
      )}
    </DashboardShell>
  );
}
