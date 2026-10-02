import { DashboardShell } from "@/shared/components/dashboard-shell";
import { PasswordSettingsForm } from "@/shared/components/password-settings-form";
import { requireRole } from "@backend/auth/session";

export const dynamic = "force-dynamic";

export default async function VendorSettingsPage() {
  const session = await requireRole("service_provider");

  return (
    <DashboardShell role="service_provider" name={session.fullName} active="Settings">
      <div className="max-w-2xl">
        <p className="eyebrow text-berry">Security</p>
        <h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">Update your password.</h1>
        <p className="mt-3 text-sm text-ink/50">Keep your vendor account protected and your marketplace communications secure.</p>
      </div>

      <PasswordSettingsForm />
    </DashboardShell>
  );
}
