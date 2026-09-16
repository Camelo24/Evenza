import { SiteFooter, SiteHeader } from "@/shared/components/site-header";
import { VendorExplorer } from "@/shared/components/vendor-explorer";
import { getCategories, getVendors } from "@backend/vendors/queries";

export const dynamic = "force-dynamic";

export default async function VendorsPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const params = await searchParams;
  const [vendors, categories] = await Promise.all([getVendors(), getCategories()]);
  return <main className="marketplace-page">
    <SiteHeader />
    <VendorExplorer vendors={vendors} categories={categories} initialCategory={params.category ?? "all"} initialQuery={params.q ?? ""} />
    <SiteFooter />
  </main>;
}
