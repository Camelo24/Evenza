import { BookingForm } from "@/shared/components/booking-form";
import { SiteHeader } from "@/shared/components/site-header";
import { requireRole } from "@backend/auth/session";
import { getVendor } from "@backend/vendors/queries";
import { ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BookingPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ service?: string }> }) {
  await requireRole("organiser");
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const serviceProvider = await getVendor(slug);
  if (!serviceProvider) notFound();
  return (
    <main>
      <SiteHeader />
      <section className="border-b border-ink/10 py-10">
        <div className="container-shell flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="eyebrow text-berry">Protected booking</p><h1 className="display mt-3 text-4xl font-semibold sm:text-5xl">Book {serviceProvider.businessName}.</h1></div>
          <p className="flex max-w-xs items-start gap-2 text-xs leading-5 text-ink/52"><ShieldCheck className="mt-0.5 shrink-0 text-forest" size={16} />You are not charged directly to the service provider. Funds remain protected through delivery.</p>
        </div>
      </section>
      <section className="container-shell py-8 sm:py-12"><BookingForm vendor={serviceProvider} initialService={query.service} /></section>
    </main>
  );
}
