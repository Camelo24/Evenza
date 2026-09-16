import { DashboardShell } from "@/shared/components/dashboard-shell";
import { getOrganiserDashboard } from "@backend/bookings/queries";
import { requireRole } from "@backend/auth/session";
import { formatXaf } from "@/shared/lib/format";
import { CreditCard, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrganiserPaymentsPage() {
  const session = await requireRole("organiser"); const data = await getOrganiserDashboard(session.userId);
  return <DashboardShell role="organiser" name={session.fullName} active="Payments" allowViewSwitch={true}><p className="eyebrow text-berry">Escrow payments</p><h1 className="display mt-2 text-4xl font-semibold">Your protected funds.</h1><div className="mt-8 space-y-4">{data.bookings.length ? data.bookings.map(({ booking, vendor, escrow }) => <article key={booking.id} className="rounded-[22px] border border-ink/10 bg-white p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-bold">{vendor.businessName}</p><p className="mono mt-1 text-[10px] text-ink/42">{booking.reference}</p></div><p className="mono text-lg font-bold">{formatXaf(escrow?.amount ?? booking.fundedAmount)}</p></div><div className="mt-5 flex items-center gap-2 rounded-xl bg-mint/50 p-3 text-xs text-forest"><ShieldCheck size={15}/>{escrow?.status.replaceAll("_", " ") ?? "Payment authorised"}</div></article>) : <div className="paper-card py-16 text-center"><CreditCard className="mx-auto text-ink/25"/><p className="mt-4 text-sm text-ink/50">Your protected payment history will appear here.</p></div>}</div></DashboardShell>;
}
