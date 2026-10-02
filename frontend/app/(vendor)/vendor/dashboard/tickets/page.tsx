import Link from "next/link";
import QRCode from "qrcode";
import { ArrowRight, CalendarDays, MapPin, QrCode, Ticket } from "lucide-react";
import { DashboardShell } from "@/shared/components/dashboard-shell";
import { formatXaf } from "@/shared/lib/format";
import { getClientData } from "@backend/client/queries";
import { requireRole } from "@backend/auth/session";

export const dynamic = "force-dynamic";

export default async function ServiceProviderTicketsPage() {
  const session = await requireRole("service_provider");
  const data = await getClientData(session.userId);
  const tickets = await Promise.all(data.tickets.map(async (row) => ({ ...row, qr: await QRCode.toDataURL(row.ticket.code, { width: 240, margin: 1, color: { dark: "#17231f", light: "#ffffff" } }) })));

  return <DashboardShell role="service_provider" name={session.fullName} active="My tickets">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow text-berry">Attendee wallet</p><h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">Your event tickets.</h1><p className="mt-3 text-sm text-ink/50">Your entry QR codes and event details, ready when you need them.</p></div><Link href="/vendor/dashboard/events" className="btn-primary"><Ticket size={15} />Find an event</Link></header>

    {tickets.length ? <div className="mt-8 grid gap-5 xl:grid-cols-2">{tickets.map(({ ticket, event, qr }) => <article key={ticket.id} className="overflow-hidden rounded-[22px] border border-ink/10 bg-white shadow-sm"><div className="relative flex min-h-40 items-end overflow-hidden bg-ink p-5 text-white sm:p-6">{event.coverUrl ? <img src={event.coverUrl} alt="" className="absolute inset-0 size-full object-cover opacity-35" /> : null}<div className="absolute inset-0 bg-gradient-to-r from-ink/90 to-ink/35" /><div className="relative"><span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider"><Ticket size={11} className="text-marigold" />Admit {ticket.quantity}</span><p className="eyebrow mt-4 text-marigold">{event.eventType}</p><h2 className="display mt-1 text-3xl font-semibold">{event.title}</h2></div></div>
      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_144px] sm:items-center sm:p-6"><div><div className="grid gap-3 text-xs text-ink/60"><span className="flex items-center gap-2"><CalendarDays size={14} className="text-berry" />{event.startsAt.toLocaleString("en-CM", { dateStyle: "full", timeStyle: "short" })}</span><span className="flex items-center gap-2"><MapPin size={14} className="text-berry" />{event.venue}, {event.city}</span></div><div className="mt-5 grid grid-cols-2 gap-3 border-t border-ink/8 pt-4"><div><p className="eyebrow text-ink/35">Paid</p><p className="mono mt-1 text-xs font-semibold">{formatXaf(ticket.amount)}</p></div><div><p className="eyebrow text-ink/35">Ticket code</p><p className="mono mt-1 text-[10px] font-semibold">{ticket.code}</p></div></div></div><div className="rounded-xl border border-ink/8 bg-white p-2"><img src={qr} alt={`Entry QR code for ${event.title}`} className="w-full" /><p className="flex items-center justify-center gap-1 pb-1 text-[9px] font-bold text-ink/60"><QrCode size={11} />SCAN AT ENTRY</p></div></div>
    </article>)}</div> : <section className="mt-8 rounded-[24px] border border-ink/10 bg-white px-6 py-16 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f1f4ef] text-forest"><QrCode size={23} /></span><h2 className="display mt-5 text-3xl font-semibold">Your wallet is waiting.</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/50">When you buy a ticket, it will appear here with an entry QR code and event details.</p><Link href="/vendor/dashboard/events" className="btn-ink mt-6">Browse upcoming events <ArrowRight size={15} /></Link></section>}
  </DashboardShell>;
}
