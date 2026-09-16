import { Logo } from "@/shared/components/logo";
import { DashboardContent } from "@/shared/components/dashboard-content";
import { AccountPanel } from "@/shared/components/account-panel";
import { WelcomeMessage } from "@/shared/components/welcome-message";
import { logoutAction, setWorkspaceViewAction } from "@backend/auth/actions";
import { getSession } from "@backend/auth/session";
import { Bell, CalendarDays, ChevronRight, CircleUserRound, CreditCard, LayoutDashboard, LogOut, MessageSquareText, Search, Settings, ShieldCheck, Store, Ticket, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type ShellRole = "admin" | "client" | "organiser" | "service_provider";

type MenuItem = readonly [string, string, typeof LayoutDashboard];
const menus: Record<ShellRole, ReadonlyArray<MenuItem>> = {
  organiser: [
    ["Overview", "/dashboard", LayoutDashboard],
    ["My events", "/events", CalendarDays],
    ["Find services", "/vendors", Search],
    ["Messages", "/dashboard/messages", MessageSquareText],
    ["Payments", "/dashboard/payments", CreditCard],
  ],
  service_provider: [
    ["Overview", "/vendor/dashboard", LayoutDashboard],
    ["Bookings", "/vendor/dashboard/bookings", CalendarDays],
    ["Services", "/vendor/dashboard/services", Store],
    ["Messages", "/vendor/dashboard/messages", MessageSquareText],
    ["Payouts", "/vendor/dashboard/payouts", CreditCard],
  ],
  admin: [
    ["Command centre", "/admin", LayoutDashboard],
    ["Access & users", "/admin/access-review", Users],
    ["Booking monitor", "/admin/bookings", CalendarDays],
    ["Service provider trust", "/admin/vendors", ShieldCheck],
    ["Transactions", "/admin/transactions", CreditCard],
    ["Disputes", "/admin/disputes", MessageSquareText],
    ["Platform health", "/admin/platform-health", Bell],
  ],
  client: [
    ["My tickets", "/client", Ticket],
    ["Discover events", "/client/events", Search],
    ["Notifications", "/client/notifications", Bell],
  ],
};

export async function DashboardShell({ role, name, active = "Overview", children, allowViewSwitch = false }: { role: ShellRole; name: string; active?: string; children: ReactNode; allowViewSwitch?: boolean }) {
  const session = await getSession();
  const menu = menus[role];
  const isOrganizer = session?.isOrganizer ?? false;
  const currentView = role === "organiser" ? "organiser" : "client";
  return (
    <div className="min-h-screen bg-[#f2eee5] lg:grid lg:grid-cols-[258px_1fr]">
      <aside className="hidden min-h-screen border-r border-white/8 bg-ink p-5 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <Logo inverse />
        <p className="eyebrow mt-9 text-white/30">{role === "service_provider" ? "Service provider" : role === "client" ? "Client" : role === "organiser" ? "Organiser" : role} workspace</p>
        {allowViewSwitch && isOrganizer ? (
          <div className="mt-4 grid gap-1">
            <form action={setWorkspaceViewAction}>
              <input type="hidden" name="view" value={currentView === "organiser" ? "client" : "organiser"} />
              <button type="submit" className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition ${currentView === "organiser" ? "bg-marigold text-ink" : "text-white/72 hover:bg-white/10"}`}>
                {currentView === "organiser" ? "← Switch to client view" : "Switch to organiser view →"}
              </button>
            </form>
          </div>
        ) : null}
        <nav className="mt-4 grid gap-1">{menu.map(([label, href, Icon]) => <Link key={label} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active === label ? "bg-white/10 font-semibold text-white" : "text-white/52 hover:bg-white/5 hover:text-white"}`}><Icon size={17}/>{label}{active === label && <ChevronRight className="ml-auto" size={14}/>}</Link>)}</nav>
        <div className="mt-auto border-t border-white/10 pt-4"><Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-white/45 hover:text-white"><Settings size={15}/>Back to Evenza</Link><form action={logoutAction}><button className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-white/45 hover:text-white"><LogOut size={15}/>Sign out</button></form></div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur-xl">
          <div className="flex h-[72px] items-center justify-between px-4 sm:px-7 lg:px-9">
            <div className="lg:hidden"><Logo /></div>
            <div className="hidden lg:block">
              <p className="text-xs text-ink/42">Welcome back</p>
              <p className="text-sm font-bold">{name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="grid size-10 place-items-center rounded-full border border-ink/12 bg-white transition hover:-translate-y-0.5 hover:shadow-md" aria-label="Notifications"><Bell size={16}/></button>
              {role === "admin" ? <span className="grid size-10 place-items-center rounded-full bg-marigold"><CircleUserRound size={19}/></span> : <AccountPanel name={name} email={session?.email ?? ""} role={role} />}
            </div>
          </div>
          {/* Breadcrumb / active page */}
          <div className="px-4 sm:px-7 lg:px-9 py-3">
            <nav className="flex items-center gap-3 text-sm text-ink/55" aria-label="Breadcrumb">
               <Link href={role === 'admin' ? '/admin' : role === 'organiser' ? '/dashboard' : role === 'service_provider' ? '/vendor/dashboard' : '/client'} className="hover:underline">{role === 'admin' ? 'Admin' : role === 'organiser' ? 'Organiser' : role === 'service_provider' ? 'Service provider' : 'Client'}</Link>
              <ChevronRight size={14} />
              <span className="text-ink/900 font-semibold">{active}</span>
            </nav>
          </div>
          <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:hidden">{menu.map(([label, href]) => <Link key={label} href={href} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs ${active === label ? "bg-ink text-white" : "bg-white text-ink/55"}`}>{label}</Link>)}</nav>
        </header>
        <DashboardContent>{role !== "admin" && session ? <WelcomeMessage name={name} userId={session.userId} /> : null}{children}</DashboardContent>
      </div>
    </div>
  );
}
