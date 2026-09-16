import { DashboardShell } from "@/shared/components/dashboard-shell";
import { AccessRequestWorkspace } from "@/shared/components/access-request-workspace";
import { reviewAccessRequest } from "@backend/admin/actions";
import { getAdminData } from "@backend/admin/queries";
import { requireRole } from "@backend/auth/session";
export const dynamic = "force-dynamic";
export default async function AccessReviewPage() {
  const session = await requireRole("admin");
  const { accessReviewRequests } = await getAdminData();
  return <DashboardShell role="admin" name={session.fullName} active="Access & users"><p className="eyebrow text-berry">Trust review</p><h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">Access requests.</h1><p className="mt-3 text-sm text-ink/50">Review applicant information privately and grant marketplace access deliberately.</p><AccessRequestWorkspace requests={accessReviewRequests} action={reviewAccessRequest as (formData: FormData) => void | Promise<void>}/></DashboardShell>;
}
