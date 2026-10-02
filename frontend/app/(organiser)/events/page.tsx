import { deleteEvent, reviewEventProviderApplication } from "@backend/events/actions";
import { getOrganiserHiringPosts, getApplicantCountsByEvent } from "@backend/hiring/queries";
import { DashboardShell } from "@/shared/components/dashboard-shell";
import { EditEventForm, EventForm } from "@/shared/components/event-form";
import { requireRole } from "@backend/auth/session";
import { getOrganiserEventsData, getVendorReviews } from "@backend/bookings/queries";
import { getCategories, getVendors } from "@backend/vendors/queries";
import { VendorAssignmentPanel } from "@/shared/components/vendor-assignment-panel";
import { ApplicantPeek } from "@/shared/components/event-hiring-summary";
import { formatXaf } from "@/shared/lib/format";
import { CalendarDays, MapPin, Plus, Ticket, Trash2, Users } from "lucide-react";
import Link from "next/link";

function toLocalInput(value: Date | string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const dynamic = "force-dynamic";

type Tab = "create" | "my-events";

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await requireRole("organiser");
  const params = await searchParams;
  const active: Tab = params.tab === "my-events" ? "my-events" : "create";

  let data: Awaited<ReturnType<typeof getOrganiserEventsData>> = { events: [], vendorOptions: [] };
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let serviceProviders: Awaited<ReturnType<typeof getVendors>> = [];
  let vendorReviewError: string | null = null;
  let hiringPosts: Awaited<ReturnType<typeof getOrganiserHiringPosts>> = [];
  let applicantCounts: Awaited<ReturnType<typeof getApplicantCountsByEvent>> = new Map();

  const [dataResult, categoriesResult, serviceProvidersResult, hiringPostsResult, applicantCountsResult] =
    await Promise.allSettled([
      getOrganiserEventsData(session.userId),
      getCategories(),
      getVendors(),
      getOrganiserHiringPosts(session.userId),
      getApplicantCountsByEvent(session.userId),
    ]);

  if (dataResult.status === "fulfilled") {
    data = dataResult.value;
  } else {
    console.error("Error loading organiser events:", dataResult.reason);
  }

  if (categoriesResult.status === "fulfilled") {
    categories = categoriesResult.value;
  } else {
    console.error("Error loading categories:", categoriesResult.reason);
  }

  if (serviceProvidersResult.status === "fulfilled") {
    serviceProviders = serviceProvidersResult.value;
  } else {
    console.error("Error loading service providers:", serviceProvidersResult.reason);
  }

  if (hiringPostsResult.status === "fulfilled") {
    hiringPosts = hiringPostsResult.value;
  } else {
    console.error("Error loading hiring posts:", hiringPostsResult.reason);
  }

  if (applicantCountsResult.status === "fulfilled") {
    applicantCounts = applicantCountsResult.value;
  } else {
    console.error("Error loading applicant counts:", applicantCountsResult.reason);
  }

  const vendorLookup = new Map(serviceProviders.map((vendor) => [vendor.id, vendor]));
  let reviewMap: Record<string, Awaited<ReturnType<typeof getVendorReviews>>> = {};
  if (serviceProviders.length) {
    try {
      reviewMap = Object.fromEntries(
        (await Promise.all(serviceProviders.map(async (vendor) => [vendor.id, await getVendorReviews(vendor.id)]))).map(([key, value]) => [key, value]),
      ) as Record<string, Awaited<ReturnType<typeof getVendorReviews>>>;
    } catch {
      vendorReviewError = "Unable to load service provider reviews right now.";
    }
  }

  // Map eventId -> { post, domains } for the EditEventForm pre-fill + badge.
  const hiringByEventId = new Map(hiringPosts.map((row) => [row.event.id, row]));

  const tabLink = (value: Tab) => `/events${value === "create" ? "" : `?tab=${value}`}`;

  return (
    <DashboardShell role="organiser" name={session.fullName} active="My events" allowViewSwitch={true}>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-berry">Event studio</p>
          <h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">Plan, staff, and stage every fête.</h1>
          <p className="mt-3 text-sm text-ink/50">Create events, optionally hire professionals, and switch between private and ticketed public visibility.</p>
        </div>
        <Link href="/vendors" className="btn-secondary"><Plus size={16}/>Add a service provider</Link>
      </div>

      <div className="mt-6 inline-flex rounded-xl border border-ink/10 bg-white p-1 text-xs font-semibold">
        <Link href={tabLink("create")} className={`rounded-lg px-4 py-2 transition ${active === "create" ? "bg-berry text-white shadow-sm" : "text-ink/70 hover:bg-ink/6 hover:text-ink"}`}>Create</Link>
        <Link href={tabLink("my-events")} className={`rounded-lg px-4 py-2 transition ${active === "my-events" ? "bg-berry text-white shadow-sm" : "text-ink/70 hover:bg-ink/6 hover:text-ink"}`}>My events{data.events.length ? ` (${data.events.length})` : ""}</Link>
      </div>

      {active === "create" ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[.6fr_1.4fr]">
          <div className="xl:sticky xl:top-6 xl:self-start"><EventForm categories={categories}/></div>
          <div className="paper-card p-6 sm:p-8">
            <p className="eyebrow text-berry">How hiring works</p>
            <h2 className="display mt-2 text-3xl font-semibold">Optional professional recruitment, built in.</h2>
            <ul className="mt-4 grid gap-2 text-sm text-ink/60">
              <li>• Toggle “Hire professionals?” on and pick the service types you need.</li>
              <li>• Add a short requirement note and an optional budget per professional type.</li>
              <li>• Set a recruitment deadline — posts close automatically after that or when places are filled.</li>
              <li>• Track applicants and schedule meetings from the <Link href="/applicants" className="font-semibold text-berry hover:underline">Applicants</Link> section.</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {data.events.length ? data.events.map((event) => {
            const hiringRow = hiringByEventId.get(event.id);
            const count = applicantCounts.get(event.id) ?? 0;
            const hiringPreFill = hiringRow ? {
              deadline: toLocalInput(hiringRow.post.deadline),
              rows: hiringRow.domains.map(({ domain }) => ({
                categoryId: domain.categoryId,
                placesNeeded: String(domain.placesNeeded),
                unitPrice: String(domain.unitPrice ?? 0),
                currency: ((domain.currency as string) || "XAF") as "XAF" | "USD" | "EUR" | "GBP",
                requirementNote: domain.requirementNote ?? "",
              })),
            } : null;
            return (
              <article key={event.id} className="overflow-hidden rounded-[22px] border border-ink/10 bg-white">
                {event.coverUrl ? <div className="relative h-40 overflow-hidden"><img src={event.coverUrl} alt="" className="size-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent"/></div> : null}
                <div className="p-5 sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ${event.visibility === "public" ? "bg-marigold text-ink" : "bg-mint text-forest"}`}>{event.visibility}</span>
                        <p className="eyebrow text-berry">{event.eventType}</p>
                        {hiringRow && (
                          <Link href="/applicants" className="rounded-full bg-forest px-2.5 py-1 text-[9px] font-bold uppercase text-white">Hiring · {count} applicant{count === 1 ? "" : "s"}</Link>
                        )}
                      </div>
                      <h2 className="display mt-3 text-3xl font-semibold">{event.title}</h2>
                      {event.serviceCategoryId && <p className="mt-2 text-xs text-forest">Service provider applications: {categories.find((category) => category.id === event.serviceCategoryId)?.name ?? "Category"}</p>}
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink/55">
                        <span className="flex items-center gap-1.5"><CalendarDays size={13} className="text-berry"/>{event.startsAt.toLocaleString("en-CM", { dateStyle: "medium", timeStyle: "short" })}</span>
                        <span className="flex items-center gap-1.5"><MapPin size={13} className="text-berry"/>{event.venue}, {event.city}</span>
                        <span className="flex items-center gap-1.5"><Users size={13} className="text-berry"/>{event.guestCount} guests</span>
                        {event.visibility === "public" && event.ticketPrice ? <span className="flex items-center gap-1.5"><Ticket size={13} className="text-berry"/>{formatXaf(event.ticketPrice)}</span> : null}
                      </div>
                      {event.description ? <p className="mt-4 max-w-xl text-sm leading-6 text-ink/58">{event.description}</p> : null}
                    </div>
                    <form action={deleteEvent}><input type="hidden" name="eventId" value={event.id}/><button className="grid size-9 place-items-center rounded-full border border-ink/12 text-ink/55 hover:bg-berry/10 hover:text-berry" aria-label="Delete event"><Trash2 size={14}/></button></form>
                  </div>

                  {hiringRow && <ApplicantPeek post={hiringRow.post} domains={hiringRow.domains.map((d) => d.domain)} eventTitle={event.title}/>}

                  <EditEventForm event={event} categories={categories} hiring={hiringPreFill}/>

                  <div className="mt-6 border-t border-ink/10 pt-5">
                    <VendorAssignmentPanel
                      event={{
                        id: event.id,
                        title: event.title,
                        vendors: event.vendors.map((vendor) => ({
                          ...vendorLookup.get(vendor.id) ?? vendor,
                          categories: vendorLookup.get(vendor.id)?.categories ?? [],
                        })),
                      }}
                      vendors={serviceProviders.map((vendor) => ({
                        id: vendor.id,
                        slug: vendor.slug,
                        businessName: vendor.businessName,
                        tagline: vendor.tagline,
                        description: vendor.description,
                        city: vendor.city,
                        address: vendor.address,
                        imageUrl: vendor.imageUrl,
                        coverUrl: vendor.coverUrl,
                        rating: vendor.rating,
                        reviewCount: vendor.reviewCount,
                        verified: vendor.verified,
                        completedEvents: vendor.completedEvents,
                        responseTime: vendor.responseTime,
                        categories: vendor.categories ?? [],
                      }))}
                      categories={categories}
                      reviewsByVendor={reviewMap}
                      error={vendorReviewError ?? undefined}
                    />
                  </div>
                  {event.applications.length > 0 && (
                    <div className="mt-6 border-t border-ink/10 pt-5">
                      <p className="eyebrow text-berry">Provider applications</p>
                      <div className="mt-3 divide-y divide-ink/8">
                        {event.applications.map(({ application, vendor }) => (
                          <div key={application.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                            <div><p className="text-sm font-semibold">{vendor.businessName}</p><p className="mt-1 text-xs capitalize text-ink/50">{application.status}</p></div>
                            {application.status === "pending" && (
                              <div className="flex gap-2">
                                {(["approved", "rejected"] as const).map((decision) => (
                                  <form key={decision} action={reviewEventProviderApplication}>
                                    <input type="hidden" name="applicationId" value={application.id}/>
                                    <input type="hidden" name="decision" value={decision}/>
                                    <button className={decision === "approved" ? "btn-primary !min-h-9 !px-3 text-xs" : "btn-secondary !min-h-9 !px-3 text-xs"}>{decision === "approved" ? "Accept" : "Decline"}</button>
                                  </form>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          }) : (
            <div className="paper-card py-16 text-center">
              <CalendarDays className="mx-auto text-ink/25" size={30}/>
              <h2 className="display mt-4 text-3xl font-semibold">No events yet.</h2>
              <p className="mt-2 text-sm text-ink/50">Head to the Create tab to stage your first fête.</p>
              <Link href="/events" className="btn-primary mt-5">Create an event</Link>
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
