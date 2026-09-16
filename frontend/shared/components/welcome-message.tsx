"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

export function WelcomeMessage({ name, userId }: { name: string; userId: string }) {
  const key = `trufeta-welcome:${userId}`;
  const [visible, setVisible] = useState(false);
  useEffect(() => { if (!localStorage.getItem(key)) setVisible(true); }, [key]);
  function dismiss() { localStorage.setItem(key, "seen"); setVisible(false); }
  return <AnimatePresence>{visible && <motion.section initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="mb-7 flex items-start gap-4 rounded-[20px] border border-marigold/35 bg-marigold/15 p-4 sm:p-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-marigold"><Sparkles size={18} /></span><div className="min-w-0 flex-1"><p className="font-bold">Welcome to Evenza, {name.split(" ")[0]}.</p><p className="mt-1 text-sm leading-6 text-ink/62">Your account is ready. Update your password to secure your account, then explore events or manage bookings.</p></div><button onClick={dismiss} className="text-ink/50 hover:text-ink" aria-label="Dismiss welcome message"><X size={17} /></button></motion.section>}</AnimatePresence>;
}
