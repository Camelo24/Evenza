"use client";

import { formatRating, formatXaf } from "@/shared/lib/format";
import { BadgeCheck, ChevronDown, Heart, List, Map, MapPin, Search, SlidersHorizontal, Star, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";

const ServiceProviderMap = dynamic(() => import("@/shared/components/vendor-map").then((module) => module.ServiceProviderMap), {
  ssr: false,
  loading: () => <div className="grid min-h-[360px] place-items-center bg-mint text-sm text-ink/55 sm:min-h-[480px]">Loading map…</div>,
});

type ServiceProvider = {
  id: string; businessName: string; slug: string; tagline: string; city: string; address: string;
  latitude: string | null; longitude: string | null; rating: string; reviewCount: number; startingPrice: number;
  verified: boolean; responseTime: string; imageUrl: string; featured: boolean; completedEvents: number;
  categories: Array<{ vendorId?: string; name: string; slug: string }>;
};
type Category = { id: number; name: string; slug: string; icon: string };

export function VendorExplorer({ vendors, categories, initialCategory = "all", initialQuery = "" }: { vendors: ServiceProvider[]; categories: Category[]; initialCategory?: string; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState("all");
  const [view, setView] = useState<"list" | "map">("list");
  const [saved, setSaved] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtered = useMemo(() => vendors.filter((serviceProvider) => {
    const haystack = `${serviceProvider.businessName} ${serviceProvider.tagline} ${serviceProvider.categories.map((item) => item.name).join(" ")}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (category === "all" || serviceProvider.categories.some((item) => item.slug === category)) && (city === "all" || serviceProvider.city === city);
  }), [vendors, query, category, city]);
  const cities = [...new Set(vendors.map((serviceProvider) => serviceProvider.city))];

  return (
    <div className="marketplace-explorer">
      <div className="sticky top-[72px] z-30 border-y border-[#dbe2dc] bg-[#f7f9f5]/95 py-3 backdrop-blur-xl">
        <div className="container-shell flex flex-col gap-3 lg:flex-row">
          <label className="relative min-w-0 flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" size={18} /><input className="field !rounded-xl !border-[#d6dfd8] !bg-white !pl-11" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a service provider or service" /></label>
          <div className={`${filtersOpen ? "flex" : "hidden"} flex-col gap-3 sm:flex-row lg:flex`}>
            <label className="relative"><select className="select-field min-w-52 appearance-none !rounded-xl !border-[#d6dfd8] !bg-white pr-10" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All services</option>{categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink/40" size={15} /></label>
            <label className="relative"><select className="select-field min-w-40 appearance-none !rounded-xl !border-[#d6dfd8] !bg-white pr-10" value={city} onChange={(event) => setCity(event.target.value)}><option value="all">All cities</option>{cities.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink/40" size={15} /></label>
          </div>
          <div className="flex gap-2"><button className="btn-secondary flex-1 lg:hidden" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={16} /> Filters</button><div className="flex rounded-xl border border-[#d6dfd8] bg-white p-1"><button onClick={() => setView("list")} aria-label="List view" className={`grid size-9 place-items-center rounded-lg transition ${view === "list" ? "bg-[#101716] text-white" : "text-ink/45"}`}><List size={16} /></button><button onClick={() => setView("map")} aria-label="Map view" className={`grid size-9 place-items-center rounded-lg transition ${view === "map" ? "bg-[#101716] text-white" : "text-ink/45"}`}><Map size={16} /></button></div></div>
        </div>
      </div>

      <div className="container-shell py-8">
        <div className="flex items-center justify-between gap-4"><p className="text-sm"><strong>{filtered.length}</strong> trusted professionals</p>{(category !== "all" || city !== "all" || query) && <button className="flex items-center gap-1 text-xs font-bold text-berry" onClick={() => { setQuery(""); setCategory("all"); setCity("all"); }}><X size={13} /> Clear filters</button>}</div>
        {view === "list" ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((vendor) => <article key={vendor.id} className="group overflow-hidden rounded-[20px] border border-ink/12 bg-white transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(23,35,31,.1)]">
              <div className="relative aspect-[1.23] overflow-hidden"><Link href={`/vendors/${vendor.slug}`}><img src={vendor.imageUrl} alt={vendor.businessName} className="size-full object-cover transition duration-700 group-hover:scale-[1.04]" /></Link><button onClick={() => setSaved(saved.includes(vendor.id) ? saved.filter((id) => id !== vendor.id) : [...saved, vendor.id])} className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white/90 shadow" aria-label="Save vendor"><Heart size={16} className={saved.includes(vendor.id) ? "fill-berry text-berry" : "text-ink"} /></button>{vendor.verified && <span className="absolute bottom-4 left-4 inline-flex items-center gap-1 rounded-full bg-forest px-2.5 py-1.5 text-[9px] font-bold tracking-wide text-white"><BadgeCheck size={12} /> VERIFIED</span>}</div>
              <div className="p-5"><div className="flex items-start justify-between gap-4"><div><Link href={`/vendors/${vendor.slug}`} className="display text-[1.55rem] font-semibold leading-tight hover:text-berry">{vendor.businessName}</Link><p className="mt-1 line-clamp-1 text-[11px] text-ink/50">{vendor.categories.map((item) => item.name).join(" · ")}</p></div><span className="flex shrink-0 items-center gap-1 text-xs font-bold"><Star size={13} fill="currentColor" className="text-marigold" />{formatRating(vendor.rating)}</span></div><p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-ink/58">{vendor.tagline}</p><div className="mt-5 flex items-end justify-between border-t border-ink/10 pt-4"><span className="flex items-center gap-1.5 text-xs text-ink/50"><MapPin size={13} />{vendor.city}</span><span className="text-right text-[9px] uppercase tracking-wide text-ink/40">Starting at<br/><strong className="mono text-xs text-ink">{formatXaf(vendor.startingPrice)}</strong></span></div></div>
            </article>)}
          </div>
        ) : (
          <div className="mt-6 grid min-h-[650px] overflow-hidden rounded-[22px] border border-ink/12 bg-white lg:grid-cols-[.4fr_.6fr]">
            <div className="no-scrollbar max-h-[650px] overflow-y-auto border-r border-ink/10 p-4"><p className="eyebrow mb-4 text-berry">Near Cameroon’s event hubs</p>{filtered.map((vendor) => <Link key={vendor.id} href={`/vendors/${vendor.slug}`} className="flex gap-3 border-b border-ink/10 py-4"><img src={vendor.imageUrl} alt="" className="size-20 rounded-xl object-cover" /><div className="min-w-0"><p className="display truncate text-lg font-semibold">{vendor.businessName}</p><p className="mt-1 text-[11px] text-ink/50">{vendor.categories[0]?.name}</p><div className="mt-3 flex items-center gap-3 text-[10px]"><span className="font-bold">★ {formatRating(vendor.rating)}</span><span>{vendor.city}</span></div></div></Link>)}</div>
            <div className="hidden map-grid relative min-h-[480px] overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent,rgba(23,35,31,.09))]" />
              <div className="absolute left-[12%] top-[12%] rounded-lg bg-white/80 px-3 py-2 text-[10px] font-bold shadow backdrop-blur">Bonamoussadi</div><div className="absolute bottom-[14%] right-[14%] rounded-lg bg-white/80 px-3 py-2 text-[10px] font-bold shadow backdrop-blur">Bastos</div><div className="absolute right-[38%] top-[44%] text-[11px] font-bold text-forest/50">Wouri</div>
              {filtered.map((vendor, index) => { const positions = [[23,25],[62,20],[47,55],[74,67],[28,73],[82,35]]; const pos = positions[index % positions.length]; return <Link href={`/vendors/${vendor.slug}`} key={vendor.id} style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }} className="map-pin absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink px-3 py-2 text-[10px] font-bold text-white shadow-xl transition hover:z-10 hover:scale-110"><span className="text-marigold">●</span> {formatXaf(vendor.startingPrice).replace(" FCFA", "k").replace(/\s/g, "")}</Link>; })}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-[10px] font-semibold shadow-lg"><MapPin className="mr-1 inline" size={12} /> Approximate locations · exact address after booking</div>
            </div>
            <ServiceProviderMap vendors={filtered.map(v => ({ id: v.id, businessName: v.businessName, slug: v.slug, city: v.city, latitude: v.latitude, longitude: v.longitude, startingPrice: v.startingPrice, imageUrl: v.imageUrl }))} />
          </div>
        )}
        {!filtered.length && <div className="paper-card mt-6 py-20 text-center"><Search className="mx-auto text-ink/25" size={30} /><h3 className="display mt-4 text-3xl font-semibold">No exact match yet.</h3><p className="mt-2 text-sm text-ink/50">Try another service, city, or a broader search.</p></div>}
      </div>
    </div>
  );
}
