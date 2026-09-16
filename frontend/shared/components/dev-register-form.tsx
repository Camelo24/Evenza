"use client";

import { devRegister } from "@backend/auth/actions";
import type { ActionState } from "@backend/auth/actions";
import { ArrowRight, KeyRound, LoaderCircle } from "lucide-react";
import { useActionState } from "react";

const initialActionState: ActionState = { ok: false, message: "" };

export function DevRegisterForm() {
  const [state, action, pending] = useActionState(devRegister, initialActionState);
  return (
    <form action={action} className="rounded-[22px] border border-marigold/40 bg-white p-6 shadow-xl">
      <div className="flex items-start justify-between">
        <div><p className="eyebrow text-berry">Development only</p><h2 className="display mt-2 text-3xl font-semibold">Create a test account.</h2><p className="mt-2 text-xs text-ink/50">This route is disabled outside <code className="mono text-berry">NODE_ENV=development</code>.</p></div>
        <span className="grid size-10 place-items-center rounded-full bg-marigold text-ink"><KeyRound size={18}/></span>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label><span className="label-text">Full name</span><input className="field" name="fullName" required/></label>
        <label><span className="label-text">Email</span><input className="field" name="email" type="email" required/></label>
        <label><span className="label-text">Password</span><input className="field" name="password" type="password" minLength={6} required/></label>
        <label><span className="label-text">Role</span><select className="select-field" name="role" defaultValue="client"><option value="admin">Admin</option><option value="client">Client</option><option value="service_provider">Service provider</option></select></label>
      </div>
      {state.message && <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-mint text-forest" : "bg-berry/10 text-berry"}`}>{state.message}</p>}
      <button className="btn-ink mt-6" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" size={16}/> Creating</> : <>Create account <ArrowRight size={16}/></>}</button>
    </form>
  );
}
