import { redirect } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { getSession } from "@backend/auth/session";
import { listNotifications } from "@backend/notifications/service";
import { markNotificationRead } from "@backend/notifications/actions";
import { DashboardShell } from "@/shared/components/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const role = session.role === "admin" ? "admin" : session.role === "service_provider" ? "service_provider" : session.isOrganizer ? "organiser" : "client";
  const notifications = await listNotifications(session.userId, 100);

  return <DashboardShell role={role} name={session.fullName} active="Notifications" allowViewSwitch={role === "organiser"}>
    <p className="eyebrow text-berry">Updates</p>
    <h1 className="display mt-2 text-4xl font-semibold">Notifications.</h1>
    <section className="mt-8 max-w-3xl divide-y divide-ink/10 rounded-[22px] border border-ink/10 bg-white p-5 sm:p-7">
      {notifications.length ? notifications.map((note) => <article key={note.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
        <div className="flex min-w-0 gap-3"><span className={`mt-1.5 size-2 shrink-0 rounded-full ${note.read ? "bg-ink/15" : "bg-berry"}`} /><div><p className="text-sm font-bold">{note.title}</p><p className="mt-1 text-xs leading-5 text-ink/55">{note.body}</p><time className="mono mt-2 block text-[9px] text-ink/35">{note.createdAt.toLocaleString("en-CM", { dateStyle: "medium", timeStyle: "short" })}</time></div></div>
        {!note.read && <form action={markNotificationRead.bind(null, note.id)}><button className="btn-secondary !min-h-8 !px-2 text-[10px]"><Check size={13} />Mark read</button></form>}
      </article>) : <div className="py-12 text-center"><Bell className="mx-auto text-ink/25" /><p className="mt-4 text-sm text-ink/50">No notifications yet.</p></div>}
    </section>
  </DashboardShell>;
}
