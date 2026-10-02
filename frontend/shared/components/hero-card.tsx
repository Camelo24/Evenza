"use client";

import { motion } from "framer-motion";
import { BadgeCheck, CalendarDays, CircleCheckBig, Layers3 } from "lucide-react";

export function HeroCard() {
  return (
    <div className="relative mx-auto w-full max-w-[540px] lg:pt-8">
      <motion.div
        className="absolute -inset-8 -z-10 rounded-full bg-[#d4ff59]/10 blur-3xl"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="overflow-hidden rounded-[28px] border border-white/15 bg-[#e9eee9] p-3 text-[#101716] shadow-[0_32px_100px_rgba(0,0,0,.38)] sm:p-4"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex items-center justify-between rounded-2xl bg-[#101716] px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-[#d4ff59] text-[#101716]">
              <Layers3 size={15} />
            </span>
            <span className="text-xs font-bold">Event workspace</span>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold text-[#d4ff59]">
            LIVE
          </span>
        </div>
        <div className="mt-3 rounded-2xl bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#567267]">
                Upcoming event
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                Amina and Joel's reception
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-[#6b7772]">
                <CalendarDays size={13} /> Saturday, 14 December
              </p>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-[#edf8cb] text-[#5d7d10]">
              <CircleCheckBig size={20} />
            </span>
          </div>
          <div className="mt-5 rounded-xl border border-[#dbe4dc] bg-[#f8faf7] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold">Flora by Amie</p>
                <p className="mt-1 text-[10px] text-[#6b7772]">
                  Decor and floral design
                </p>
              </div>
              <BadgeCheck size={18} className="text-[#3f725d]" />
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#dfe7df]">
              <span className="block h-full w-2/3 rounded-full bg-[#3f725d]" />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-[#6b7772]">
              <span>Booking confirmed</span>
              <span>2 of 3 steps complete</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#f2f5f1] p-3">
              <p className="text-[10px] font-bold text-[#6b7772]">Amount protected</p>
              <p className="mt-1 text-lg font-bold">450,000 XAF</p>
            </div>
            <div className="rounded-xl bg-[#f2f5f1] p-3">
              <p className="text-[10px] font-bold text-[#6b7772]">Event date</p>
              <p className="mt-1 text-lg font-bold">14 Dec</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
