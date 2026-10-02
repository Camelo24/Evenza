"use client";

import { applyToEvent } from "@backend/events/actions";
import type { ActionState } from "@backend/auth/actions";
import { BriefcaseBusiness, LoaderCircle } from "lucide-react";
import { useActionState } from "react";

const initialState: ActionState = { ok: false, message: "" };

export function EventApplicationButton({ eventId, status }: { eventId: string; status?: string }) {
  const [state, action, pending] = useActionState(applyToEvent, initialState);
  if (status === "pending") return <p className="rounded-xl bg-marigold/20 px-4 py-3 text-center text-xs font-semibold text-ink">Application pending</p>;
  if (status === "approved") return <p className="rounded-xl bg-mint px-4 py-3 text-center text-xs font-semibold text-forest">You’re assigned to this event</p>;
  if (status === "rejected") return <p className="rounded-xl bg-berry/10 px-4 py-3 text-center text-xs font-semibold text-berry">Application declined</p>;
  return <form action={action}>
    <input type="hidden" name="eventId" value={eventId} />
    {state.message && <p role="status" className={`mb-2 rounded-lg px-3 py-2 text-[11px] ${state.ok ? "bg-mint text-forest" : "bg-berry/10 text-berry"}`}>{state.message}</p>}
    <button className="btn-primary w-full !min-h-10 text-xs" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" size={14}/>Sending application</> : <><BriefcaseBusiness size={14}/>Apply to work this event</>}</button>
  </form>;
}
