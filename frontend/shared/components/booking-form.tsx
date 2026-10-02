"use client";

import { createBooking } from "@backend/bookings/actions";
import type { ActionState } from "@backend/auth/actions";
import { formatRating, formatXaf } from "@/shared/lib/format";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, LoaderCircle, LockKeyhole, ShieldCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

const initialActionState: ActionState = { ok: false, message: "" };

type Service = { id: string; name: string; description: string; price: number; durationHours: number };
type ServiceProvider = { id: string; slug: string; businessName: string; imageUrl: string; rating: string; services?: Service[] } | undefined;

export function BookingForm({ serviceProvider, initialService }: { serviceProvider: ServiceProvider; initialService?: string }) {
  const [state, action, pending] = useActionState(createBooking, initialActionState);
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState(() => {
    if (!serviceProvider?.services || serviceProvider.services.length === 0) {
      return "";
    }
    if (initialService && serviceProvider.services.some((item) => item.id === initialService)) {
      return initialService;
    }
    return serviceProvider.services[0]?.id ?? "";
  });
  const [mode, setMode] = useState<"full" | "deposit">("full");
  const [deposit, setDeposit] = useState(50);
  const service = serviceProvider?.services?.find((item) => item.id === serviceId);
  const due = useMemo(() => Math.round((service?.price ?? 0) * (mode === "full" ? 1 : deposit / 100)), [service, mode, deposit]);
  const earliestBookingDate = new Date(Date.now() + (5 + 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  if (!serviceProvider) {
    return <div className="rounded-xl border border-ink/10 bg-white p-8 text-center">
      <p className="text-sm text-ink/50">Service provider information not available.</p>
      <Link href="/vendors" className="btn-secondary mt-4 inline-flex">Browse service providers</Link>
    </div>;
  }

  if (!serviceProvider.services || serviceProvider.services.length === 0) {
    return <div className="rounded-xl border border-ink/10 bg-white p-8 text-center">
      <p className="text-sm text-ink/50">This service provider has no available services to book.</p>
      <Link href="/vendors" className="btn-secondary mt-4 inline-flex">Browse other service providers</Link>
    </div>;
  }

  if (state.ok) return <div className="rounded-[24px] border border-forest/15 bg-white p-8 text-center shadow-xl sm:p-12"><span className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-forest"><CheckCircle2 size={30}/></span><p className="eyebrow mt-7 text-berry">Payment protected</p><h1 className="display mt-3 text-4xl font-semibold">Your request is on its way.</h1><p className="mx-auto mt-4 max-w-md text-sm leading-7 text-ink/58">{state.message} You’ll see every update in your organiser dashboard.</p><div className="mono mx-auto mt-6 w-fit rounded-lg bg-paper px-4 py-3 text-xs">{state.reference}</div><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/dashboard" className="btn-ink">View booking <ArrowRight size={15}/></Link><Link href="/vendors" className="btn-secondary">Keep exploring</Link></div></div>;

  return (
    <form action={action} className="grid gap-7 lg:grid-cols-[1fr_360px]">
      <input type="hidden" name="vendorId" value={serviceProvider.id}/><input type="hidden" name="serviceId" value={serviceId}/><input type="hidden" name="escrowMode" value={mode}/><input type="hidden" name="depositPercent" value={mode === "full" ? 100 : deposit}/>
      <div className="rounded-[22px] border border-ink/12 bg-white p-5 sm:p-8">
        <div className="flex items-center gap-3 border-b border-ink/10 pb-6"><span className={`grid size-8 place-items-center rounded-full text-xs font-bold ${step === 1 ? "bg-ink text-white" : "bg-mint text-forest"}`}>{step === 1 ? "1" : "✓"}</span><span className="text-xs font-bold">Event details</span><span className="h-px flex-1 bg-ink/12"/><span className={`grid size-8 place-items-center rounded-full text-xs font-bold ${step === 2 ? "bg-ink text-white" : "bg-paper text-ink/40"}`}>2</span><span className={`text-xs font-bold ${step === 2 ? "text-ink" : "text-ink/35"}`}>Protected payment</span></div>
        <div data-booking-step="1" className={step === 1 ? "block" : "hidden"}>
          <div className="mt-7"><p className="eyebrow text-berry">Step one</p><h2 className="display mt-2 text-3xl font-semibold">Tell us about the occasion.</h2></div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="label-text">Service</span><select className="select-field" value={serviceId} onChange={(event) => setServiceId(event.target.value)}>{serviceProvider?.services?.map((item) => <option key={item.id} value={item.id}>{item.name} — {formatXaf(item.price)}</option>)}</select></label>
            <label><span className="label-text">Event type</span><select className="select-field" name="eventType" defaultValue="Wedding"><option>Wedding</option><option>Birthday</option><option>Corporate event</option><option>Festival</option><option>Private dinner</option><option>Other</option></select></label>
            <label><span className="label-text">Event date</span><input className="field" type="date" name="eventDate" min={earliestBookingDate} required={step === 1} /></label>
            <p className="sm:col-span-2 -mt-2 text-[10px] text-ink/45">Bookings close five days before the event date.</p>
            <label><span className="label-text">Venue or neighbourhood</span><input className="field" name="venue" placeholder="e.g. Bonanjo, Douala" required={step === 1} /></label>
            <label><span className="label-text">Expected guests</span><input className="field" type="number" name="guestCount" min="1" max="10000" defaultValue="100" required={step === 1} /></label>
            <label className="sm:col-span-2"><span className="label-text">Notes for the service provider <span className="font-normal text-ink/40">(optional)</span></span><textarea className="textarea-field" name="notes" placeholder="Share timing, style, access, or delivery details that matter." /></label>
          </div>
          <button type="button" onClick={(event) => {
            const panel = event.currentTarget.closest("form")?.querySelector("[data-booking-step='1']");
            const invalidControl = panel?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(":invalid");
            if (invalidControl) {
              invalidControl.reportValidity();
              return;
            }
            setStep(2);
          }} className="btn-ink mt-7 w-full sm:w-auto">Continue to payment <ArrowRight size={16}/></button>
        </div>
        <div className={step === 2 ? "block" : "hidden"}>
          <div className="mt-7"><p className="eyebrow text-berry">Step two</p><h2 className="display mt-2 text-3xl font-semibold">Choose how to protect the booking.</h2><p className="mt-3 text-sm leading-6 text-ink/52">Funds are authorised now and held in Evenza escrow while {serviceProvider.businessName} reviews your request.</p></div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setMode("full")} className={`rounded-2xl border p-5 text-left transition ${mode === "full" ? "border-forest bg-mint/55" : "border-ink/12"}`}><span className="flex items-center justify-between text-sm font-bold">Full escrow {mode === "full" && <CheckCircle2 size={17} className="text-forest"/>}</span><span className="mt-2 block text-xs leading-5 text-ink/50">Protect the complete service amount.</span></button><button type="button" onClick={() => setMode("deposit")} className={`rounded-2xl border p-5 text-left transition ${mode === "deposit" ? "border-forest bg-mint/55" : "border-ink/12"}`}><span className="flex items-center justify-between text-sm font-bold">Agreed deposit {mode === "deposit" && <CheckCircle2 size={17} className="text-forest"/>}</span><span className="mt-2 block text-xs leading-5 text-ink/50">Secure the date with a partial amount.</span></button></div>
          {mode === "deposit" && <label className="mt-5 block"><span className="label-text">Deposit percentage: <strong>{deposit}%</strong></span><input type="range" min="20" max="80" step="10" value={deposit} onChange={(event) => setDeposit(Number(event.target.value))} className="w-full accent-[#234f40]"/><span className="mt-1 flex justify-between text-[10px] text-ink/38"><span>20%</span><span>80%</span></span></label>}
          <div className="mt-7 rounded-2xl border border-ink/12 bg-paper p-5"><div className="flex items-center gap-2"><Smartphone size={17} className="text-berry"/><p className="text-sm font-bold">Mobile Money</p></div><label className="mt-4 block"><span className="label-text">MTN MoMo or Orange Money number</span><div className="relative"><span className="mono absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink/45">+237</span><input className="field !pl-14" name="phoneNumber" inputMode="tel" placeholder="6XX XXX XXX" required={step === 2} /></div></label><p className="mt-3 flex items-center gap-1.5 text-[10px] text-ink/43"><LockKeyhole size={11}/>Processed securely through Campay. We never store your PIN.</p></div>
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/12 p-4 text-xs leading-5 text-ink/58"><input className="mt-0.5 size-4 accent-[#234f40]" type="checkbox" name="termsAccepted" required={step === 2} /><span>I accept the booking agreement: the selected service, scope, price, escrow amount, and cancellation/refund policy will be frozen when this booking is confirmed. Future changes to the service provider&apos;s listing will not change this booking.</span></label>
          {state.message && <p className="mt-4 rounded-xl bg-berry/10 px-4 py-3 text-sm text-berry">{state.message}</p>}
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row"><button type="button" onClick={() => setStep(1)} className="btn-secondary"><ArrowLeft size={15}/> Back</button><button type="submit" disabled={pending} className="btn-primary flex-1">{pending ? <><LoaderCircle className="animate-spin" size={16}/> Authorising</> : <>Authorise {formatXaf(due)} <ShieldCheck size={16}/></>}</button></div>
        </div>
      </div>
      <aside className="self-start rounded-[22px] bg-ink p-6 text-white lg:sticky lg:top-6"><div className="flex gap-4"><img src={serviceProvider.imageUrl} alt="" className="size-16 rounded-xl object-cover"/><div><p className="display text-xl font-semibold">{serviceProvider.businessName}</p><p className="mt-1 text-xs text-white/45">★ {formatRating(serviceProvider.rating)} · Trusted service provider</p></div></div><div className="my-6 h-px bg-white/12"/><p className="text-sm font-bold">{service?.name}</p><p className="mt-2 text-xs leading-5 text-white/45">{service?.description}</p><div className="mt-6 grid gap-3 border-t border-white/12 pt-5 text-xs"><div className="flex justify-between text-white/52"><span>Service total</span><span className="mono text-white">{formatXaf(service?.price ?? 0)}</span></div><div className="flex justify-between text-white/52"><span>Protected now</span><span className="mono text-marigold">{formatXaf(due)}</span></div></div><div className="mt-6 rounded-xl bg-white/7 p-4"><p className="flex items-center gap-2 text-xs font-bold"><CalendarDays size={15} className="text-marigold"/> Booking cutoff</p><p className="mt-2 text-[10px] leading-5 text-white/42">Bookings close five days before the event date. After that, the event is marked as closed.</p></div></aside>
    </form>
  );
}
