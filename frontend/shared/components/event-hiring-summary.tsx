import { CalendarClock, Users2 } from "lucide-react";

type Currency = "XAF" | "USD" | "EUR" | "GBP";

type Domain = {
  id: string;
  categoryId: number;
  placesNeeded: number;
  placesFilled: number;
  requirementNote?: string | null;
  unitPrice?: number | null;
  currency?: string | null;
  budget?: number | null;
  status: "open" | "closed";
};

type Post = {
  id: string;
  status: "open" | "closed";
  deadline: Date | string;
};

function formatMoney(amount: number, currency: string | null | undefined) {
  const c: Currency = (["XAF", "USD", "EUR", "GBP"].includes(currency ?? "") ? (currency as Currency) : "XAF");
  const symbol = c === "XAF" ? "FCFA" : c === "USD" ? "$" : c === "EUR" ? "€" : "£";
  return `${symbol} ${amount.toLocaleString("en-US")}`;
}

export function ApplicantPeek({ post, domains, eventTitle: _eventTitle }: { post: Post; domains: Domain[]; eventTitle?: string }) {
  const deadline = new Date(post.deadline);
  const total = domains.reduce((sum, d) => sum + (d.unitPrice != null ? d.unitPrice * d.placesNeeded : d.budget ?? 0), 0);
  const primaryCurrency = (["XAF", "USD", "EUR", "GBP"].includes(domains[0]?.currency ?? "") ? domains[0]?.currency : "XAF") as Currency;
  return (
    <div className="mt-5 rounded-2xl border border-forest/15 bg-forest/[.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow text-forest">Hiring conditions</p>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-ink/65">
          <CalendarClock size={12}/>
          {post.status === "closed" ? "Closed" : "Deadline"} · {deadline.toLocaleString("en-CM", { dateStyle: "medium", timeStyle: "short" })}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {domains.length === 0 && <p className="text-xs text-ink/55">No professional types selected yet.</p>}
        {domains.map((domain) => {
          const subtotal = domain.unitPrice != null ? domain.unitPrice * domain.placesNeeded : domain.budget ?? 0;
          return (
            <span key={domain.id} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${domain.status === "closed" ? "bg-ink/10 text-ink/60" : "bg-white text-forest"}`}>
              <Users2 size={12}/>
              {domain.placesFilled}/{domain.placesNeeded}
              {subtotal > 0 ? <> · {formatMoney(subtotal, domain.currency)} {domain.unitPrice != null ? <>@ {formatMoney(domain.unitPrice, domain.currency)}/person</> : null}</> : null}
            </span>
          );
        })}
      </div>
      {total > 0 && (
        <p className="mt-3 text-[11px] font-semibold text-forest">
          Total estimated hiring budget: {formatMoney(total, primaryCurrency)}
        </p>
      )}
    </div>
  );
}
