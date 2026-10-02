import { DashboardShell } from "@/shared/components/dashboard-shell";
import { PasswordSettingsForm } from "@/shared/components/password-settings-form";
import { requireRole } from "@backend/auth/session";

export const dynamic = "force-dynamic";

export default async function OrganiserSettingsPage() {
  const session = await requireRole("organiser");

  return (
    <DashboardShell role="organiser" name={session.fullName} active="Settings" allowViewSwitch={true}>
      <div className="max-w-2xl">
        <p className="eyebrow text-berry">Security</p>
        <h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">Update your password.</h1>
        <p className="mt-3 text-sm text-ink/50">Use a unique password for your organiser account and keep your workspace protected.</p>
      </div>

      <PasswordSettingsForm />
    </DashboardShell>
  );
}
