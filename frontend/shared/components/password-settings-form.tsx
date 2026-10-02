"use client";

import { changePassword, type ActionState } from "@backend/auth/actions";
import { CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { useActionState } from "react";
import { ModeToggle } from "@/shared/components/mode-toggle";

const initialState: ActionState = { ok: false, message: "" };

export function PasswordSettingsForm() {
  const [state, action, pending] = useActionState(changePassword, initialState);

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-[26px] border border-ink/10 bg-white p-5 sm:p-7 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-marigold text-ink"><KeyRound size={18} /></span>
          <div>
            <p className="eyebrow text-ink/40">Credentials</p>
            <h2 className="display mt-1 text-2xl font-semibold">Password settings</h2>
          </div>
        </div>

        <form action={action} className="mt-6 grid gap-4">
          <label>
            <span className="label-text">Current password</span>
            <input className="field" type="password" name="currentPassword" required />
          </label>
          <label>
            <span className="label-text">New password</span>
            <input className="field" type="password" name="newPassword" minLength={8} required />
          </label>
          {state.message && (
            <p role="status" className={`rounded-2xl px-3 py-2 text-xs ${state.ok ? "bg-mint text-forest" : "bg-berry/10 text-berry"}`}>
              {state.ok && <CheckCircle2 className="mr-1 inline" size={13} />}
              {state.message}
            </p>
          )}
          <div className="flex items-center gap-2 rounded-2xl bg-mint/40 px-3 py-2 text-xs text-forest">
            <ShieldCheck size={15} />
            Passwords are kept safe and verified before updates.
          </div>
          <button className="btn-ink w-fit" disabled={pending}>{pending ? "Updating…" : "Update password"}</button>
        </form>
      </section>

      <ModeToggle />
    </div>
  );
}
