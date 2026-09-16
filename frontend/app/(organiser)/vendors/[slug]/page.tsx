import { SiteFooter, SiteHeader } from "@/shared/components/site-header";
import { getVendor } from "@backend/vendors/queries";
import { getVendorReviews } from "@backend/bookings/queries";
import { formatRating, formatXaf } from "@/shared/lib/format";
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Camera, Check, Clock3, MapPin, MessageCircle, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VendorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vendor = await getVendor(slug);
  if (!vendor) notFound();
  const reviews = await getVendorReviews(vendor.id);
  return (
    <main>
      <SiteHeader />
      <div className="container-shell py-6"><Link href="/vendors" className="inline-flex items-center gap-2 text-xs font-bold text-ink/55 hover:text-ink"><ArrowLeft size={14} /> Back to marketplace</Link></div>
      <section className="container-shell grid gap-4 md:grid-cols-[1.6fr_.7fr]">
        <div className="relative min-h-[420px] overflow-hidden rounded-[22px] sm:min-h-[540px]">
          <img src={vendor.coverUrl} alt={`${vendor.businessName} portfolio`} className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 p-6 text-white sm:p-9">
            <div className="mb-4 flex flex-wrap gap-2">{vendor.categories.map((category) => <span key={category.slug} className="rounded-full border border-white/22 bg-ink/30 px-3 py-1.5 text-[10px] font-bold backdrop-blur">{category.name}</span>)}</div>
            <h1 className="display text-5xl font-semibold leading-none sm:text-7xl">{vendor.businessName}</h1>
            <p className="mt-4 max-w-2xl text-sm text-white/72">{vendor.tagline}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
          <div className="relative min-h-48 overflow-hidden rounded-[22px]"><img src={vendor.imageUrl} alt="Vendor at work" className="absolute inset-0 size-full object-cover" />{vendor.verified && <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-forest"><BadgeCheck size={13} /> VERIFIED VENDOR</span>}</div>
          <div className="rounded-[22px] bg-marigold p-5 sm:p-7">
            <p className="eyebrow text-berry">Reputation</p>
            <div className="mt-5 flex items-end gap-2"><span className="display text-5xl font-semibold">{formatRating(vendor.rating)}</span><Star className="mb-2 fill-ink" size={17} /></div>
            <p className="mt-1 text-xs text-ink/57">{vendor.reviewCount} verified reviews</p>
            <div className="mt-6 h-px bg-ink/15" />
            <p className="mt-4 text-xs"><strong>{vendor.completedEvents}</strong> completed events</p>
          </div>
        </div>
      </section>

      <section className="container-shell grid gap-12 py-16 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="grid gap-8 border-b border-ink/12 pb-12 sm:grid-cols-[.72fr_1.28fr]"><p className="eyebrow text-berry">About the studio</p><div className="text-center"><p className="display text-3xl font-medium leading-[1.25] sm:text-4xl">“{vendor.tagline}”</p><p className="mt-6 text-sm leading-7 text-ink/62">{vendor.description}</p></div></div>
          <div className="py-12"><div className="flex items-end justify-between"><div><p className="eyebrow text-berry">Bookable services</p><h2 className="display mt-3 text-4xl font-semibold">Choose your starting point.</h2></div></div><div className="mt-7 grid gap-3">{vendor.services.map((service, index) => <div key={service.id} className="paper-card flex flex-col justify-between gap-5 p-5 transition hover:bg-white sm:flex-row sm:items-center sm:p-6"><div className="flex gap-4"><span className="mono mt-1 text-xs text-berry">0{index + 1}</span><div><h3 className="font-bold">{service.name}</h3><p className="mt-2 max-w-xl text-xs leading-5 text-ink/53">{service.description}</p><p className="mt-3 flex items-center gap-1 text-[10px] font-bold text-ink/42"><Clock3 size={12} />{service.durationHours} hour coverage</p></div></div><div className="flex shrink-0 items-center justify-between gap-6 border-t border-ink/10 pt-4 sm:block sm:border-0 sm:pt-0 sm:text-right"><p className="mono text-sm font-semibold">{formatXaf(service.price)}</p><Link href={`/vendors/${vendor.slug}/book?service=${service.id}`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-berry">Select <ArrowRight size={13} /></Link></div></div>)}</div></div>

          {vendor.unavailableDates.length ? <div className="border-t border-ink/12 py-12"><p className="eyebrow text-berry">Availability calendar</p><h2 className="display mt-3 text-3xl font-semibold">Blocked dates.</h2><div className="mt-5 flex flex-wrap gap-2">{vendor.unavailableDates.map((slot) => <span key={slot.id} className="rounded-full border border-ink/12 bg-paper px-3 py-1.5 text-[11px]">{slot.date.toLocaleDateString("en-CM", { day: "numeric", month: "short", year: "numeric" })}</span>)}</div></div> : null}

          {reviews.length ? <div className="border-t border-ink/12 py-12"><p className="eyebrow text-berry">Verified reviews</p><h2 className="display mt-3 text-3xl font-semibold">In the words of past organisers.</h2><div className="mt-6 grid gap-4 sm:grid-cols-2">{reviews.map((row) => <div key={row.review.id} className="paper-card p-5"><div className="flex items-center gap-1">{Array.from({ length: row.review.rating }).map((_, index) => <Star key={index} className="fill-marigold text-marigold" size={14} />)}</div><p className="mt-3 text-sm leading-6 text-ink/70">“{row.review.comment}”</p><p className="mt-4 text-[10px] font-bold text-ink/45">{row.author.fullName.split(" ")[0]} · {row.review.createdAt.toLocaleDateString("en-CM", { month: "long", year: "numeric" })}</p></div>)}</div></div> : null}

          <div className="grid gap-4 border-t border-ink/12 pt-12 sm:grid-cols-3">{[[Camera, "Delivery proof", "Timestamped evidence"], [ShieldCheck, "Protected funds", "Full or deposit escrow"], [MessageCircle, "Direct contact", "Chat after confirmation"]].map(([Icon, title, copy]) => { const I = Icon as typeof Camera; return <div key={String(title)} className="rounded-2xl bg-mint/60 p-5"><I size={19} className="text-forest" /><p className="mt-5 text-sm font-bold">{String(title)}</p><p className="mt-1 text-xs text-ink/50">{String(copy)}</p></div>; })}</div>
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start"><div className="rounded-[22px] border border-ink/12 bg-white p-6 shadow-[0_24px_60px_rgba(23,35,31,.09)]"><p className="text-[10px] uppercase tracking-wide text-ink/42">Services from</p><p className="display mt-1 text-3xl font-semibold">{formatXaf(vendor.startingPrice)}</p><div className="mt-6 grid gap-3 text-xs text-ink/57"><span className="flex items-center gap-3"><MapPin size={16} className="text-berry" />{vendor.address}</span><span className="flex items-center gap-3"><Clock3 size={16} className="text-berry" />{vendor.responseTime}</span><span className="flex items-center gap-3"><CalendarDays size={16} className="text-berry" />Availability confirmed before charge</span></div><Link href={`/vendors/${vendor.slug}/book`} className="btn-primary mt-7 w-full">Book {vendor.businessName.split(" ")[0]} <ArrowRight size={16} /></Link><p className="mt-4 flex items-start gap-2 text-[10px] leading-5 text-ink/45"><Check className="mt-0.5 shrink-0" size={12} />Your payment is protected while the vendor reviews your request.</p></div></aside>
      </section>
      <SiteFooter />
    </main>
  );
}
