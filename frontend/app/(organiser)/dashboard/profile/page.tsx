import { DashboardShell } from "@/shared/components/dashboard-shell";
import { requireRole } from "@backend/auth/session";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, Mail, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrganiserProfilePage() {
  const session = await requireRole("organiser");

  const statusLabel = session.organizerStatus === "approved" ? "Approved" : session.organizerStatus === "pending" ? "Pending review" : "Not requested";

  return (
    <DashboardShell role="organiser" name={session.fullName} active="Profile" allowViewSwitch={true}>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-berry">Account profile</p>
          <h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">Professional organiser profile.</h1>
          <p className="mt-3 text-sm text-ink/50">Keep your identity, workspace status, and operational details clear and trustworthy.</p>
        </div>
        <Link href="/dashboard/settings" className="btn-primary"><ArrowRight size={16} />Manage settings</Link>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-[26px] border border-ink/10 bg-white p-5 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid size-16 place-items-center rounded-2xl bg-marigold text-ink shadow-md"><UserRound size={24} /></span>
              <div>
                <p className="eyebrow text-berry">Identity</p>
                <h2 className="display mt-1 text-3xl font-semibold">{session.fullName}</h2>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-forest/20 bg-mint px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-forest">
              <BadgeCheck size={12} />
              {statusLabel}
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
                <span className="grid size-9 place-items-center rounded-xl bg-white text-forest"><BriefcaseBusiness size={16} /></span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink/35">Workspace</p>
                  <p className="mt-2 text-sm font-semibold">Organiser</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-paper p-4 md:col-span-2">
              <div className="flex items-start gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-white text-berry"><ShieldCheck size={16} /></span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink/35">Verification status</p>
                  <p className="mt-2 text-sm font-semibold">{statusLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[24px] border border-ink/10 bg-white p-5 shadow-sm">
            <p className="eyebrow text-ink/40">Quick actions</p>
            <div className="mt-4 grid gap-3">
              <Link href="/events" className="rounded-2xl border border-ink/10 bg-paper p-4 text-sm font-semibold text-ink transition hover:border-berry/30 hover:bg-berry/5">Manage events</Link>
              <Link href="/dashboard/payments" className="rounded-2xl border border-ink/10 bg-paper p-4 text-sm font-semibold text-ink transition hover:border-berry/30 hover:bg-berry/5">Payments & escrow</Link>
              <Link href="/dashboard/messages" className="rounded-2xl border border-ink/10 bg-paper p-4 text-sm font-semibold text-ink transition hover:border-berry/30 hover:bg-berry/5">Messages</Link>
            </div>
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}
