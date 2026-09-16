import { DashboardShell } from "@/shared/components/dashboard-shell";
import { setAccountAccess } from "@backend/admin/actions";
import { getAdminData } from "@backend/admin/queries";
import { requireRole } from "@backend/auth/session";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";
export default async function AdminUsersPage() {
  const session = await requireRole("admin"); const { users } = await getAdminData();
  return <DashboardShell role="admin" name={session.fullName} active="Access & users"><p className="eyebrow text-berry">Access governance</p><h1 className="display mt-2 text-4xl font-semibold">Users & access.</h1><p className="mt-3 text-sm text-ink/50">Approve requests from the queue, then suspend, ban, or restore marketplace accounts here.</p><section className="mt-8 rounded-[22px] border border-ink/10 bg-white p-5 sm:p-7"><div className="divide-y divide-ink/10">{users.length ? users.map((user) => <article key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-bold">{user.fullName}</p><p className="mt-1 text-[10px] text-ink/45">{user.email} · {user.role} · {user.isBanned ? "banned" : user.isActive ? "active" : "suspended"}</p></div>{user.role !== "admin" && <div className="flex gap-2"><form action={setAccountAccess}><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="action" value="activate"/><button className="btn-secondary !min-h-8 !px-2 text-[9px]">Restore</button></form><form action={setAccountAccess}><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="action" value="suspend"/><button className="btn-secondary !min-h-8 !px-2 text-[9px]">Suspend</button></form><form action={setAccountAccess}><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="action" value="ban"/><button className="btn-secondary !min-h-8 !border-berry/30 !px-2 !text-berry text-[9px]">Ban</button></form></div>}</article>) : <div className="py-12 text-center"><Users className="mx-auto text-ink/25"/><p className="mt-4 text-sm text-ink/50">No users yet.</p></div>}</div></section></DashboardShell>;
}
