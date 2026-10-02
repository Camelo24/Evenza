"use client";

import { createHiringPost } from "@backend/hiring/actions";
import type { ActionState } from "@backend/auth/actions";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

const initialState: ActionState = { ok: false, message: "" };
type Domain = { categoryId: number; placesNeeded: number };

export function HiringPostForm({ eventId, categories }: { eventId: string; categories: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState(createHiringPost, initialState);
  const [domains, setDomains] = useState<Domain[]>([{ categoryId: categories[0]?.id ?? 0, placesNeeded: 1 }]);
  const minDeadline = new Date(Date.now() + 60000).toISOString().slice(0, 16);
  const setDomain = (index: number, field: keyof Domain, value: number) => setDomains((current) => current.map((domain, position) => position === index ? { ...domain, [field]: value } : domain));
  return <form action={action} className="mt-5 rounded-2xl border border-forest/15 bg-forest/[.035] p-4">
    <input type="hidden" name="eventId" value={eventId}/><input type="hidden" name="domains" value={JSON.stringify(domains)}/>
    <p className="eyebrow text-forest">Recruit service providers</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
      <label><span className="label-text">Recruitment deadline</span><input className="field" type="datetime-local" name="deadline" min={minDeadline} required/></label>
      <div className="self-end"><button type="button" className="btn-secondary !min-h-10 !px-3 text-xs" disabled={domains.length >= categories.length} onClick={() => setDomains((current) => [...current, { categoryId: categories.find((category) => !current.some((domain) => domain.categoryId === category.id))?.id ?? 0, placesNeeded: 1 }])}><Plus size={14}/>Add domain</button></div>
    </div>
    <div className="mt-3 space-y-2">{domains.map((domain, index) => <div key={index} className="grid grid-cols-[1fr_92px_auto] gap-2"><select className="select-field" value={domain.categoryId} onChange={(event) => setDomain(index, "categoryId", Number(event.target.value))}>{categories.map((category) => <option key={category.id} value={category.id} disabled={domains.some((item, itemIndex) => itemIndex !== index && item.categoryId === category.id)}>{category.name}</option>)}</select><input className="field" aria-label="Places needed" type="number" min="1" value={domain.placesNeeded} onChange={(event) => setDomain(index, "placesNeeded", Number(event.target.value))}/>{domains.length > 1 && <button type="button" className="grid size-10 place-items-center rounded-xl border border-ink/10 text-berry" onClick={() => setDomains((current) => current.filter((_, position) => position !== index))}><Trash2 size={14}/></button>}</div>)}</div>
    {state.message && <p className={`mt-3 text-xs ${state.ok ? "text-forest" : "text-berry"}`}>{state.message}</p>}
    <button className="btn-primary mt-4 !min-h-10 text-xs" disabled={pending || !categories.length}>{pending ? <><LoaderCircle size={14} className="animate-spin"/>Creating</> : "Publish hiring post"}</button>
  </form>;
}
