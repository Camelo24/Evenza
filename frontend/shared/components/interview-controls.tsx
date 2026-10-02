"use client";

import { scheduleInterview, updateInterviewStatus } from "@backend/hiring/actions";
import type { ActionState } from "@backend/auth/actions";
import { LoaderCircle, MapPin, Video } from "lucide-react";
import { useActionState, useState } from "react";
const initialState: ActionState = { ok: false, message: "" };

type InterviewRow = { id: string; status: string; scheduledAt: Date | string; meetingUrl?: string | null; location?: string | null; note?: string | null };

export function InterviewControls({ applicationId, interview }: { applicationId: string; interview?: InterviewRow }) {
  const [state, action, pending] = useActionState(scheduleInterview, initialState);
  const [mode, setMode] = useState<"url" | "location">("url");
  if (interview) {
    const scheduledAt = new Date(interview.scheduledAt).toLocaleString("en-CM", { dateStyle: "medium", timeStyle: "short" });
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {interview.meetingUrl ? (
          <a className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-3 py-2 font-semibold text-white" href={interview.meetingUrl} target="_blank" rel="noreferrer"><Video size={13}/>Join meeting</a>
        ) : interview.location ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-3 py-2 font-semibold text-white"><MapPin size={13}/>{interview.location}</span>
        ) : null}
        <span className="text-ink/55 capitalize">{interview.status} · {scheduledAt}</span>
        {interview.note ? <span className="text-ink/45">— {interview.note}</span> : null}
        {interview.status === "scheduled" && (
          <>
            {(["completed", "cancelled"] as const).map((status) => (
              <form key={status} action={updateInterviewStatus}>
                <input type="hidden" name="interviewId" value={interview.id}/>
                <input type="hidden" name="status" value={status}/>
                <button className="rounded-lg border border-ink/12 px-2 py-1.5 capitalize text-ink/65">{status}</button>
              </form>
            ))}
          </>
        )}
      </div>
    );
  }
  return (
    <form action={action} className="mt-3 rounded-xl border border-ink/10 bg-white/70 p-3">
      <input type="hidden" name="applicationId" value={applicationId}/>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <label><span className="label-text">When</span><input className="field !min-h-9 text-xs" type="datetime-local" name="scheduledAt" required/></label>
        <div className="flex gap-1 rounded-lg bg-ink/6 p-1 text-[11px] font-semibold">
          <button type="button" onClick={() => setMode("url")} className={`rounded px-2 py-1 ${mode === "url" ? "bg-white text-ink" : "text-ink/50"}`}>Video link</button>
          <button type="button" onClick={() => setMode("location")} className={`rounded px-2 py-1 ${mode === "location" ? "bg-white text-ink" : "text-ink/50"}`}>In person</button>
        </div>
      </div>
      {mode === "url" ? (
        <input className="field mt-2 !min-h-9 text-xs" type="url" name="meetingUrl" placeholder="https://meet…" />
      ) : (
        <input className="field mt-2 !min-h-9 text-xs" name="location" placeholder="Venue or address" />
      )}
      <input className="field mt-2 !min-h-9 text-xs" name="note" placeholder="Short note (optional)" />
      <div className="mt-2 flex items-center justify-between gap-3">
        {state.message ? <p className={`text-xs ${state.ok ? "text-forest" : "text-berry"}`}>{state.message}</p> : <span/>}
        <button className="btn-secondary !min-h-9 !px-3 text-xs" disabled={pending}>{pending ? <LoaderCircle size={13} className="animate-spin"/> : <Video size={13}/>}Schedule meeting</button>
      </div>
    </form>
  );
}
