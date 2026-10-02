import { requireRole } from "@backend/auth/session";
import { getOrganiserApplicants } from "@backend/hiring/queries";
import { DashboardShell } from "@/shared/components/dashboard-shell";
import { ApplicantRow } from "@/shared/components/applicant-row";
import { getCategories } from "@backend/vendors/queries";
import { db } from "@db/client";
import { events, hiringPosts } from "@db/schema";
import { and, asc, eq } from "drizzle-orm";
import { AlertCircle, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

type StatusFilter = "all" | "pending" | "shortlisted" | "accepted" | "rejected";

const statusTabs: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Applied" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

export default async function ApplicantsPage({ searchParams }: { searchParams: Promise<{ event?: string; category?: string; status?: string }> }) {
  const session = await requireRole("organiser");
  const params = await searchParams;
  const statusFilter: StatusFilter = (["pending", "shortlisted", "accepted", "rejected"].includes(params.status ?? "") ? params.status : "all") as StatusFilter;
  const eventId = params.event || undefined;
  const categoryId = params.category ? Number(params.category) : undefined;

  // Wrapped in try/catch so the page still renders (with an inline error card)
  // if the hiring view is missing columns from a not-yet-applied migration or
  // the database drops the connection. Loading state is handled by Next.js
  // via the (organiser)/loading.tsx boundary higher up the tree.
  let loadError: string | null = null;
  let applicants: Awaited<ReturnType<typeof getOrganiserApplicants>> = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let eventRows: Array<{ id: string; title: string }> = [];
  try {
    [applicants, categories, eventRows] = await Promise.all([
      getOrganiserApplicants(session.userId, {
        eventId,
        categoryId: Number.isFinite(categoryId) ? categoryId : undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
      getCategories(),
      db
        .select({ id: events.id, title: events.title })
        .from(events)
        .innerJoin(hiringPosts, and(eq(hiringPosts.eventId, events.id), eq(hiringPosts.organiserId, session.userId)))
        .where(eq(events.organiserId, session.userId))
        .orderBy(asc(events.startsAt)),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unable to load applicants right now.";
  }

  const buildQuery = (override: Record<string, string | undefined>) => {
    const merged = {
      event: override.event !== undefined ? override.event : eventId,
      category: override.category !== undefined ? override.category : categoryId ? String(categoryId) : undefined,
      status: override.status !== undefined ? override.status : statusFilter === "all" ? undefined : statusFilter,
    };
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) usp.set(k, v);
    const qs = usp.toString();
    return qs ? `/applicants?${qs}` : "/applicants";
  };

  return (
    <DashboardShell role="organiser" name={session.fullName} active="Applicants" allowViewSwitch={true}>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-berry">Recruitment</p>
          <h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">Applicants across your events.</h1>
          <p className="mt-3 text-sm text-ink/55">Review service providers, schedule meetings, and turn an acceptance into a protected booking.</p>
        </div>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-ink/10 bg-white p-3">
        <div className="flex flex-wrap gap-1">
          {statusTabs.map((tab) => (
            <a
              key={tab.value}
              href={buildQuery({ status: tab.value === "all" ? undefined : tab.value })}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${statusFilter === tab.value ? "bg-berry text-white" : "text-ink/70 hover:bg-ink/6 hover:text-ink"}`}
            >{tab.label}</a>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select name="event" className="select-field !min-h-9 !w-auto text-xs" defaultValue={eventId ?? ""}>
            <option value="">All events</option>
            {eventRows.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
          <select name="category" className="select-field !min-h-9 !w-auto text-xs" defaultValue={categoryId ? String(categoryId) : ""}>
            <option value="">All types</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter}/>}
          <button className="btn-secondary !min-h-9 !px-3 text-xs">Apply filters</button>
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {loadError ? (
          <div className="paper-card flex items-start gap-3 border-berry/20 bg-berry/5 py-10 text-left">
            <AlertCircle className="mt-0.5 shrink-0 text-berry" size={22}/>
            <div>
              <h2 className="display text-2xl font-semibold text-berry">We couldn’t load applicants.</h2>
              <p className="mt-2 text-sm text-ink/60">{loadError}</p>
              <p className="mt-2 text-xs text-ink/50">If you’ve just deployed a new version, a database migration may still be running. Refresh in a moment.</p>
            </div>
          </div>
        ) : applicants.length ? (
          applicants.map((applicant) => <ApplicantRow key={applicant.application.id} applicant={applicant}/>)
        ) : (
          <div className="paper-card py-20 text-center">
            <Inbox className="mx-auto text-ink/25" size={30}/>
            <h2 className="display mt-4 text-3xl font-semibold">No applicants yet.</h2>
            <p className="mt-2 text-sm text-ink/55">Providers will appear here as soon as they apply to one of your hiring posts.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
