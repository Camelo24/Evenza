"use client";

import { createEvent } from "@backend/events/actions";
import type { ActionState } from "@backend/auth/actions";
import { ArrowRight, CalendarPlus, LoaderCircle } from "lucide-react";
import { useActionState, useState } from "react";

const initialActionState: ActionState = { ok: false, message: "" };

export function EventForm() {
  const [state, action, pending] = useActionState(createEvent, initialActionState);
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  return (
    <form action={action} className="rounded-[22px] border border-ink/12 bg-white p-5 sm:p-7">
      <div className="flex items-start justify-between">
        <div><p className="eyebrow text-berry">Create an event</p><h2 className="display mt-2 text-3xl font-semibold">Set the stage.</h2></div>
        <span className="grid size-10 place-items-center rounded-full bg-marigold text-ink"><CalendarPlus size={18}/></span>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label><span className="label-text">Title</span><input className="field" name="title" placeholder="e.g. Chantal & Boris — Wedding" required/></label>
        <label><span className="label-text">Event type</span><select className="select-field" name="eventType" defaultValue="Wedding"><option>Wedding</option><option>Birthday</option><option>Corporate event</option><option>Cultural / public</option><option>Private dinner</option></select></label>
        <label><span className="label-text">Venue</span><input className="field" name="venue" placeholder="e.g. Canopy Gardens" required/></label>
        <label><span className="label-text">City</span><input className="field" name="city" placeholder="e.g. Douala" required/></label>
        <label><span className="label-text">Start</span><input className="field" type="datetime-local" name="startsAt" min={tomorrow} required/></label>
        <label><span className="label-text">Guests</span><input className="field" type="number" name="guestCount" min="1" defaultValue="80" required/></label>
        <label><span className="label-text">Visibility</span><select className="select-field" name="visibility" value={visibility} onChange={(event) => setVisibility(event.target.value as "private" | "public")}><option value="private">Private (invite-only)</option><option value="public">Public (ticketed)</option></select></label>
        {visibility === "public" && <label><span className="label-text">Ticket price (FCFA)</span><input className="field" type="number" name="ticketPrice" min="0" defaultValue="10000"/></label>}
        <label className="sm:col-span-2"><span className="label-text">Description <span className="font-normal text-ink/40">(optional)</span></span><textarea className="textarea-field" name="description" placeholder="What makes this celebration special?"/></label>
      </div>
      {state.message && <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-mint text-forest" : "bg-berry/10 text-berry"}`}>{state.message}</p>}
      <button className="btn-ink mt-6" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" size={16}/> Creating</> : <>Create event <ArrowRight size={16}/></>}</button>
    </form>
  );
}
