import { DashboardShell } from "@/shared/components/dashboard-shell";
import { serviceProviderBookingDecision } from "@backend/bookings/actions";
import { getVendorDashboard } from "@backend/bookings/queries";
import { requireRole } from "@backend/auth/session";
import { formatXaf } from "@/shared/lib/format";
import { Check, CalendarDays, X } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ServiceProviderBookingsPage() {
  const session = await requireRole("service_provider"); const data = await getVendorDashboard(session.userId);
  return <DashboardShell role="service_provider" name={session.fullName} active="Bookings"><p className="eyebrow text-berry">Booking queue</p><h1 className="display mt-2 text-4xl font-semibold">Your bookings.</h1><div className="mt-8 space-y-4">{data?.bookings.length ? data.bookings.map(({ booking, organiser, escrow }) => <article key={booking.id} className="rounded-[22px] border border-ink/10 bg-white p-5 sm:p-7"><div className="flex flex-wrap justify-between gap-4"><div><p className="text-sm font-bold">{booking.eventType} · {organiser.fullName}</p><p className="mt-2 text-xs text-ink/50">{booking.eventDate.toLocaleDateString("en-CM")} · {booking.venue}</p></div><p className="mono text-sm font-bold">{formatXaf(escrow?.amount ?? booking.fundedAmount)}</p></div>{booking.status === "pending_vendor_acceptance" && <div className="mt-5 flex gap-2"><form action={serviceProviderBookingDecision}><input type="hidden" name="bookingId" value={booking.id}/><input type="hidden" name="decision" value="confirmed"/><button className="btn-primary"><Check size={15}/>Accept</button></form><form action={serviceProviderBookingDecision}><input type="hidden" name="bookingId" value={booking.id}/><input type="hidden" name="decision" value="rejected"/><button className="btn-secondary"><X size={15}/>Decline</button></form></div>}</article>) : <div className="paper-card py-16 text-center"><CalendarDays className="mx-auto text-ink/25"/><p className="mt-4 text-sm text-ink/50">No bookings yet.</p></div>}</div></DashboardShell>;
}
