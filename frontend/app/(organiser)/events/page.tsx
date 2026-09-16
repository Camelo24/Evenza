import { deleteEvent } from "@backend/events/actions";
import { DashboardShell } from "@/shared/components/dashboard-shell";
import { EventForm } from "@/shared/components/event-form";
import { requireRole } from "@backend/auth/session";
import { getOrganiserEventsData, getVendorReviews } from "@backend/bookings/queries";
import { getCategories, getVendors } from "@backend/vendors/queries";
import { VendorAssignmentPanel } from "@/shared/components/vendor-assignment-panel";
import { formatXaf } from "@/shared/lib/format";
import { CalendarDays, MapPin, Plus, Ticket, Trash2, Users } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const session = await requireRole("organiser");

  let data: Awaited<ReturnType<typeof getOrganiserEventsData>> = { events: [], vendorOptions: [] };
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let serviceProviders: Awaited<ReturnType<typeof getVendors>> = [];
  let vendorReviewError: string | null = null;

  try {
    [data, categories, serviceProviders] = await Promise.all([getOrganiserEventsData(session.userId), getCategories(), getVendors()]);
  } catch (error) {
    vendorReviewError = "Unable to load organiser event data right now.";
    data = { events: [], vendorOptions: [] };
    categories = [];
    serviceProviders = [];
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

  return (
    <DashboardShell role="organiser" name={session.fullName} active="My events" allowViewSwitch={true}>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="eyebrow text-berry">Event studio</p><h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">Plan, staff, and stage every fête.</h1><p className="mt-3 text-sm text-ink/50">Create events, assign trusted service providers, and switch between private and ticketed public visibility.</p></div>
        <Link href="/vendors" className="btn-secondary"><Plus size={16}/>Add a service provider</Link>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[.6fr_1.4fr]">
        <div className="xl:sticky xl:top-6 xl:self-start"><EventForm/></div>
        <div className="space-y-5">
          {data.events.length ? data.events.map((event) => (
            <article key={event.id} className="overflow-hidden rounded-[22px] border border-ink/10 bg-white">
              {event.coverUrl ? <div className="relative h-40 overflow-hidden"><img src={event.coverUrl} alt="" className="size-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent"/></div> : null}
              <div className="p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ${event.visibility === "public" ? "bg-marigold text-ink" : "bg-mint text-forest"}`}>{event.visibility}</span><p className="eyebrow text-berry">{event.eventType}</p></div>
                    <h2 className="display mt-3 text-3xl font-semibold">{event.title}</h2>
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
                    vendors={vendors.map((vendor) => ({
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
              </div>
            </article>
          )) : (
            <div className="paper-card py-16 text-center"><CalendarDays className="mx-auto text-ink/25" size={30}/><h2 className="display mt-4 text-3xl font-semibold">No events yet.</h2><p className="mt-2 text-sm text-ink/50">Create your first event on the left — you can assign trusted vendors immediately.</p></div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
