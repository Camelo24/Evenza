"use client";

import { createVendorProfile } from "@backend/vendors/actions";
import type { ActionState } from "@backend/auth/actions";
import { LoaderCircle, Store } from "lucide-react";
import { useActionState } from "react";

const initialState: ActionState = { ok: false, message: "" };

export function ServiceProviderProfileForm() {
  const [state, action, pending] = useActionState(createVendorProfile, initialState);
  return (
    <form action={action} className="paper-card mx-auto max-w-3xl p-6 sm:p-8">
      <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-marigold"><Store size={19} /></span><div><p className="eyebrow text-berry">Service provider onboarding</p><h1 className="display mt-2 text-3xl font-semibold">Set up your profile.</h1><p className="mt-2 text-sm leading-6 text-ink/52">Your approved account is ready. Add the details clients need before you can receive bookings.</p></div></div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <label><span className="label-text">Business name</span><input className="field" name="businessName" required /></label>
        <label><span className="label-text">Starting price (FCFA)</span><input className="field" name="startingPrice" type="number" min="0" required /></label>
        <label className="sm:col-span-2"><span className="label-text">Tagline</span><input className="field" name="tagline" placeholder="What makes your service distinctive?" required /></label>
        <label><span className="label-text">City</span><input className="field" name="city" placeholder="e.g. Douala" required /></label>
        <label><span className="label-text">Address</span><input className="field" name="address" placeholder="Neighbourhood or studio address" required /></label>
        <label className="sm:col-span-2"><span className="label-text">About your business</span><textarea className="textarea-field" name="description" placeholder="Describe your experience, services, and approach…" required /></label>
        <label><span className="label-text">Profile image URL</span><input className="field" name="imageUrl" type="url" placeholder="https://…" required /></label>
        <label><span className="label-text">Cover image URL</span><input className="field" name="coverUrl" type="url" placeholder="https://…" required /></label>
      </div>
      {state.message ? <p role="status" className={`mt-4 rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-mint text-forest" : "bg-berry/10 text-berry"}`}>{state.message}</p> : null}
      <button className="btn-ink mt-6" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" size={16} />Saving</> : <><Store size={16} />Create profile</>}</button>
    </form>
  );
}
