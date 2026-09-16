"use client";

import { changePassword, logoutAction, type ActionState } from "@backend/auth/actions";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Camera, CheckCircle2, ChevronDown, ChevronUp, KeyRound, LogOut, Mail, Settings, ShieldCheck, UserRound, Users, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

const initialState: ActionState = { ok: false, message: "" };

export function AccountPanel({ name, email, role, variant = "panel" }: { name: string; email: string; role: string; variant?: "panel" | "menu" }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [state, action, pending] = useActionState(changePassword, initialState);
  const reducedMotion = useReducedMotion();
  const initial = name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => {
    setMounted(true);
    const cachedAvatar = localStorage.getItem(`trufeta-avatar:${email}`);
    setAvatar(cachedAvatar);
  }, [email]);

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : previousOverflow;
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted, open]);

  function updateAvatar(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2_000_000) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result);
      setAvatar(value);
      localStorage.setItem(`trufeta-avatar:${email}`, value);
    };
    reader.readAsDataURL(file);
  }

  if (variant === "menu") {
    return <div className="client-account-menu">
      <button className="client-account-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" aria-label="Open account menu">
        <span>{avatar ? <img src={avatar} alt="" className="size-full object-cover" draggable={false} /> : initial.slice(0, 1)}</span>{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      <AnimatePresence>{open && <motion.div role="menu" className="client-account-dropdown" initial={reducedMotion ? false : { opacity: 0, y: -8, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .98 }} transition={{ duration: .16 }}>
        <Link href="/client" role="menuitem" onClick={() => setOpen(false)}><CalendarDays size={19} />Your events</Link>
        <Link href="/client/events" role="menuitem" onClick={() => setOpen(false)}><Users size={19} />Your groups</Link>
        <Link href="/client" role="menuitem" onClick={() => setOpen(false)}><UserRound size={19} />View profile</Link>
        <div className="client-account-divider" />
        <Link href="/client" role="menuitem" onClick={() => setOpen(false)}><Settings size={19} />Settings</Link>
        <form action={logoutAction} onSubmit={() => setLoggingOut(true)}><button type="submit" role="menuitem"><LogOut size={19} />Log out</button></form>
      </motion.div>}</AnimatePresence>
      {loggingOut && <div className="auth-progress-screen" role="status"><div className="auth-progress-dots"><i /><i /><i /></div><p>Logging out</p></div>}
    </div>;
  }

  return <>
    <button className="grid size-10 place-items-center overflow-hidden rounded-full bg-marigold text-ink ring-2 ring-transparent transition hover:-translate-y-0.5 hover:ring-ink/15" onClick={() => setOpen(true)} aria-label="Open account quick actions">{avatar ? <img src={avatar} alt="" className="size-full object-cover" loading="eager" draggable={false} /> : <UserRound size={19} />}</button>
    {mounted && createPortal(<AnimatePresence>{open && <><motion.button aria-label="Close account panel" className="fixed inset-0 z-100 bg-ink/30 backdrop-blur-[2px]" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: "easeOut" }} />
      <motion.aside role="dialog" aria-modal="true" aria-label="Account quick actions" className="fixed inset-y-0 right-0 z-110 flex w-full max-w-md flex-col overflow-hidden border-l border-ink/10 bg-paper p-5 shadow-[-24px_0_70px_rgba(23,35,31,.18)] sm:p-7" initial={reducedMotion ? false : { opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 32 }} transition={{ duration: 0.2, ease: "easeOut" }}>
        <div className="flex items-center justify-between"><div><p className="eyebrow text-berry">Account</p><h2 className="display mt-2 text-2xl font-semibold">Quick actions</h2></div><button className="grid size-10 place-items-center rounded-full border border-ink/12 bg-white transition hover:bg-ink hover:text-white" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button></div>
        <div className="mt-8 flex-1 overflow-y-auto pr-1">
          <section className="rounded-[22px] bg-ink p-5 text-white"><div className="flex items-center gap-4"><label className="relative grid size-16 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl bg-marigold text-ink"><input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => updateAvatar(event.target.files?.[0])} />{avatar ? <img src={avatar} alt="Your profile" className="size-full object-cover" loading="eager" draggable={false} /> : <span className="font-bold">{initial}</span>}<span className="absolute inset-x-0 bottom-0 grid h-6 place-items-center bg-ink/65 text-white"><Camera size={13} /></span></label><div><p className="font-bold">{name}</p><p className="mt-1 text-xs text-white/55">{role} workspace</p><p className="mt-2 text-[10px] text-marigold">Tap photo to update</p></div></div></section>
          <section className="mt-5 rounded-[22px] border border-ink/10 bg-white p-5"><p className="eyebrow text-ink/42">Account details</p><div className="mt-4 flex items-start gap-3 text-sm"><Mail className="mt-0.5 text-berry" size={16} /><div><p className="font-semibold">{email}</p><p className="mt-1 text-xs text-ink/48">Verified account email</p></div></div><div className="mt-4 flex items-start gap-3 text-sm"><ShieldCheck className="mt-0.5 text-forest" size={16} /><div><p className="font-semibold">Protected access</p><p className="mt-1 text-xs text-ink/48">Your session is secured with HTTP-only cookies.</p></div></div></section>
          <section className="mt-5 rounded-[22px] border border-ink/10 bg-white p-5"><div className="flex items-center gap-2"><KeyRound className="text-berry" size={17} /><div><p className="font-bold">Change password</p><p className="mt-1 text-xs text-ink/48">Use a unique password with at least 8 characters.</p></div></div><form action={action} className="mt-5 grid gap-3"><input className="field" type="password" name="currentPassword" placeholder="Current password" required /><input className="field" type="password" name="newPassword" minLength={8} placeholder="New password" required />{state.message && <p role="status" className={`rounded-xl px-3 py-2 text-xs ${state.ok ? "bg-mint text-forest" : "bg-berry/10 text-berry"}`}>{state.ok && <CheckCircle2 className="mr-1 inline" size={13} />}{state.message}</p>}<button className="btn-ink w-full" disabled={pending}>{pending ? "Updating securely…" : "Update password"}</button></form></section>
        </div>
      </motion.aside></>}</AnimatePresence>, document.body)}
  </>;
}
