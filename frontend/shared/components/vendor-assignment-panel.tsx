"use client";

import { assignEventVendor } from "@backend/events/actions";
import { formatRating, formatXaf } from "@/shared/lib/format";
import { BadgeCheck, Check, Clock3, LoaderCircle, MapPin, Search, ShieldCheck, SlidersHorizontal, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ServiceProviderCard = {
  id: string;
  slug: string;
  businessName: string;
  tagline: string;
  description: string;
  city: string;
  address: string;
  imageUrl: string;
  coverUrl: string;
  rating: string | number;
  reviewCount: number;
  verified: boolean;
  completedEvents: number;
  responseTime: string;
  categories: Array<{ name: string; slug: string }>;
};

type ReviewRow = {
  review: {
    id: string;
    rating: number;
    comment: string;
    createdAt: Date | string;
  };
  author: {
    fullName: string;
  };
};

type EventItem = {
  id: string;
  title: string;
  vendors: ServiceProviderCard[];
};

function getAvailabilityStatus(serviceProvider: ServiceProviderCard) {
  const text = serviceProvider.responseTime.toLowerCase();
  if (text.includes("1 hour") || text.includes("2 hours") || text.includes("within 2 hours")) return "available";
  if (text.includes("day") || text.includes("24")) return "limited";
  return "busy";
}

export function VendorAssignmentPanel({ event, vendors, categories, reviewsByVendor, error }: { event: EventItem; vendors: ServiceProviderCard[]; categories: Array<{ id: number; name: string; slug: string; icon: string }>; reviewsByVendor: Record<string, ReviewRow[]>; error?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("all");
  const [rating, setRating] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [assignedIds, setAssignedIds] = useState<string[]>(() => event.vendors.map((serviceProvider) => serviceProvider.id));
  const [previewServiceProvider, setPreviewServiceProvider] = useState<ServiceProviderCard | null>(null);
  const [confirmingServiceProvider, setConfirmingServiceProvider] = useState<ServiceProviderCard | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (error) {
    return (
      <div className="mt-4 rounded-[20px] border border-berry/15 bg-berry/5 p-4 text-sm text-berry">
        We couldn’t load vendor matches right now. Please refresh or try again shortly.
      </div>
    );
  }

  const cities = useMemo(() => [...new Set(vendors.map((serviceProvider) => serviceProvider.city))].sort(), [vendors]);

  const filteredVendors = useMemo(() => vendors.filter((serviceProvider) => {
    const haystack = `${serviceProvider.businessName} ${serviceProvider.tagline} ${serviceProvider.city} ${serviceProvider.categories.map((item) => item.name).join(" ")}`.toLowerCase();
    const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
    const matchesCategory = category === "all" || serviceProvider.categories.some((item) => item.slug === category);
    const matchesLocation = location === "all" || serviceProvider.city === location;
    const matchesRating = rating === "all" || Number(serviceProvider.rating) >= Number(rating);
    const availabilityStatus = getAvailabilityStatus(serviceProvider);
    const matchesAvailability = availability === "all" || availabilityStatus === availability;
    return matchesQuery && matchesCategory && matchesLocation && matchesRating && matchesAvailability;
  }), [vendors, query, category, location, rating, availability]);

  const handleAssign = async (serviceProvider: ServiceProviderCard) => {
    setPendingId(serviceProvider.id);
    try {
      const formData = new FormData();
      formData.set("eventId", event.id);
      formData.set("vendorId", serviceProvider.id);
      await assignEventVendor(formData);
      setAssignedIds((current) => (current.includes(serviceProvider.id) ? current : [...current, serviceProvider.id]));
      setIsOpen(false);
      setPreviewServiceProvider(null);
      setConfirmingServiceProvider(null);
      setToast(`${serviceProvider.businessName} has been added to ${event.title}.`);
    } finally {
      setPendingId(null);
    }
  };

  const assignedServiceProviders = vendors.filter((serviceProvider) => assignedIds.includes(serviceProvider.id));

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow text-ink/40">Assigned service providers</p>
        <button type="button" className="btn-secondary !min-h-9 !px-3 !text-[11px]" onClick={() => setIsOpen((value) => !value)}>
          {isOpen ? "Hide" : "Browse"}
        </button>
      </div>

      {assignedServiceProviders.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {assignedServiceProviders.map((serviceProvider) => (
            <span key={serviceProvider.id} className="inline-flex items-center gap-2 rounded-full bg-paper px-3 py-1.5 text-[11px]">
              {serviceProvider.businessName}
              <button type="button" aria-label={`Remove ${serviceProvider.businessName}`} onClick={() => setAssignedIds((current) => current.filter((id) => id !== serviceProvider.id))} className="grid place-items-center rounded-full text-ink/45 hover:text-berry">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[11px] text-ink/40">No service providers assigned yet.</p>
      )}

      {isOpen && (
        <div className="mt-4 rounded-[22px] border border-ink/12 bg-paper p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative block flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="field !min-h-11 !rounded-full !bg-white !pl-10"
                placeholder="Search by service provider, service, or city"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <label className="relative">
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="select-field !min-h-11 !rounded-full !bg-white pr-8 text-[12px]">
                  <option value="all">All categories</option>
                  {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
                </select>
              </label>
              <label className="relative">
                <select value={location} onChange={(event) => setLocation(event.target.value)} className="select-field !min-h-11 !rounded-full !bg-white pr-8 text-[12px]">
                  <option value="all">All cities</option>
                  {cities.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <button type="button" className="btn-secondary !min-h-11 !px-3 !text-[11px]" onClick={() => {
                setQuery("");
                setCategory("all");
                setLocation("all");
                setRating("all");
                setAvailability("all");
              }}>
                Reset
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <label className="relative">
                <select value={rating} onChange={(event) => setRating(event.target.value)} className="select-field !min-h-10 !rounded-full !bg-white pr-8 text-[11px]">
                  <option value="all">Rating: any</option>
                  <option value="4.5">4.5+</option>
                  <option value="4.7">4.7+</option>
                  <option value="4.8">4.8+</option>
                </select>
              </label>
              <label className="relative">
                <select value={availability} onChange={(event) => setAvailability(event.target.value)} className="select-field !min-h-10 !rounded-full !bg-white pr-8 text-[11px]">
                  <option value="all">Availability: any</option>
                  <option value="available">Available now</option>
                  <option value="limited">Limited</option>
                  <option value="busy">Busy</option>
                </select>
              </label>
            </div>
            <p className="text-[11px] text-ink/50">{filteredVendors.length} matches</p>
          </div>

          {filteredVendors.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {filteredVendors.map((serviceProvider) => {
                const reviewList = reviewsByVendor[serviceProvider.id] ?? [];
                const availabilityStatus = getAvailabilityStatus(serviceProvider);
                return (
                  <article key={serviceProvider.id} className="overflow-hidden rounded-[20px] border border-ink/12 bg-white">
                    <div className="relative h-28 overflow-hidden">
                      <img src={serviceProvider.coverUrl || serviceProvider.imageUrl} alt={serviceProvider.businessName} className="size-full object-cover" />
                      {serviceProvider.verified && (
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-forest px-2.5 py-1 text-[9px] font-bold text-white">
                          <BadgeCheck size={11} /> VERIFIED
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="display text-[1.45rem] font-semibold leading-tight">{serviceProvider.businessName}</p>
                          <p className="mt-1 text-[10px] text-ink/45">{serviceProvider.categories.map((item) => item.name).join(" · ")}</p>
                        </div>
                        <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold">
                          <Star size={12} fill="currentColor" className="text-marigold" />
                          {formatRating(serviceProvider.rating)}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-5 text-ink/58">{serviceProvider.tagline}</p>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-ink/55">
                        <span className="flex items-center gap-1"><MapPin size={11} className="text-berry" />{serviceProvider.city}</span>
                        <span className="flex items-center gap-1"><Clock3 size={11} className="text-berry" />{serviceProvider.responseTime}</span>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3 text-[10px] uppercase tracking-[.08em] text-ink/45">
                        <span>{serviceProvider.reviewCount} reviews</span>
                        <span>{serviceProvider.completedEvents} bookings</span>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2">
                        <button type="button" className="btn-ghost !min-h-9 !px-0 text-[11px] font-bold text-berry" onClick={() => setPreviewServiceProvider(serviceProvider)}>
                          View profile
                        </button>
                        <button
                          type="button"
                          className="btn-primary !min-h-9 !px-3 !text-[11px]"
                          disabled={assignedIds.includes(serviceProvider.id) || pendingId === serviceProvider.id}
                          onClick={() => setConfirmingServiceProvider(serviceProvider)}
                        >
                          {pendingId === serviceProvider.id ? <><LoaderCircle className="animate-spin" size={12} /> Assigning</> : assignedIds.includes(serviceProvider.id) ? "Assigned" : "Assign"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-[20px] border border-dashed border-ink/15 bg-white/60 p-10 text-center">
              <Search className="mx-auto text-ink/25" size={28} />
              <h3 className="display mt-4 text-2xl font-semibold">No match yet.</h3>
              <p className="mt-2 text-sm text-ink/50">Try another category, city, or broader rating threshold.</p>
            </div>
          )}
        </div>
      )}

      {previewServiceProvider && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[30px] border border-ink/12 bg-paper shadow-[0_30px_90px_rgba(23,35,31,0.22)]">
            <div className="relative h-44 overflow-hidden sm:h-52">
              <img src={previewServiceProvider.coverUrl || previewServiceProvider.imageUrl} alt={previewServiceProvider.businessName} className="size-full object-cover" />
              <button type="button" className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white/90" onClick={() => setPreviewServiceProvider(null)} aria-label="Close preview"><X size={15} /></button>
            </div>
            <div className="p-6 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">{previewServiceProvider.verified && <span className="inline-flex items-center gap-1 rounded-full bg-forest px-2.5 py-1.5 text-[9px] font-bold text-white"><BadgeCheck size={11} /> VERIFIED</span>}<span className="rounded-full bg-marigold/15 px-2.5 py-1 text-[9px] uppercase tracking-[.08em] text-ink">{previewServiceProvider.categories[0]?.name ?? "Service provider"}</span></div>
                  <h3 className="display mt-3 text-3xl font-semibold">{previewServiceProvider.businessName}</h3>
                  <p className="mt-2 text-sm text-ink/58">{previewServiceProvider.tagline}</p>
                </div>
                <div className="rounded-[18px] bg-white px-4 py-3 text-right shadow-sm">
                  <div className="flex items-center justify-end gap-1 text-sm font-bold"><Star size={14} fill="currentColor" className="text-marigold" /> {formatRating(previewServiceProvider.rating)}</div>
                  <p className="mt-1 text-[10px] uppercase tracking-[.08em] text-ink/45">{previewServiceProvider.reviewCount} reviews</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[18px] bg-white p-4"><p className="text-[10px] uppercase tracking-[.08em] text-ink/45">City</p><p className="mt-2 flex items-center gap-2 text-sm font-semibold"><MapPin size={14} className="text-berry" />{previewServiceProvider.city}</p></div>
                <div className="rounded-[18px] bg-white p-4"><p className="text-[10px] uppercase tracking-[.08em] text-ink/45">Response time</p><p className="mt-2 flex items-center gap-2 text-sm font-semibold"><Clock3 size={14} className="text-berry" />{previewServiceProvider.responseTime}</p></div>
                <div className="rounded-[18px] bg-white p-4"><p className="text-[10px] uppercase tracking-[.08em] text-ink/45">Completed</p><p className="mt-2 flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={14} className="text-forest" />{previewServiceProvider.completedEvents} bookings</p></div>
              </div>

              <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_.9fr]">
                <div>
                  <p className="eyebrow text-berry">Bio</p>
                  <p className="mt-3 text-sm leading-7 text-ink/62">{previewServiceProvider.description}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <img src={previewServiceProvider.imageUrl} alt={`${previewServiceProvider.businessName} portfolio 1`} className="h-32 w-full rounded-[18px] object-cover" />
                    <img src={previewServiceProvider.coverUrl || previewServiceProvider.imageUrl} alt={`${previewServiceProvider.businessName} portfolio 2`} className="h-32 w-full rounded-[18px] object-cover" />
                  </div>
                </div>

                <div>
                  <p className="eyebrow text-berry">Recent reviews</p>
                  <div className="mt-3 space-y-3">
                    {(reviewsByVendor[previewServiceProvider.id] ?? []).slice(0, 3).map((row) => (
                      <div key={row.review.id} className="rounded-[18px] border border-ink/10 bg-white p-4">
                        <div className="flex items-center gap-1">{Array.from({ length: row.review.rating }).map((_, index) => <Star key={`${row.review.id}-${index}`} size={12} className="fill-marigold text-marigold" />)}</div>
                        <p className="mt-2 text-sm leading-5 text-ink/62">“{row.review.comment}”</p>
                        <p className="mt-3 text-[10px] font-bold uppercase tracking-[.08em] text-ink/40">{row.author.fullName.split(" ")[0]}</p>
                      </div>
                    ))}
                    {!(reviewsByVendor[previewServiceProvider.id] ?? []).length && <p className="rounded-[18px] border border-dashed border-ink/12 bg-white/60 p-4 text-sm text-ink/50">No reviews yet for this profile.</p>}
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" className="btn-secondary" onClick={() => setPreviewServiceProvider(null)}>Close</button>
                <button type="button" className="btn-primary" disabled={assignedIds.includes(previewServiceProvider.id) || pendingId === previewServiceProvider.id} onClick={() => setConfirmingServiceProvider(previewServiceProvider)}>
                  {pendingId === previewServiceProvider.id ? <><LoaderCircle className="animate-spin" size={14} /> Assigning</> : assignedIds.includes(previewServiceProvider.id) ? "Already assigned" : "Assign to event"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmingServiceProvider && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/60 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md rounded-[24px] border border-ink/12 bg-white p-6 shadow-[0_24px_80px_rgba(23,35,31,0.18)]">
            <p className="eyebrow text-berry">Confirm assignment</p>
            <h3 className="display mt-3 text-3xl font-semibold">Add {confirmingServiceProvider.businessName}?</h3>
            <p className="mt-3 text-sm leading-6 text-ink/58">This service provider will be added to <span className="font-semibold">{event.title}</span> and can begin planning with your team.</p>
            <div className="mt-5 flex items-center justify-between rounded-[18px] bg-paper p-3 text-xs">
              <span className="flex items-center gap-2"><MapPin size={12} className="text-berry" /> {confirmingServiceProvider.city}</span>
              <span className="flex items-center gap-2"><Star size={12} fill="currentColor" className="text-marigold" /> {formatRating(confirmingServiceProvider.rating)}</span>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" className="btn-secondary" onClick={() => setConfirmingServiceProvider(null)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={() => handleAssign(confirmingServiceProvider)}>
                {pendingId === confirmingServiceProvider.id ? <><LoaderCircle className="animate-spin" size={14} /> Adding</> : <><Check size={14} /> Confirm</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-[70] rounded-full border border-forest/20 bg-forest px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(35,79,64,0.25)]">
          {toast}
        </div>
      )}
    </div>
  );
}
