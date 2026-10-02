import { DashboardContent } from "@/shared/components/dashboard-content";
import { AccountPanel } from "@/shared/components/account-panel";
import { WelcomeMessage } from "@/shared/components/welcome-message";
import { AiAssistant } from "@/shared/components/ai-assistant";
import { logoutAction, setWorkspaceViewAction } from "@backend/auth/actions";
import { countUnreadNotifications, listNotifications } from "@backend/notifications/service";
import { NotificationBell } from "@/shared/components/notification-bell";
import { AssistantSidebarButton } from "@/shared/components/assistant-sidebar-button";
import { getSession } from "@backend/auth/session";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  CreditCard,
  Globe,
  LayoutDashboard,
  LogOut,
  Settings,
  MapPin,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SidebarParentLink } from "@/shared/components/sidebar-parent-link";

type ShellRole = "admin" | "client" | "organiser" | "service_provider";

/**
 * NavItem is a tuple `[label, href, Icon]` for a leaf, or
 * `[label, href, Icon, children]` when it has sub-nav entries.
 * Using an optional 4th element (rather than a union of tuples) keeps
 * TypeScript's inference happy for the mixed `menus` array literals.
 */
type NavChildren = ReadonlyArray<readonly [string, string]>;
type NavItem = readonly [string, string, LucideIcon, NavChildren?];
type NavGroup = readonly [string, ReadonlyArray<NavItem>];

const getChildren = (item: NavItem): NavChildren | undefined => item[3];

const menus: Record<ShellRole, ReadonlyArray<NavGroup>> = {
  organiser: [
    ["Overview", [
      ["Overview", "/dashboard", LayoutDashboard],
      ["Payments", "/dashboard/payments", CreditCard],
    ]],
    ["Manage", [
      ["Events", "/events", CalendarDays, [
        ["My events", "/events"],
        ["Applicants", "/applicants"],
      ]],
      ["Find services", "/vendors", Search],
      ["Messages", "/dashboard/messages", MessageSquareText],
    ]],
    ["Account", [
      ["Profile", "/dashboard/profile", Users],
      ["Settings", "/dashboard/settings", Settings],
    ]],
    ["Help", [["Notifications", "/notifications", Bell], ["Evenza AI", "#assistant", Sparkles]]],
  ],
  service_provider: [
    ["Overview", [
      ["Overview", "/vendor/dashboard", LayoutDashboard],
      ["Payouts", "/vendor/dashboard/payouts", CreditCard],
    ]],
    ["Business", [
      ["Bookings", "/vendor/dashboard/bookings", CalendarDays],
      ["Services", "/vendor/dashboard/services", Store],
      ["Messages", "/vendor/dashboard/messages", MessageSquareText],
    ]],
    ["Attend", [
      ["Find events", "/vendor/dashboard/events", Search],
      ["My tickets", "/vendor/dashboard/tickets", Ticket],
    ]],
    ["Account", [
      ["Profile", "/vendor/dashboard/profile", Users],
      ["Settings", "/vendor/dashboard/settings", Settings],
    ]],
    ["Help", [["Notifications", "/notifications", Bell], ["Evenza AI", "#assistant", Sparkles]]],
  ],
  admin: [
    ["Overview", [
      ["Command centre", "/admin", LayoutDashboard],
      ["Platform health", "/admin/platform-health", Bell],
    ]],
    ["Marketplace", [
      ["Access & users", "/admin/access-review", Users],
      ["Service provider trust", "/admin/vendors", ShieldCheck],
      ["Vendor locations", "/admin/vendor-locations", MapPin],
    ]],
    ["Operations", [
      ["Booking monitor", "/admin/bookings", CalendarDays],
      ["Transactions", "/admin/transactions", CreditCard],
      ["Disputes", "/admin/disputes", MessageSquareText],
    ]],
    ["Account", [
      ["Profile", "/admin/profile", Users],
      ["Settings", "/admin/settings", Settings],
    ]],
    ["Help", [["Notifications", "/notifications", Bell], ["Evenza AI", "#assistant", Sparkles]]],
  ],
  client: [
    ["Overview", [
      ["My tickets", "/client", Ticket],
    ]],
    ["Discover", [
      ["Discover events", "/client/events", Search],
    ]],
    ["Account", [
      ["Profile", "/client/profile", Users],
      ["Settings", "/client/settings", Settings],
    ]],
    ["Help", [["Notifications", "/notifications", Bell], ["Evenza AI", "#assistant", Sparkles]]],
  ],
};

const roleHome: Record<ShellRole, string> = {
  admin: "/admin",
  organiser: "/dashboard",
  service_provider: "/vendor/dashboard",
  client: "/client",
};

const roleLabel: Record<ShellRole, string> = {
  admin: "Admin",
  organiser: "Organiser",
  service_provider: "Service provider",
  client: "Client",
};

/** Evenza three-bar brand glyph, tinted via currentColor. */
function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`grid place-items-center rounded-lg bg-[#d4ff59] text-[#101716] ${className}`} aria-hidden="true">
      <span className="flex flex-col gap-1">
        <span className="h-0.5 w-4 rounded-full bg-current" />
        <span className="h-0.5 w-2.5 rounded-full bg-current" />
        <span className="h-0.5 w-4 rounded-full bg-current" />
      </span>
    </span>
  );
}

export async function DashboardShell({ role, name, active = "Overview", children, allowViewSwitch = false }: { role: ShellRole; name: string; active?: string; children: ReactNode; allowViewSwitch?: boolean }) {
  const session = await getSession();
  const [recentNotifications, unreadNotificationCount] = await Promise.all([
    session ? listNotifications(session.userId, 8) : Promise.resolve([]),
    session ? countUnreadNotifications(session.userId) : Promise.resolve(0),
  ]);
  const notificationItems = recentNotifications.map((note) => ({
    id: note.id,
    title: note.title,
    body: note.body,
    href: note.href,
    read: note.read,
    createdAt: note.createdAt.toISOString(),
  }));
  const groups = menus[role];
  // Mobile header nav flattens parents into their children so Applicants/My
  // Events both remain reachable without a dropdown on small screens.
  const flat: ReadonlyArray<readonly [string, string]> = groups.flatMap(([, items]) =>
    items.flatMap((item): ReadonlyArray<readonly [string, string]> => {
      const kids = getChildren(item);
      return kids && kids.length ? kids : [[item[0], item[1]] as const];
    }),
  );
  const isOrganizer = session?.isOrganizer ?? false;
  const currentView = role === "organiser" ? "organiser" : "client";

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-ink lg:grid lg:grid-cols-[250px_1fr]">
      {/* Sidebar */}
      <aside className="sticky top-0 z-30 hidden h-screen flex-col border-r border-ink/8 bg-white lg:flex">
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-ink/8 px-5">
          <BrandMark className="size-9" />
          <span className="logo-type text-[1.35rem] font-semibold text-[#101716]">Evenza</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map(([group, items]) => (
            <div key={group} className="mb-5 last:mb-0">
              <p className="eyebrow px-3 pb-2 text-ink/35">{group}</p>
              <div className="grid gap-0.5">
                {items.map((item) => {
                  const [label, href, Icon] = item;
                  if (href === "#assistant") return <AssistantSidebarButton key={label} label={label} />;
                  const kids = getChildren(item);
                  if (kids && kids.length) {
                    return <SidebarParentLink key={label} label={label} href={href} icon={<Icon size={16} />} subItems={kids} />;
                  }
                  const isActive = active === label;
                  return (
                    <Link
                      key={label}
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition ${
                        isActive ? "bg-ink/6 font-semibold text-ink" : "text-ink/70 hover:bg-ink/4 hover:text-ink"
                      }`}
                    >
                      <Icon size={16} className={isActive ? "text-ink" : "text-ink/55"} />
                      {label}
                      {isActive && <span className="ml-auto size-1.5 rounded-full bg-[#a4e600]" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-ink/8 p-3">
          {allowViewSwitch && isOrganizer ? (
            <form action={setWorkspaceViewAction} className="mb-2">
              <input type="hidden" name="view" value={currentView === "organiser" ? "client" : "organiser"} />
              <button type="submit" className="w-full rounded-lg border border-ink/10 bg-[#f5f6f8] px-3 py-2 text-left text-xs font-semibold text-ink/70 transition hover:bg-ink/6 hover:text-ink">
                {currentView === "organiser" ? "← Switch to client view" : "Switch to organiser view →"}
              </button>
            </form>
          ) : null}
          <div className="grid gap-0.5">
            <Link href={role === "service_provider" ? "/vendor/dashboard" : "/"} className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-ink/55 transition hover:bg-ink/4 hover:text-ink">
              <Globe size={15} /> {role === "service_provider" ? "Dashboard overview" : "Back to Evenza"}
            </Link>
            <form action={logoutAction}>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-ink/55 transition hover:bg-ink/4 hover:text-ink">
                <LogOut size={15} /> Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-ink/8 bg-white/85 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
            <Link href={roleHome[role]} className="flex items-center gap-2 lg:hidden" aria-label="Evenza home">
              <BrandMark className="size-8" />
            </Link>

            <label className="relative hidden max-w-md flex-1 md:block">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
              <input
                type="search"
                placeholder="Search events, bookings, services…"
                aria-label="Search"
                className="h-9 w-full rounded-lg border border-transparent bg-[#f2f3f5] pl-9 pr-3 text-[13px] text-ink outline-none transition placeholder:text-ink/40 focus:border-ink/15 focus:bg-white"
              />
            </label>

            <div className="ml-auto flex items-center gap-2">
              <NotificationBell notifications={notificationItems} unreadCount={unreadNotificationCount} />
              <AccountPanel name={name} email={session?.email ?? ""} role={role} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-ink/6 px-4 py-2.5 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-[13px] text-ink/50" aria-label="Breadcrumb">
              <Link href={roleHome[role]} className="transition hover:text-ink hover:underline">{roleLabel[role]}</Link>
              <ChevronRight size={14} className="text-ink/30" />
              <span className="font-semibold text-ink">{active}</span>
            </nav>
          </div>

          <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-ink/6 px-3 py-2 lg:hidden">
            {flat.map(([label, href]) => href === "#assistant" ? <AssistantSidebarButton key={label} label={label} compact /> : (
              <Link key={label} href={href} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition ${active === label ? "bg-berry text-white" : "bg-[#f2f3f5] text-ink/70 hover:text-ink"}`}>
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <DashboardContent>
          {role !== "admin" && session ? <WelcomeMessage name={name} userId={session.userId} /> : null}
          {children}
        </DashboardContent>
      </div>

      <AiAssistant />
    </div>
  );
}
