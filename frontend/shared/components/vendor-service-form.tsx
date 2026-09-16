"use client";

import { createVendorService } from "@backend/vendors/actions";
import type { ActionState } from "@backend/auth/actions";
import { LoaderCircle, Plus } from "lucide-react";
import { useActionState } from "react";

const initialState: ActionState = { ok: false, message: "" };

export function ServiceServiceForm() {
  const [state, action, pending] = useActionState(createVendorService, initialState);
  return (
    <details className="mt-4 border-t border-ink/10 pt-4">
      <summary className="cursor-pointer text-[11px] font-bold text-berry">Add a service</summary>
      <form action={action} className="mt-3 grid gap-3">
        <label><span className="label-text">Service name</span><input className="field !min-h-10" name="name" required /></label>
        <div className="grid grid-cols-2 gap-2"><label><span className="label-text">Price (FCFA)</span><input className="field !min-h-10" name="price" type="number" min="0" required /></label><label><span className="label-text">Hours</span><input className="field !min-h-10" name="durationHours" type="number" min="1" defaultValue="4" required /></label></div>
        <label><span className="label-text">Description</span><textarea className="textarea-field !min-h-20" name="description" required /></label>
        {state.message ? <p role="status" className={`rounded-lg px-3 py-2 text-[10px] ${state.ok ? "bg-mint text-forest" : "bg-berry/10 text-berry"}`}>{state.message}</p> : null}
        <button className="btn-secondary !min-h-10 justify-self-start text-xs" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" size={14} /> : <Plus size={14} />}Add service</button>
      </form>
    </details>
  );
}
