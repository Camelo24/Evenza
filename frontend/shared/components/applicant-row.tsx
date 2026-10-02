"use client";

import { reviewHiringApplication, shortlistHiringApplication } from "@backend/hiring/actions";
import { Check, MapPin, Star, Users2, X } from "lucide-react";
import { InterviewControls } from "@/shared/components/interview-controls";
import { formatXaf } from "@/shared/lib/format";
import Link from "next/link";

type Applicant = {
  application: { id: string; status: "pending" | "shortlisted" | "accepted" | "rejected"; createdAt: Date | string };
  vendor: { id: string; userId: string; businessName: string; slug: string; tagline: string; city: string; imageUrl: string; coverUrl: string; rating: string | number; reviewCount: number; completedEvents: number; verified: boolean };
  event: { id: string; title: string };
  category: { id: number; name: string };
  domain: { id: string; placesNeeded: number; placesFilled: number; requirementNote?: string | null; unitPrice?: number | null; currency?: string | null; budget?: number | null };
  interview?: { id: string; status: string; scheduledAt: Date | string; meetingUrl?: string | null; location?: string | null; note?: string | null } | null;
  portfolio?: Array<{ id: string; name: string; description: string; price: number }>;
};

const statusStyles: Record<Applicant["application"]["status"], string> = {
  pending: "bg-marigold text-ink",
  shortlisted: "bg-forest text-white",
  accepted: "bg-mint text-forest",
  rejected: "bg-ink/10 text-ink/50",
};

export function ApplicantRow({ applicant }: { applicant: Applicant }) {
  const { application, vendor, event, category, domain, interview } = applicant;
  const rating = Number(vendor.rating ?? 0).toFixed(1);
  const canDecide = application.status === "pending" || application.status === "shortlisted";
  return (
    <article className="overflow-hidden rounded-[22px] border border-ink/10 bg-white">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
        <img src={vendor.imageUrl} alt="" className="size-16 shrink-0 rounded-2xl object-cover sm:size-20" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ${statusStyles[application.status]}`}>{application.status}</span>
            <span className="eyebrow text-berry">{category.name}</span>
            <span className="text-[11px] text-ink/40">· {event.title}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h3 className="display text-2xl font-semibold">{vendor.businessName}</h3>
            {vendor.verified && <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[9px] font-bold uppercase text-forest">Verified</span>}
          </div>
          <p className="mt-1 text-xs text-ink/55">{vendor.tagline}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink/55">
            <span className="inline-flex items-center gap-1"><Star size={12} className="fill-marigold text-marigold"/>{rating} · {vendor.reviewCount} reviews</span>
            <span className="inline-flex items-center gap-1"><Check size={12} className="text-forest"/>{vendor.completedEvents} completed bookings</span>
            <span className="inline-flex items-center gap-1"><MapPin size={12} className="text-berry"/>{vendor.city}</span>
            <Link href={`/vendors/${vendor.slug}`} className="font-semibold text-berry hover:underline">View profile →</Link>
          </div>
          {(domain.requirementNote || domain.unitPrice != null || domain.budget != null) && (
            <div className="mt-3 rounded-xl bg-paper/70 p-3 text-xs text-ink/65">
              {domain.requirementNote && <p><span className="font-semibold text-ink">Requirement:</span> {domain.requirementNote}</p>}
              {domain.unitPrice != null ? (
                <p className="mt-1">
                  <span className="font-semibold text-ink">Rate:</span> {formatXaf(domain.unitPrice)} / person × {domain.placesNeeded} = <span className="font-semibold">{formatXaf(domain.unitPrice * domain.placesNeeded)}</span> · {domain.placesFilled}/{domain.placesNeeded} filled
                </p>
              ) : domain.budget != null ? (
                <p className="mt-1"><span className="font-semibold text-ink">Budget:</span> {formatXaf(domain.budget)} · {domain.placesFilled}/{domain.placesNeeded} places filled</p>
              ) : null}
            </div>
          )}
          {applicant.portfolio && applicant.portfolio.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {applicant.portfolio.map((s) => (
                <span key={s.id} className="rounded-full border border-ink/10 bg-white px-2.5 py-1 text-[11px] text-ink/60">{s.name} · {formatXaf(s.price)}</span>
              ))}
            </div>
          )}

          {canDecide && (
            <div className="mt-4 flex flex-wrap gap-2">
              <form action={reviewHiringApplication}>
                <input type="hidden" name="applicationId" value={application.id}/>
                <input type="hidden" name="decision" value="accepted"/>
                <button className="btn-primary !min-h-9 !px-3 text-xs"><Users2 size={13}/>Accept &amp; create booking</button>
              </form>
              {application.status === "pending" && (
                <form action={shortlistHiringApplication}>
                  <input type="hidden" name="applicationId" value={application.id}/>
                  <button className="btn-secondary !min-h-9 !px-3 text-xs">Shortlist</button>
                </form>
              )}
              <form action={reviewHiringApplication}>
                <input type="hidden" name="applicationId" value={application.id}/>
                <input type="hidden" name="decision" value="rejected"/>
                <button className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-berry/30 px-3 text-xs font-semibold text-berry hover:bg-berry/10"><X size={13}/>Reject</button>
              </form>
            </div>
          )}

          {canDecide && (
            <div className="mt-3">
              <p className="eyebrow text-ink/40">Meeting</p>
              <InterviewControls applicationId={application.id} interview={interview ?? undefined}/>
            </div>
          )}
          {!canDecide && interview && (
            <div className="mt-3"><InterviewControls applicationId={application.id} interview={interview}/></div>
          )}
        </div>
      </div>
    </article>
  );
}
