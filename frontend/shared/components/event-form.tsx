"use client";

import { createEvent, getCategoriesAction, updateEvent } from "@backend/events/actions";
import type { ActionState } from "@backend/auth/actions";
import { ArrowRight, CalendarPlus, LoaderCircle, PencilLine, Plus, Trash2, Users2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

const initialActionState: ActionState = { ok: false, message: "" };

type Currency = "XAF" | "USD" | "EUR" | "GBP";
const CURRENCIES: Currency[] = ["XAF", "USD", "EUR", "GBP"];

type ProfessionalRow = {
  categoryId: number;
  placesNeeded: string;
  unitPrice: string;
  currency: Currency;
  requirementNote: string;
};
type CategoryOption = { id: number; name: string };

function emptyRow(categories: CategoryOption[]): ProfessionalRow {
  return { categoryId: categories[0]?.id ?? 0, placesNeeded: "1", unitPrice: "0", currency: "XAF", requirementNote: "" };
}

function rowErrors(row: ProfessionalRow, all: ProfessionalRow[], index: number, categories: CategoryOption[]) {
  const errors: Partial<Record<keyof ProfessionalRow, string>> = {};
  if (!row.categoryId) errors.categoryId = "Choose a professional type.";
  else if (categories.length > 0 && !categories.some((c) => c.id === row.categoryId)) errors.categoryId = "That type is no longer available.";
  else if (all.some((r, i) => i !== index && r.categoryId === row.categoryId)) errors.categoryId = "Already added.";
  const people = Number(row.placesNeeded);
  if (!Number.isFinite(people) || !Number.isInteger(people) || people < 1) errors.placesNeeded = "At least 1 person.";
  else if (people > 1000) errors.placesNeeded = "Too many (max 1000).";
  const price = Number(row.unitPrice);
  if (!Number.isFinite(price) || price < 0) errors.unitPrice = "Enter a valid price (0 or more).";
  if (row.requirementNote && row.requirementNote.length > 600) errors.requirementNote = "Note is too long (max 600 chars).";
  return errors;
}

function computeSubtotal(row: ProfessionalRow) {
  const people = Number(row.placesNeeded);
  const price = Number(row.unitPrice);
  if (!Number.isFinite(people) || !Number.isFinite(price)) return 0;
  return Math.max(0, Math.round(people * price));
}

function formatMoney(amount: number, currency: Currency) {
  const symbol = currency === "XAF" ? "FCFA" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
  return `${symbol} ${amount.toLocaleString("en-US")}`;
}

function HiringSection({
  categories,
  startsAt,
  rows,
  setRows,
  deadline,
  setDeadline,
  touched,
  setTouched,
  minDeadline,
}: {
  categories: CategoryOption[];
  startsAt: string;
  rows: ProfessionalRow[];
  setRows: (next: ProfessionalRow[]) => void;
  deadline: string;
  setDeadline: (value: string) => void;
  touched: boolean;
  setTouched: (value: boolean) => void;
  minDeadline?: string;
}) {
  const usedIds = useMemo(() => new Set(rows.map((r) => r.categoryId)), [rows]);
  const updateRow = (index: number, patch: Partial<ProfessionalRow>) =>
    setRows(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const total = rows.reduce((sum, r) => sum + computeSubtotal(r), 0);
  const perRowErrors = rows.map((r, i) => rowErrors(r, rows, i, categories));
  const anyInvalid = perRowErrors.some((e) => Object.keys(e).length > 0);
  const showErrors = touched && anyInvalid;

  return (
    <div className="mt-5 rounded-2xl border border-forest/20 bg-forest/[.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="eyebrow text-forest">Hire professionals for this event</p>
          <p className="mt-1 text-xs text-ink/55">Photographer, caterer, decorator, sound &amp; lighting, MC, security, and more.</p>
        </div>
        <Users2 className="text-forest" size={18} />
      </div>

      <label className="mt-3 block">
        <span className="label-text">Recruitment deadline <span className="font-normal text-ink/40">(before the event starts)</span></span>
        <input
          className="field mt-1"
          type="datetime-local"
          name="hiringDeadline"
          value={deadline}
          min={minDeadline || undefined}
          max={startsAt || undefined}
          onChange={(e) => setDeadline(e.target.value)}
          suppressHydrationWarning
          required
        />
      </label>

      <input
        type="hidden"
        name="hiringDomains"
        value={JSON.stringify(rows.map((r) => ({
          categoryId: Number(r.categoryId),
          placesNeeded: Number(r.placesNeeded) || 0,
          unitPrice: Math.max(0, Math.round(Number(r.unitPrice) || 0)),
          currency: r.currency,
          requirementNote: r.requirementNote.trim() || null,
        })))}
      />

      <div className="mt-4 space-y-3">
        {rows.map((row, index) => {
          const errs = perRowErrors[index];
          const subtotal = computeSubtotal(row);
          return (
            <div key={index} className="rounded-xl border border-ink/10 bg-white p-3.5 sm:p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_90px_1.5fr_1.8fr_auto] lg:items-start">
                {/* 1. Professional type */}
                <div>
                  <label className="label-text !mb-1 block">Type</label>
                  <select
                    className="select-field !min-h-10 text-sm w-full"
                    value={row.categoryId}
                    onChange={(e) => updateRow(index, { categoryId: Number(e.target.value) })}
                    disabled={!categories.length}
                  >
                    {categories.length === 0 ? (
                      <option value="">No categories available</option>
                    ) : (
                      categories.map((c) => {
                        const isSelected = usedIds.has(c.id) && row.categoryId !== c.id;
                        return (
                          <option key={c.id} value={c.id} disabled={isSelected}>
                            {c.name}{isSelected ? " (Already added)" : ""}
                          </option>
                        );
                      })
                    )}
                  </select>
                  {showErrors && errs.categoryId && (
                    <p className="mt-1 text-[11px] text-berry">{errs.categoryId}</p>
                  )}
                </div>

                {/* 2. People needed */}
                <div>
                  <label className="label-text !mb-1 block">People needed</label>
                  <input
                    className="field !min-h-10 text-sm w-full"
                    type="number"
                    min={1}
                    max={1000}
                    step={1}
                    inputMode="numeric"
                    value={row.placesNeeded}
                    onChange={(e) => updateRow(index, { placesNeeded: e.target.value })}
                  />
                  {showErrors && errs.placesNeeded && (
                    <p className="mt-1 text-[11px] text-berry">{errs.placesNeeded}</p>
                  )}
                </div>

                {/* 3. Unit price + currency */}
                <div>
                  <label className="label-text !mb-1 block">Unit price + currency</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      className="field !min-h-10 text-sm flex-1 min-w-0"
                      type="number"
                      min={0}
                      step={1000}
                      inputMode="numeric"
                      placeholder="0"
                      value={row.unitPrice}
                      onChange={(e) => updateRow(index, { unitPrice: e.target.value })}
                    />
                    <select
                      className="select-field !min-h-10 !w-20 shrink-0 text-sm"
                      value={row.currency}
                      onChange={(e) => updateRow(index, { currency: e.target.value as Currency })}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  {showErrors && errs.unitPrice && (
                    <p className="mt-1 text-[11px] text-berry">{errs.unitPrice}</p>
                  )}
                </div>

                {/* 4. Requirement note */}
                <div>
                  <label className="label-text !mb-1 block">Note <span className="font-normal text-ink/40">(optional)</span></label>
                  <input
                    className="field !min-h-10 text-sm w-full"
                    type="text"
                    placeholder="e.g. 2 camera crew, full day"
                    maxLength={600}
                    value={row.requirementNote}
                    onChange={(e) => updateRow(index, { requirementNote: e.target.value })}
                  />
                  {showErrors && errs.requirementNote && (
                    <p className="mt-1 text-[11px] text-berry">{errs.requirementNote}</p>
                  )}
                </div>

                {/* 5. Remove button */}
                <div className="flex items-center justify-end sm:col-span-2 lg:col-span-1 lg:mt-6">
                  {rows.length > 1 ? (
                    <button
                      type="button"
                      aria-label="Remove professional"
                      className="grid size-10 place-items-center rounded-xl border border-ink/10 text-berry hover:bg-berry/10 shrink-0 transition"
                      onClick={() => setRows(rows.filter((_, i) => i !== index))}
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : (
                    <div className="hidden lg:block size-10" />
                  )}
                </div>
              </div>

              {/* Row subtotal */}
              <div className="mt-2.5 flex items-center justify-between border-t border-ink/5 pt-2 text-xs">
                <span className="text-[11px] text-ink/45">
                  {Number(row.placesNeeded) > 0 && Number(row.unitPrice) > 0
                    ? `${row.placesNeeded} people × ${formatMoney(Number(row.unitPrice), row.currency)}`
                    : "Row subtotal"}
                </span>
                <span className="font-semibold text-forest">
                  Subtotal: {formatMoney(subtotal, row.currency)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-forest/15 pt-3">
        <button
          type="button"
          className="btn-secondary !min-h-9 !px-3 text-xs"
          disabled={categories.length > 0 && rows.length >= categories.length}
          onClick={() => {
            const next = categories.find((c) => !usedIds.has(c.id));
            if (next) setRows([...rows, { ...emptyRow([next]) }]);
            else if (categories.length > 0) setRows([...rows, { ...emptyRow(categories) }]);
          }}
        >
          <Plus size={13} /> Add professional
        </button>
        <div className="rounded-xl bg-ink px-4 py-2 text-right text-white">
          <p className="text-[10px] uppercase tracking-wider text-white/60">Total estimated hiring budget</p>
          <p className="mono mt-0.5 text-base font-bold">{formatMoney(total, rows[0]?.currency ?? "XAF")}</p>
        </div>
      </div>
      {showErrors && anyInvalid && (
        <p className="mt-3 rounded-xl bg-berry/10 px-3 py-2 text-xs text-berry">Please fix the highlighted fields before submitting.</p>
      )}
    </div>
  );
}

export function EventForm({ categories = [] }: { categories?: CategoryOption[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createEvent, initialActionState);
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [ticketTypes, setTicketTypes] = useState([{ name: "General admission", price: 10000 }]);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [hireEnabled, setHireEnabled] = useState(false);
  const [categoriesList, setCategoriesList] = useState<CategoryOption[]>(categories);
  const [rows, setRows] = useState<ProfessionalRow[]>([emptyRow(categories)]);
  const [deadline, setDeadline] = useState("");
  const [startsAtValue, setStartsAtValue] = useState("");
  const [touched, setTouched] = useState(false);

  // Client-mounted minimum dates to avoid SSR hydration mismatches
  const [minStartsAt, setMinStartsAt] = useState<string>("");
  const [minHiringDeadline, setMinHiringDeadline] = useState<string>("");

  useEffect(() => {
    setMinStartsAt(new Date(Date.now() + 86_400_000).toISOString().slice(0, 16));
    setMinHiringDeadline(new Date(Date.now() + 60_000).toISOString().slice(0, 16));
  }, []);

  // Ensure categories are loaded even if server prop arrived empty
  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesList(categories);
    } else {
      getCategoriesAction()
        .then((data) => {
          if (data && data.length > 0) {
            setCategoriesList(data.map((c) => ({ id: c.id, name: c.name })));
          }
        })
        .catch((err) => console.error("Failed to load categories dynamically:", err));
    }
  }, [categories]);

  // Sync rows once categoryList becomes available
  useEffect(() => {
    if (categoriesList.length > 0) {
      setRows((prev) =>
        prev.map((row) => {
          if (!row.categoryId || !categoriesList.some((c) => c.id === row.categoryId)) {
            const available = categoriesList.find((c) => !prev.some((p) => p !== row && p.categoryId === c.id));
            return { ...row, categoryId: available ? available.id : categoriesList[0].id };
          }
          return row;
        })
      );
    }
  }, [categoriesList]);

  // Invalidate query and redirect to My Events upon successful creation
  useEffect(() => {
    if (state.ok) {
      router.refresh();
      router.push("/events?tab=my-events");
    }
  }, [state.ok, router]);

  return (
    <form
      action={(formData) => {
        setTouched(true);
        // Client-side guard: block submit before hitting the server if any row is invalid.
        const invalid = rows.some((r, i) => Object.keys(rowErrors(r, rows, i, categoriesList)).length > 0);
        if (hireEnabled && invalid) return;
        return action(formData);
      }}
      className="rounded-[22px] border border-ink/12 bg-white p-5 sm:p-7"
    >
      <div className="flex items-start justify-between">
        <div><p className="eyebrow text-berry">Create an event</p><h2 className="display mt-2 text-3xl font-semibold">Set the stage.</h2></div>
        <span className="grid size-10 place-items-center rounded-full bg-marigold text-ink"><CalendarPlus size={18}/></span>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label><span className="label-text">Title</span><input className="field" name="title" placeholder="e.g. Chantal &amp; Boris — Wedding" required/></label>
        <label><span className="label-text">Event category</span><select className="select-field" name="eventType" defaultValue="Wedding"><option>Wedding</option><option>Birthday</option><option>Corporate event</option><option>Cultural / public</option><option>Private dinner</option></select></label>
        <label><span className="label-text">Location / venue</span><input className="field" name="venue" placeholder="e.g. Canopy Gardens" required/></label>
        <label><span className="label-text">City</span><input className="field" name="city" placeholder="e.g. Douala" required/></label>
        <label>
          <span className="label-text">Start</span>
          <input
            className="field"
            type="datetime-local"
            name="startsAt"
            min={minStartsAt || undefined}
            value={startsAtValue}
            onChange={(e) => setStartsAtValue(e.target.value)}
            suppressHydrationWarning
            required
          />
        </label>
        <label>
          <span className="label-text">End</span>
          <input
            className="field"
            type="datetime-local"
            name="endsAt"
            min={minStartsAt || undefined}
            suppressHydrationWarning
            required
          />
        </label>
        <label><span className="label-text">Guests</span><input className="field" type="number" name="guestCount" min="1" defaultValue="80" required/></label>
        <label><span className="label-text">Visibility</span><select className="select-field" name="visibility" value={visibility} onChange={(event) => setVisibility(event.target.value as "private" | "public")}><option value="private">Private (invite-only)</option><option value="public">Public (ticketed)</option></select></label>
        <label className="sm:col-span-2">
          <span className="label-text">Event cover image <span className="font-normal text-ink/40">(optional)</span></span>
          <input
            className="field mt-2 file:mr-4 file:rounded-full file:border-0 file:bg-forest file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
            type="file"
            name="coverImage"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setCoverPreview(nextFile ? URL.createObjectURL(nextFile) : null);
            }}
          />
          <span className="mt-2 block text-xs text-ink/45">JPG, PNG, or WEBP up to 10 MB.</span>
          {coverPreview && <img src={coverPreview} alt="Event cover preview" className="mt-3 h-32 w-full rounded-2xl object-cover" />}
        </label>
        <label className="sm:col-span-2"><span className="label-text">Description <span className="font-normal text-ink/40">(optional)</span></span><textarea className="textarea-field" name="description" placeholder="What makes this celebration special?"/></label>
      </div>
      {visibility === "public" && (
        <div className="mt-5 rounded-2xl border border-ink/10 bg-paper/60 p-4">
          <input type="hidden" name="ticketTypes" value={JSON.stringify(ticketTypes)}/>
          <div className="flex items-center justify-between">
            <div><p className="label-text">Ticket types</p><p className="text-xs text-ink/45">Add each ticket option and its price.</p></div>
            <button type="button" className="btn-secondary !min-h-9 !px-3 text-xs" onClick={() => setTicketTypes((types) => [...types, { name: "", price: 0 }])}><Plus size={13}/>Add type</button>
          </div>
          <div className="mt-3 space-y-2">{ticketTypes.map((t, i) => (
            <div key={i} className="grid grid-cols-[1fr_110px_auto] gap-2">
              <input className="field !min-h-10" placeholder="e.g. VIP" value={t.name} onChange={(e) => setTicketTypes((types) => types.map((x, p) => p === i ? { ...x, name: e.target.value } : x))}/>
              <input className="field !min-h-10" type="number" min="0" value={t.price} onChange={(e) => setTicketTypes((types) => types.map((x, p) => p === i ? { ...x, price: Number(e.target.value) } : x))}/>
              {ticketTypes.length > 1 && <button type="button" className="grid size-10 place-items-center rounded-xl border border-ink/10 text-berry" onClick={() => setTicketTypes((types) => types.filter((_, p) => p !== i))}><Trash2 size={14}/></button>}
            </div>
          ))}</div>
        </div>
      )}

      <label className="mt-6 flex items-center gap-3 rounded-2xl border border-ink/10 bg-paper/60 p-4">
        <input type="checkbox" name="hiringEnabled" checked={hireEnabled} onChange={(e) => setHireEnabled(e.target.checked)} className="size-4 accent-[#d94a6b]" />
        <div>
          <p className="text-sm font-semibold">Hire professionals for this event?</p>
          <p className="mt-0.5 text-xs text-ink/55">Optional — open a recruitment post so service providers can apply.</p>
        </div>
      </label>
      {hireEnabled && (
        <HiringSection
          categories={categoriesList}
          startsAt={startsAtValue}
          rows={rows}
          setRows={setRows}
          deadline={deadline}
          setDeadline={setDeadline}
          touched={touched}
          setTouched={setTouched}
          minDeadline={minHiringDeadline}
        />
      )}

      {state.message && <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-mint text-forest" : "bg-berry/10 text-berry"}`}>{state.message}</p>}
      <button className="btn-ink mt-6" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" size={16}/> Creating</> : <>Create event <ArrowRight size={16}/></>}</button>
    </form>
  );
}

export function EditEventForm({
  event,
  categories = [],
  hiring,
}: {
  event: { id: string; title: string; eventType: string; venue: string; city: string; startsAt: Date | string; endsAt: Date | string; guestCount: number; visibility: "private" | "public"; ticketPrice?: number | null; description?: string | null; coverUrl?: string | null };
  categories?: CategoryOption[];
  hiring?: { deadline: string; rows: ProfessionalRow[] } | null;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateEvent, initialActionState);
  const [visibility, setVisibility] = useState<"private" | "public">(event.visibility);
  const [coverPreview, setCoverPreview] = useState<string | null>(event.coverUrl ?? null);
  const [hireEnabled, setHireEnabled] = useState(Boolean(hiring));
  const [categoriesList, setCategoriesList] = useState<CategoryOption[]>(categories);
  const [rows, setRows] = useState<ProfessionalRow[]>(hiring?.rows ?? [emptyRow(categories)]);
  const [deadline, setDeadline] = useState(hiring?.deadline ?? "");
  const [startsAtValue, setStartsAtValue] = useState(() => toLocalInput(event.startsAt));
  const [touched, setTouched] = useState(false);
  const datetimeLocal = (value: Date | string) => toLocalInput(value);

  // Client-mounted minimum dates to avoid SSR hydration mismatches
  const [minStartsAt, setMinStartsAt] = useState<string>("");
  const [minHiringDeadline, setMinHiringDeadline] = useState<string>("");

  useEffect(() => {
    setMinStartsAt(new Date(Date.now() + 86_400_000).toISOString().slice(0, 16));
    setMinHiringDeadline(new Date(Date.now() + 60_000).toISOString().slice(0, 16));
  }, []);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesList(categories);
    } else {
      getCategoriesAction()
        .then((data) => {
          if (data && data.length > 0) {
            setCategoriesList(data.map((c) => ({ id: c.id, name: c.name })));
          }
        })
        .catch((err) => console.error("Failed to load categories dynamically:", err));
    }
  }, [categories]);

  useEffect(() => {
    if (categoriesList.length > 0 && rows.length > 0 && rows[0]?.categoryId === 0) {
      setRows((prev) =>
        prev.map((row) => {
          if (!row.categoryId || !categoriesList.some((c) => c.id === row.categoryId)) {
            const available = categoriesList.find((c) => !prev.some((p) => p !== row && p.categoryId === c.id));
            return { ...row, categoryId: available ? available.id : categoriesList[0].id };
          }
          return row;
        })
      );
    }
  }, [categoriesList, rows]);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form
      action={(formData) => {
        setTouched(true);
        const invalid = rows.some((r, i) => Object.keys(rowErrors(r, rows, i, categoriesList)).length > 0);
        if (hireEnabled && invalid) return;
        return action(formData);
      }}
      className="mt-5 rounded-[20px] border border-ink/10 bg-paper/70 p-4"
    >
      <input type="hidden" name="eventId" value={event.id} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-berry">Edit event</p>
          <h3 className="display mt-1 text-2xl font-semibold">{hiring ? "Edit event & hiring conditions" : "Update details"}</h3>
        </div>
        <span className="grid size-9 place-items-center rounded-full bg-marigold text-ink"><PencilLine size={16} /></span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="label-text">Title</span><input className="field" name="title" defaultValue={event.title} required /></label>
        <label><span className="label-text">Category</span><select className="select-field" name="eventType" defaultValue={event.eventType}><option>Wedding</option><option>Birthday</option><option>Corporate event</option><option>Cultural / public</option><option>Private dinner</option></select></label>
        <label><span className="label-text">Visibility</span><select className="select-field" name="visibility" value={visibility} onChange={(event) => setVisibility(event.target.value as "private" | "public")}><option value="private">Private</option><option value="public">Public</option></select></label>
        <label><span className="label-text">Venue</span><input className="field" name="venue" defaultValue={event.venue} required /></label>
        <label><span className="label-text">City</span><input className="field" name="city" defaultValue={event.city} required /></label>
        <label>
          <span className="label-text">Start</span>
          <input
            className="field"
            type="datetime-local"
            name="startsAt"
            defaultValue={datetimeLocal(event.startsAt)}
            value={startsAtValue}
            onChange={(e) => setStartsAtValue(e.target.value)}
            min={minStartsAt || undefined}
            suppressHydrationWarning
            required
          />
        </label>
        <label>
          <span className="label-text">End</span>
          <input
            className="field"
            type="datetime-local"
            name="endsAt"
            defaultValue={datetimeLocal(event.endsAt)}
            min={minStartsAt || undefined}
            suppressHydrationWarning
            required
          />
        </label>
        <label><span className="label-text">Guests</span><input className="field" type="number" name="guestCount" min="1" defaultValue={event.guestCount} required /></label>
        {visibility === "public" && (
          <label>
            <span className="label-text">Ticket price</span>
            <input className="field" type="number" min="0" step="1000" name="ticketPrice" defaultValue={event.ticketPrice ?? 10000} />
          </label>
        )}
        <label className="sm:col-span-2">
          <span className="label-text">Cover image</span>
          <input
            className="field mt-2 file:mr-4 file:rounded-full file:border-0 file:bg-forest file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
            type="file"
            name="coverImage"
            accept="image/png,image/jpeg,image/webp"
            onChange={(changeEvent) => {
              const nextFile = changeEvent.target.files?.[0] ?? null;
              setCoverPreview(nextFile ? URL.createObjectURL(nextFile) : event.coverUrl ?? null);
            }}
          />
          {coverPreview && <img src={coverPreview} alt="Event cover preview" className="mt-3 h-24 w-full rounded-2xl object-cover" />}
        </label>
        <label className="sm:col-span-2"><span className="label-text">Description</span><textarea className="textarea-field" name="description" defaultValue={event.description ?? ""} /></label>
      </div>

      <label className="mt-5 flex items-center gap-3 rounded-2xl border border-ink/10 bg-white/70 p-3">
        <input type="checkbox" name="hiringEnabled" checked={hireEnabled} onChange={(e) => setHireEnabled(e.target.checked)} className="size-4 accent-[#d94a6b]" />
        <div>
          <p className="text-sm font-semibold">{hiring ? "Edit hiring conditions" : "Hire professionals for this event?"}</p>
          <p className="mt-0.5 text-xs text-ink/55">{hiring ? "Update professional types, prices, and deadline." : "Optional — enable professional hiring."}</p>
        </div>
      </label>
      {hireEnabled && (
        <HiringSection
          categories={categoriesList}
          startsAt={startsAtValue}
          rows={rows}
          setRows={setRows}
          deadline={deadline}
          setDeadline={setDeadline}
          touched={touched}
          setTouched={setTouched}
          minDeadline={minHiringDeadline}
        />
      )}

      {state.message && <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-mint text-forest" : "bg-berry/10 text-berry"}`}>{state.message}</p>}
      <button className="btn-ink mt-5" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" size={16} /> Updating</> : <>Save changes <ArrowRight size={16} /></>}</button>
    </form>
  );
}

function toLocalInput(value: Date | string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
