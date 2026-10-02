import { Marquee } from "@/shared/components/marquee";

const signals = ["Identity reviewed", "Escrow-aware bookings", "Human dispute support", "Built for Cameroon"];

/** The lime trust strip, upgraded to a slow seamless marquee. */
export function TrustMarquee() {
  const half = [...signals, ...signals, ...signals, ...signals];
  return <section className="overflow-hidden bg-[#d4ff59] py-4 text-[#101716]">
    <ul className="sr-only">{signals.map((signal) => <li key={signal}>{signal}</li>)}</ul>
    <Marquee duration={26} className="[mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
      {half.map((signal, index) => <span key={index} aria-hidden="true" className="flex items-center gap-2.5 pr-12 text-[10px] font-bold uppercase tracking-[.13em] whitespace-nowrap">
        <span className="size-1.5 rounded-full bg-[#101716]" />
        {signal}
      </span>)}
    </Marquee>
  </section>;
}
