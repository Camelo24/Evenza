import Link from "next/link";
import { Star } from "lucide-react";
import { Marquee } from "@/shared/components/marquee";

export type PublicReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date | string;
  authorName: string;
  vendorName: string;
  vendorSlug?: string;
};

// Placeholder voices shown only until the first real reviews exist. Delete or
// replace this array (it is never mixed with real data) once reviews land.
const placeholderVoices: PublicReview[] = [
  { id: "placeholder-1", rating: 5, createdAt: "2026-01-01", authorName: "Awa N.", vendorName: "Decor and floral design · Douala", comment: "Everything lived in one place — the scope, the dates, the payment steps. Nothing was left to a phone call I could not point back to." },
  { id: "placeholder-2", rating: 5, createdAt: "2026-01-01", authorName: "Brice T.", vendorName: "Photography · Yaoundé", comment: "The escrow flow made the decision easy. We agreed on the work first, and the money only moved when we were both satisfied." },
  { id: "placeholder-3", rating: 4, createdAt: "2026-01-01", authorName: "Nadia F.", vendorName: "Catering · Buea", comment: "I could tell the profile was reviewed before I ever reached out. That alone saved us weeks of back-and-forth with the wrong people." },
  { id: "placeholder-4", rating: 5, createdAt: "2026-01-01", authorName: "Cedric M.", vendorName: "Live band · Limbe", comment: "Clear terms before booking meant no surprises the day of the event. That is exactly what I wanted when planning from another city." },
];

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function Stars({ rating }: { rating: number }) {
  return <span className="flex items-center gap-0.5">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} className={index < rating ? "text-[#d69918]" : "text-[#d69918]/25"} fill={index < rating ? "currentColor" : "none"} />)}</span>;
}

function VoiceCard({ voice }: { voice: PublicReview }) {
  return <article className="w-[330px] shrink-0 pr-5 sm:w-[400px]">
    <div className="flex h-full flex-col rounded-[20px] border border-[#d6dfd8] bg-white p-6">
      <Stars rating={voice.rating} />
      <p className="mt-4 flex-1 text-sm leading-7 text-[#4e5a54]">{voice.comment}</p>
      <div className="mt-6 flex items-center gap-3 border-t border-[#e4e9e5] pt-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#101716] text-[11px] font-bold text-[#d4ff59]">{initials(voice.authorName)}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{voice.authorName}</p>
          {voice.vendorSlug ? <Link href={`/vendors/${voice.vendorSlug}`} className="block truncate text-xs text-[#68736d] transition hover:text-[#3f725d]">Booked {voice.vendorName}</Link> : <p className="truncate text-xs text-[#68736d]">{voice.vendorName}</p>}
        </div>
      </div>
    </div>
  </article>;
}

/** "Customer voices" — an auto-scrolling testimonial wall (real reviews when they exist). */
export function TestimonialsMarquee({ reviews }: { reviews: PublicReview[] }) {
  const voices = reviews.length ? reviews : placeholderVoices;
  const half = Array.from({ length: Math.max(8, voices.length * 2) }, (_, index) => voices[index % voices.length]);

  return <section className="overflow-hidden bg-[#f3f5f0] py-24 text-[#101716] sm:py-32">
    <div className="container-shell flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
      <div><p className="eyebrow text-[#3f725d]">Customer voices</p><h2 className="display mt-5 text-5xl font-semibold leading-[.94] sm:text-6xl">Words from<br />the celebrations.</h2></div>
      <p className="max-w-xs text-sm leading-6 text-[#65716b]">Reviews unlock after escrow releases, so every voice here belongs to a booking that ran its full course.</p>
    </div>
    <ul className="sr-only">{voices.map((voice) => <li key={voice.id}>{voice.authorName} rated {voice.rating} out of 5: {voice.comment}</li>)}</ul>
    <div aria-hidden="true" className="mt-12">
      <Marquee duration={48} className="[mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)]">
        {half.map((voice, index) => <VoiceCard key={`${voice.id}-${index}`} voice={voice} />)}
      </Marquee>
    </div>
  </section>;
}
