"use client";

import { applyToHiringDomain } from "@backend/hiring/actions";
import type { ActionState } from "@backend/auth/actions";
import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";

const initialState: ActionState = { ok: false, message: "" };
export function HiringApplicationButton({ hiringPostId, hiringDomainId, applicationStatus }: { hiringPostId: string; hiringDomainId: string; applicationStatus?: string }) {
  const [state, action, pending] = useActionState(applyToHiringDomain, initialState);
  if (applicationStatus) return <p className="rounded-xl bg-ink/5 px-3 py-2 text-center text-xs capitalize text-ink/60">Application {applicationStatus}</p>;
  return <form action={action}><input type="hidden" name="hiringPostId" value={hiringPostId}/><input type="hidden" name="hiringDomainId" value={hiringDomainId}/>{state.message && <p className={`mb-2 text-[11px] ${state.ok ? "text-forest" : "text-berry"}`}>{state.message}</p>}<button className="btn-primary w-full !min-h-10 text-xs" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" size={14}/>Applying</> : "Apply for this domain"}</button></form>;
}
