"use client";

import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";

export function AccessForm() {
  const [state, setState] = useState({ ok: false, message: "" });
  const [pending, setPending] = useState(false);
  const [desiredRole, setDesiredRole] = useState("service_provider");
  const documentRequired = desiredRole === "service_provider";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setState({ ok: false, message: "" });
    try {
      const response = await fetch("/api/access-requests", { method: "POST", body: new FormData(event.currentTarget) });
      const result = await response.json() as { ok?: boolean; message?: string };
      setState({ ok: Boolean(result.ok), message: result.message ?? "We could not submit your request." });
    } catch {
      setState({ ok: false, message: "We could not submit your request. Please check your connection and try again." });
    } finally {
      setPending(false);
    }
  }
  if (state.ok) return <section className="paper-card grid min-h-[430px] place-items-center bg-white/90 p-7 text-center shadow-[0_30px_80px_rgba(23,35,31,.13)]">
    <div><span className="mx-auto grid size-14 place-items-center rounded-full bg-mint text-forest"><CheckCircle2 size={28} /></span><p className="eyebrow mt-6 text-berry">Request received</p><h2 className="display mt-3 text-4xl font-semibold">You’re in the review queue.</h2><p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-ink/55">Our trust team will review your details and email your credentials if approved. We’ll keep your documents private.</p></div>
  </section>;
  return (
    <form onSubmit={submit} className="paper-card grid gap-4 bg-white/90 p-5 shadow-[0_30px_80px_rgba(23,35,31,.13)] sm:p-7">
      <div className="mb-1 flex items-start justify-between gap-4">
        <div><p className="eyebrow text-berry">Credential request</p><h3 className="display mt-2 text-3xl font-semibold">Join the trusted circle.</h3></div>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mint text-forest"><CheckCircle2 size={19} /></span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className="label-text">Full name</span><input className="field" name="fullName" placeholder="Your full name" required /></label>
        <label><span className="label-text">Email address</span><input className="field" name="email" type="email" placeholder="you@example.com" required /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className="label-text">Phone number</span><input className="field" name="phone" type="tel" placeholder="+237 6xx xxx xxx" /></label>
        {desiredRole === "service_provider" ? <label><span className="label-text">Business name</span><input className="field" name="businessName" placeholder="Your business or studio" required /></label> : <div className="hidden sm:block" />}
      </div>
      <label><span className="label-text">I want to join as</span><select className="select-field" name="desiredRole" value={desiredRole} onChange={(event) => setDesiredRole(event.target.value)}><option value="service_provider">Service provider — I provide event services</option></select></label>
      {documentRequired && <label><span className="label-text">Identity or business document</span><input className="field file:mr-3 file:rounded-lg file:border-0 file:bg-mint file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-forest" name="identityDocument" type="file" accept="application/pdf,image/jpeg,image/png" required /><span className="mt-2 block text-[11px] leading-5 text-ink/48">Upload a government-issued ID or business registration document (PDF, JPG, or PNG; up to 10 MB). This is reviewed privately by our trust team.</span></label>}
      <label><span className="label-text">Tell us a little more <span className="font-normal text-ink/45">(optional)</span></span><textarea className="textarea-field" name="message" placeholder="What are you hoping to create with Trufeta?" /></label>
      {state.message ? <p role="status" className={`rounded-xl px-4 py-3 text-sm leading-6 ${state.ok ? "bg-mint text-forest" : "bg-berry/10 text-berry"}`}>{state.message}</p> : null}
      <button className="btn-ink w-full" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" size={17} /> Sending request</> : <>Request access <ArrowRight size={17} /></>}</button>
      <p className="text-center text-[11px] leading-5 text-ink/45">No open registration. Every account is reviewed by our trust team before credentials are issued.</p>
    </form>
  );
}
