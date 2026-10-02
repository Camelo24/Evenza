"use client";

import { updateVendorCategories } from "@backend/vendors/actions";
import type { ActionState } from "@backend/auth/actions";
import { LoaderCircle, Save } from "lucide-react";
import { useActionState } from "react";

const initialState: ActionState = { ok: false, message: "" };

export function VendorCategoryForm({ categories, selectedIds }: { categories: { id: number; name: string }[]; selectedIds: number[] }) {
  const [state, action, pending] = useActionState(updateVendorCategories, initialState);
  return <form action={action} className="mt-5 border-t border-ink/10 pt-5">
    <h2 className="text-sm font-bold">Your service domains</h2>
    <p className="mt-1 text-xs text-ink/50">You can apply to events seeking a service category you select here.</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">{categories.map((category) => <label key={category.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink/10 px-3 py-2 text-xs"><input className="size-4 accent-forest" type="checkbox" name="categoryIds" value={category.id} defaultChecked={selectedIds.includes(category.id)}/>{category.name}</label>)}</div>
    {state.message && <p role="status" className={`mt-3 rounded-lg px-3 py-2 text-xs ${state.ok ? "bg-mint text-forest" : "bg-berry/10 text-berry"}`}>{state.message}</p>}
    <button className="btn-secondary mt-4 !min-h-9 !px-3 text-xs" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" size={14}/>Saving</> : <><Save size={14}/>Save domains</>}</button>
  </form>;
}
