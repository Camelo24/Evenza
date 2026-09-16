import { serviceProviderBookingDecision } from "@backend/bookings/actions";
import { markBookingComplete, submitBookingEvidence } from "@backend/escrow/actions";
import { DashboardShell } from "@/shared/components/dashboard-shell";
import { requireRole } from "@backend/auth/session";
import { getVendorDashboard } from "@backend/bookings/queries";
import { formatRating, formatXaf } from "@/shared/lib/format";
import { BadgeCheck, CalendarDays, Camera, Check, Clock3, MapPin, Navigation, QrCode, ShieldCheck, Star, UploadCloud, WalletCards, X } from "lucide-react";
import { ServiceProviderProfileForm } from "@/shared/components/vendor-profile-form";
import { ServiceServiceForm } from "@/shared/components/vendor-service-form";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = { pending_vendor_acceptance: "New request", confirmed: "Confirmed", rejected: "Declined", awaiting_review: "Client review", completed: "Completed", disputed: "In dispute", cancelled: "Cancelled", in_progress: "In progress" };
type AgreementSnapshot = { service?: { name?: string; description?: string; durationHours?: number }; payment?: { serviceTotal?: number; protectedNow?: number } };

export default async function ServiceProviderDashboardPage() {
  const session = await requireRole("service_provider");
  const data = await getVendorDashboard(session.userId);
  if (!data) return <DashboardShell role="service_provider" name={session.fullName}><ServiceProviderProfileForm /></DashboardShell>;
  const primary = data.bookings[0];
  const agreement = (primary?.booking.termsSnapshot ?? null) as AgreementSnapshot | null;
  const pending = data.bookings.filter((item) => item.booking.status === "pending_vendor_acceptance").length;
  const held = data.bookings.reduce((sum, item) => sum + (["held", "release_scheduled"].includes(item.escrow?.status ?? "") ? item.escrow?.amount ?? 0 : 0), 0);
  const completed = data.bookings.filter((item) => item.booking.status === "completed").length + data.profile.completedEvents;
  const primaryEvidence = primary ? data.evidence.filter((item) => item.bookingId === primary.booking.id) : [];
  const requiredProofPresent = primaryEvidence.some((item) => item.type === "photo" || item.type === "video");
  return (
    <DashboardShell role="service_provider" name={session.fullName}>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><div className="flex items-center gap-2"><p className="eyebrow text-berry">Service provider overview</p><BadgeCheck size={15} className="text-forest" /></div><h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">Good work, clearly rewarded.</h1><p className="mt-3 text-sm text-ink/50">Manage requests, prove delivery, and follow protected payouts.</p></div>
        <div className="rounded-full border border-ink/12 bg-white px-4 py-2 text-xs"><Star className="mr-1 inline fill-marigold text-marigold" size={13} /><strong>{formatRating(data.profile.rating)}</strong></div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-ink p-5 text-white"><div className="flex justify-between"><p className="eyebrow text-white/38">Protected revenue</p><ShieldCheck size={18} className="text-marigold" /></div><p className="mono mt-6 text-2xl font-semibold">{formatXaf(held)}</p><p className="mt-2 text-[10px] text-white/38">Held across active work</p></div>
        <div className="rounded-2xl border border-ink/10 bg-marigold p-5"><div className="flex justify-between"><p className="eyebrow text-ink/40">New requests</p><CalendarDays size={18} /></div><p className="display mt-5 text-4xl font-semibold">{pending}</p><p className="mt-1 text-[10px] text-ink/43">Awaiting your decision</p></div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5"><div className="flex justify-between"><p className="eyebrow text-ink/38">Events delivered</p><Check size={18} className="text-forest" /></div><p className="display mt-5 text-4xl font-semibold">{completed}</p><p className="mt-1 text-[10px] text-ink/38">Lifetime on Trufeta</p></div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <div className="space-y-6">
          <section id="bookings" className="rounded-[22px] border border-ink/10 bg-white p-5 sm:p-7">
            <div className="flex items-end justify-between"><div><p className="eyebrow text-berry">Booking queue</p><h2 className="display mt-2 text-3xl font-semibold">What needs your attention.</h2></div><span className="mono text-[10px] text-ink/35">{data.bookings.length} TOTAL</span></div>
            <div className="mt-6 divide-y divide-ink/10">{data.bookings.length ? data.bookings.map((item) => <div key={item.booking.id} className="py-5 first:pt-0 last:pb-0"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex gap-4"><span className={`mt-1 size-2 shrink-0 rounded-full ${item.booking.status === "pending_vendor_acceptance" ? "bg-marigold" : item.booking.status === "confirmed" ? "bg-green-500" : "bg-ink/20"}`} /><div><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{item.booking.eventType} · {item.organiser.fullName}</p><span className="rounded-full bg-paper px-2 py-1 text-[8px] font-bold uppercase">{statusLabels[item.booking.status]}</span></div><p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-ink/45"><span><CalendarDays className="mr-1 inline" size={11} />{item.booking.eventDate.toLocaleDateString("en-CM", { day: "numeric", month: "short", year: "numeric" })}</span><span><MapPin className="mr-1 inline" size={11} />{item.booking.venue}</span><span>{item.booking.guestCount} guests</span></p></div></div><div className="flex items-center gap-3"><div className="text-right"><p className="mono text-xs font-bold">{formatXaf(item.booking.fundedAmount)}</p><p className="mt-1 text-[8px] uppercase text-forest">{item.escrow?.status.replaceAll("_", " ")}</p></div>{item.booking.status === "pending_vendor_acceptance" && <div className="flex gap-1"><form action={serviceProviderBookingDecision}><input type="hidden" name="bookingId" value={item.booking.id} /><input type="hidden" name="decision" value="confirmed" /><button className="grid size-9 place-items-center rounded-full bg-forest text-white" title="Accept"><Check size={14} /></button></form><form action={serviceProviderBookingDecision}><input type="hidden" name="bookingId" value={item.booking.id} /><input type="hidden" name="decision" value="rejected" /><button className="grid size-9 place-items-center rounded-full border border-ink/15" title="Decline"><X size={14} /></button></form></div>}</div></div></div>) : <p className="py-10 text-center text-sm text-ink/45">No booking requests yet.</p>}</div>
          </section>

          {primary && agreement && primary.booking.termsAcceptedAt && (
            <section className="rounded-[22px] border border-forest/20 bg-mint/30 p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-forest">Confirmed agreement</p><h2 className="display mt-2 text-3xl font-semibold">The scope is now fixed.</h2><p className="mt-2 text-xs leading-5 text-ink/55">Deliver against these saved terms; later edits to your public service listing do not apply.</p></div><div className="text-right"><ShieldCheck className="ml-auto text-forest" size={22} /><p className="mt-2 text-[9px] font-bold uppercase text-forest">{primary.contract?.status === "executed" ? "Contract executed" : "Agreement recorded"}</p></div></div><div className="mt-5 rounded-xl bg-white/75 p-4"><p className="text-sm font-bold">{agreement.service?.name}</p><p className="mt-1 text-xs leading-5 text-ink/55">{agreement.service?.description}</p><p className="mono mt-3 text-xs">{formatXaf(agreement.payment?.serviceTotal ?? primary.booking.totalAmount)} · {agreement.service?.durationHours ?? "—"} hours · {formatXaf(agreement.payment?.protectedNow ?? primary.booking.fundedAmount)} protected</p></div></section>
          )}

          {primary?.booking.status === "confirmed" && (
            <section className="rounded-[22px] border border-ink/10 bg-white p-5 sm:p-7">
              <div className="flex items-start justify-between gap-5"><div><p className="eyebrow text-berry">Completion evidence</p><h2 className="display mt-2 text-3xl font-semibold">Prove the work, protect the trust.</h2><p className="mt-3 max-w-xl text-xs leading-6 text-ink/50">A timestamped photo or video is required before marking delivery complete. GPS check-in and QR confirmation are supplementary.</p></div><UploadCloud className="shrink-0 text-forest" size={24} /></div>
              <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_.75fr]">
                <form action={submitBookingEvidence} className="rounded-2xl bg-paper p-5"><input type="hidden" name="bookingId" value={primary.booking.id} />
                  <div className="grid gap-4 sm:grid-cols-2"><label><span className="label-text">Evidence type</span><select name="type" className="select-field"><option value="photo">Timestamped photo</option><option value="video">Timestamped video</option><option value="gps">GPS check-in</option><option value="qr">QR confirmation</option></select></label><label><span className="label-text">Secure file URL</span><input className="field" name="url" type="url" placeholder="https://…" /></label><label className="sm:col-span-2"><span className="label-text">Evidence note</span><textarea className="textarea-field !min-h-20" name="note" placeholder="What does this evidence show?" required /></label></div>
                  <button className="btn-ink mt-4"><UploadCloud size={15} />Log timestamped evidence</button>
                </form>
                <div className="rounded-2xl border border-ink/10 p-5"><p className="text-xs font-bold">Evidence logged ({primaryEvidence.length})</p>
                  <div className="mt-4 grid gap-2">{primaryEvidence.length ? primaryEvidence.map((proof) => <div key={proof.id} className="flex items-center gap-3 rounded-xl bg-mint/50 p-3"><span className="grid size-8 place-items-center rounded-full bg-white">{proof.type === "gps" ? <Navigation size={13} /> : proof.type === "qr" ? <QrCode size={13} /> : <Camera size={13} />}</span><div><p className="text-[10px] font-bold capitalize">{proof.type} proof</p><p className="mono mt-0.5 text-[8px] text-ink/38">{proof.capturedAt.toLocaleString("en-CM")}</p></div></div>) : <p className="rounded-xl border border-dashed border-ink/15 p-5 text-center text-[10px] text-ink/40">No evidence submitted yet.</p>}</div>
                  <form action={markBookingComplete} className="mt-4"><input type="hidden" name="bookingId" value={primary.booking.id} /><button disabled={!requiredProofPresent} className="btn-primary w-full"><Check size={15} />Mark service completed</button></form>
                  {!requiredProofPresent && <p className="mt-2 text-center text-[9px] text-berry">Photo or video evidence is required.</p>}
                </div>
              </div>
            </section>
          )}

        </div>
        <aside className="space-y-6">
          <section id="services" className="rounded-[22px] border border-ink/10 bg-white p-5"><p className="eyebrow text-ink/38">Active services</p><div className="mt-4 divide-y divide-ink/10">{data.services.length ? data.services.map((service) => <div key={service.id} className="py-4"><p className="text-xs font-bold">{service.name}</p><div className="mt-2 flex justify-between text-[10px] text-ink/42"><span>{service.durationHours} hours</span><span className="mono text-ink">{formatXaf(service.price)}</span></div></div>) : <p className="py-3 text-[11px] text-ink/45">Add your first service to appear in the marketplace.</p>}</div><ServiceServiceForm /></section>
          <section id="payouts" className="rounded-[22px] bg-forest p-6 text-white"><WalletCards size={21} className="text-marigold" /><h3 className="display mt-6 text-2xl font-semibold">Payout clarity.</h3><p className="mt-2 text-xs leading-5 text-white/48">Escrow funds release after organiser approval or five clear days without a dispute.</p><div className="mt-5 border-t border-white/12 pt-4"><p className="text-[9px] uppercase text-white/38">Current protected</p><p className="mono mt-1 text-lg">{formatXaf(held)}</p></div></section>
          <section className="rounded-[22px] border border-ink/10 bg-white p-5"><p className="eyebrow text-ink/38">Response standard</p><div className="mt-4 flex items-center gap-3"><Clock3 size={18} className="text-berry" /><div><p className="text-xs font-bold">{data.profile.responseTime}</p><p className="mt-1 text-[9px] text-ink/40">Visible on your profile</p></div></div></section>
        </aside>
      </div>
    </DashboardShell>
  );
}
