"use client";

import { purchaseTicket } from "@backend/tickets/actions";
import type { ActionState } from "@backend/auth/actions";
import { LoaderCircle, Ticket } from "lucide-react";
import { useActionState } from "react";

const initialState: ActionState = { ok: false, message: "" };

export function TicketPurchaseForm({ eventId, price }: { eventId: string; price: number }) {
  const [state, action, pending] = useActionState(purchaseTicket, initialState);
  return (
    <form action={action} className="mt-5 border-t border-ink/10 pt-4">
      <input type="hidden" name="eventId" value={eventId} />
      <div className="grid gap-2 sm:grid-cols-2">
        <label><span className="label-text">Tickets</span><input className="field !min-h-10" name="quantity" type="number" min="1" max="20" defaultValue="1" required /></label>
        <label><span className="label-text">Mobile money number</span><input className="field !min-h-10" name="phoneNumber" inputMode="tel" placeholder="6XXXXXXXX" required /></label>
      </div>
      {state.message ? <p role="status" className={`mt-3 rounded-lg px-3 py-2 text-[11px] leading-5 ${state.ok ? "bg-mint text-forest" : "bg-berry/10 text-berry"}`}>{state.message}</p> : null}
      <button className="btn-ink mt-3 w-full !min-h-10 text-xs" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" size={14} />Authorising</> : <><Ticket size={14} />{price === 0 ? "Get free ticket" : "Buy ticket"}</>}</button>
    </form>
  );
}
