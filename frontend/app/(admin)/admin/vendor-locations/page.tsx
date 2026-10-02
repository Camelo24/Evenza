import { DashboardShell } from "@/shared/components/dashboard-shell";
import { updateVendorCoordinates } from "@backend/admin/actions";
import { getAdminData } from "@backend/admin/queries";
import { requireRole } from "@backend/auth/session";
import { MapPin, Save } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminVendorLocationsPage() {
  const session = await requireRole("admin");
  const { vendors } = await getAdminData();

  return (
    <DashboardShell role="admin" name={session.fullName} active="Vendor locations">
      <p className="eyebrow text-berry">Geographic data</p>
      <h1 className="display mt-2 text-4xl font-semibold">Vendor locations.</h1>
      <section className="mt-8 max-w-4xl rounded-[22px] border border-ink/10 bg-white p-5 sm:p-7">
        {vendors.length ? (
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <form key={vendor.id} action={updateVendorCoordinates} className="flex items-center gap-4 rounded-xl border border-ink/10 p-4">
                <div className="flex min-w-0 flex-1 gap-4">
                  <img src={vendor.imageUrl} alt="" className="size-12 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{vendor.businessName}</p>
                    <p className="mt-1 text-xs text-ink/48">{vendor.city}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-ink/40">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      defaultValue={vendor.latitude || ""}
                      placeholder="3.8"
                      className="field !min-h-9 !w-24 !px-2 !text-xs"
                      min="-90"
                      max="90"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink/40">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      defaultValue={vendor.longitude || ""}
                      placeholder="11.5"
                      className="field !min-h-9 !w-24 !px-2 !text-xs"
                      min="-180"
                      max="180"
                      required
                    />
                  </div>
                </div>
                <input type="hidden" name="vendorId" value={vendor.id} />
                <button type="submit" className="btn-primary !min-h-9 !px-3 text-xs">
                  <Save size={14} />
                  Save
                </button>
              </form>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <MapPin className="mx-auto text-ink/25" size={30} />
            <p className="mt-4 text-sm text-ink/50">No service providers yet.</p>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}