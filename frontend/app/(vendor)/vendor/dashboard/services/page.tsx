import { DashboardShell } from "@/shared/components/dashboard-shell";
import { VendorProfileForm } from "@/shared/components/vendor-profile-form";
import { VendorServiceForm } from "@/shared/components/vendor-service-form";
import { getVendorDashboard } from "@backend/bookings/queries";
import { requireRole } from "@backend/auth/session";
import { formatXaf } from "@/shared/lib/format";

export const dynamic = "force-dynamic";
export default async function ServiceProviderServicesPage() { const session = await requireRole("service_provider"); const data = await getVendorDashboard(session.userId); if (!data) return <DashboardShell role="service_provider" name={session.fullName} active="Services"><VendorProfileForm/></DashboardShell>; return <DashboardShell role="service_provider" name={session.fullName} active="Services"><p className="eyebrow text-berry">Marketplace services</p><h1 className="display mt-2 text-4xl font-semibold">What organisers can book.</h1><section className="mt-8 max-w-2xl rounded-[22px] border border-ink/10 bg-white p-5 sm:p-7"><div className="divide-y divide-ink/10">{data.services.length ? data.services.map((service) => <div className="py-4 first:pt-0" key={service.id}><div className="flex justify-between gap-4"><p className="font-bold">{service.name}</p><p className="mono text-xs">{formatXaf(service.price)}</p></div><p className="mt-2 text-xs text-ink/52">{service.description}</p></div>) : <p className="py-5 text-sm text-ink/50">No services yet.</p>}</div><VendorServiceForm/></section></DashboardShell>; }
