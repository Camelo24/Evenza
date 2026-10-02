import { DashboardShell } from "@/shared/components/dashboard-shell";
import { requireRole } from "@backend/auth/session";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, Mail, MapPin, UserRound } from "lucide-react";
import Link from "next/link";
import { getVendorDashboard } from "@backend/bookings/queries";

export const dynamic = "force-dynamic";

export default async function VendorProfilePage() {
  const session = await requireRole("service_provider");
  const data = await getVendorDashboard(session.userId);

  return (
    <DashboardShell role="service_provider" name={session.fullName} active="Profile">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-berry">Profile</p>
          <h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">Professional service profile.</h1>
          <p className="mt-3 text-sm text-ink/50">Present your business clearly, maintain trust, and help clients book with confidence.</p>
        </div>
        <Link href="/vendor/dashboard/settings" className="btn-primary"><ArrowRight size={16} />Manage settings</Link>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-[26px] border border-ink/10 bg-white p-5 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid size-16 place-items-center rounded-2xl bg-marigold text-ink shadow-md"><UserRound size={24} /></span>
              <div>
                <p className="eyebrow text-berry">Brand</p>
                <h2 className="display mt-1 text-3xl font-semibold">{data?.profile.businessName ?? "Vendor profile"}</h2>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-forest/20 bg-mint px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-forest">
              <BadgeCheck size={12} />
              {data?.profile.verified ? "Verified vendor" : "Verification pending"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-paper p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-white text-berry"><Mail size={16} /></span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink/35">Email</p>
                  <p className="mt-2 text-sm font-semibold">{session.email}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-paper p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-white text-forest"><MapPin size={16} /></span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink/35">Location</p>
                  <p className="mt-2 text-sm font-semibold">{data?.profile.city ?? "Location not set"}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-paper p-4 md:col-span-2">
              <div className="flex items-start gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-white text-berry"><BriefcaseBusiness size={16} /></span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink/35">Marketplace snapshot</p>
                  <p className="mt-2 text-sm font-semibold">{data?.services.length ? "Service catalog ready" : "Add services to start receiving bookings"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-[24px] border border-ink/10 bg-white p-5 shadow-sm">
          <p className="eyebrow text-ink/40">Marketplace snapshot</p>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="rounded-2xl bg-paper p-4"><span className="text-ink/45">Categories</span><p className="mt-2 font-semibold">{data?.services.length ? "Service catalog ready" : "Add services to start receiving bookings"}</p></div>
            <div className="rounded-2xl bg-paper p-4"><span className="text-ink/45">Response time</span><p className="mt-2 font-semibold">{data?.profile.responseTime ?? "Within 2 hours"}</p></div>
            <div className="rounded-2xl bg-paper p-4"><span className="text-ink/45">Status</span><p className="mt-2 font-semibold">{data?.profile.verified ? "Verified vendor" : "Verification pending"}</p></div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
