"use client";

import { markNotificationRead } from "@backend/notifications/actions";
import { Bell, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export type BellNotification = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell({ notifications, unreadCount }: { notifications: BellNotification[]; unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(unreadCount);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => setUnread(unreadCount), [unreadCount]);

  function openNotification(note: BellNotification) {
    setOpen(false);
    startTransition(async () => {
      if (!note.read) {
        await markNotificationRead(note.id);
        setUnread((count) => Math.max(0, count - 1));
      }
      const href = note.href?.startsWith("/") ? note.href : "/notifications";
      router.push(href);
      router.refresh();
    });
  }

  return <div className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} aria-expanded={open} className="relative grid size-9 place-items-center rounded-lg border border-ink/10 bg-white text-ink/55 transition hover:bg-ink/4 hover:text-ink">
      <Bell size={16} />
      {unread > 0 && <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-marigold px-1 text-[9px] font-bold leading-none text-ink" aria-hidden="true">{unread}</span>}
    </button>
    {open && <section className="absolute right-0 top-11 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-ink/10 bg-white text-ink shadow-[0_18px_50px_rgba(23,35,31,.18)]" aria-label="Notifications">
      <div className="flex items-center justify-between border-b border-ink/8 px-4 py-3"><div><h2 className="text-sm font-bold">Notifications</h2><p className="mt-0.5 text-[10px] text-ink/45">{unread ? `${unread} unread` : "You're all caught up"}</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="grid size-8 place-items-center rounded-full text-ink/45 hover:bg-paper hover:text-ink"><X size={15} /></button></div>
      <div className="max-h-[min(420px,60vh)] overflow-y-auto divide-y divide-ink/6">
        {notifications.length ? notifications.map((note) => <button key={note.id} type="button" disabled={pending} onClick={() => openNotification(note)} className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-paper/70 disabled:opacity-60">
          <span className={`mt-1.5 size-2 shrink-0 rounded-full ${note.read ? "bg-ink/15" : "bg-berry"}`} />
          <span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-3"><span className={`text-xs ${note.read ? "font-medium" : "font-bold"}`}>{note.title}</span>{note.read && <Check size={13} className="shrink-0 text-forest" />}</span><span className="mt-1 block text-[11px] leading-5 text-ink/55">{note.body}</span><time className="mt-1 block text-[9px] text-ink/35">{new Date(note.createdAt).toLocaleString("en-CM", { dateStyle: "medium", timeStyle: "short" })}</time></span>
        </button>) : <p className="px-4 py-8 text-center text-xs text-ink/45">No notifications yet.</p>}
      </div>
      <a href="/notifications" onClick={() => setOpen(false)} className="block border-t border-ink/8 px-4 py-3 text-center text-xs font-bold text-forest transition hover:bg-mint/40">View all notifications</a>
    </section>}
  </div>;
}
