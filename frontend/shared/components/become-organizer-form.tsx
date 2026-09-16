"use client";

import { LoaderCircle, Sparkles, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function BecomeOrganizerForm({ fullName = "", email = "" }: { fullName?: string; email?: string }) {
  const router = useRouter();
  const [state, setState] = useState<{ ok: boolean; message: string }>({ ok: false, message: "" });
  const [pending, setPending] = useState(false);
  const [hasDocument, setHasDocument] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setState({ ok: false, message: "" });
    try {
      const response = await fetch("/api/client/organizer-requests", { method: "POST", body: new FormData(event.currentTarget) });
      const result = await response.json() as { ok?: boolean; message?: string };
      setState({ ok: Boolean(result.ok), message: result.message ?? "We could not submit your request." });
      if (result.ok) router.refresh();
    } catch {
      setState({ ok: false, message: "We could not submit your request. Please check your connection and try again." });
    } finally {
      setPending(false);
    }
  }
  return (
    <details className="mt-6 border-t border-ink/10 pt-5">
      <summary className="cursor-pointer text-sm font-bold text-berry">Become an Organizer</summary>
      <form onSubmit={submit} className="mt-4 grid gap-4 rounded-[22px] border border-ink/10 bg-white p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-marigold"><Sparkles size={18} /></span>
          <div>
            <p className="eyebrow text-berry">Organizer upgrade</p>
            <h3 className="display mt-1 text-2xl font-semibold">Request organizer privileges.</h3>
            <p className="mt-1 text-xs text-ink/52">Once approved, you can create events and assign service providers while keeping your client access.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="label-text">Full name</span><input className="field bg-ink/3!" name="fullName" value={fullName} readOnly aria-readonly="true" /></label>
          <label><span className="label-text">Email address</span><input className="field bg-ink/3!" name="email" type="email" value={email} readOnly aria-readonly="true" /></label>
        </div>
        <label><span className="label-text">Business or organization name</span><input className="field" name="businessName" placeholder="e.g. Bright Moments Events" required /></label>
        <label><span className="label-text">Tell us about your plans <span className="font-normal text-ink/45">(optional)</span></span><textarea className="textarea-field" name="message" placeholder="What kind of events do you organise?" /></label>
        <label><span className="label-text">Supporting document <span className="font-normal text-ink/45">(optional)</span></span><input className="field file:mr-3 file:rounded-lg file:border-0 file:bg-mint file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-forest" name="identityDocument" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => setHasDocument(e.target.files?.length === 1)} /><span className="mt-2 block text-[11px] leading-5 text-ink/48">Upload a government ID or business document (PDF, JPG, or PNG; up to 10 MB).</span></label>
        {state.message ? <p role="status" className={`rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-mint text-forest" : "bg-berry/10 text-berry"}`}>{state.message}</p> : null}
        <button className="btn-ink justify-self-start" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" size={16} /> Submitting</> : <><Upload size={16} /> Submit application</>}</button>
      </form>
    </details>
  );
}
