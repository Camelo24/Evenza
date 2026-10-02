"use client";

import { registerClient } from "@backend/auth/actions";
import { Logo } from "@/shared/components/logo";
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ActionState } from "@backend/auth/actions";
import { useActionState } from "react";

const initialState: ActionState = { ok: false, message: "" };

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerClient, initialState);
  return (
    <main className="grid min-h-screen bg-[#101716] text-white lg:grid-cols-[.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden lg:block">
        <img src="https://images.pexels.com/photos/37828092/pexels-photo-37828092.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1000" alt="African celebration portrait display" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101716] via-[#101716]/15 to-[#101716]/10" />
        <div className="absolute bottom-0 p-12 text-white">
          <p className="eyebrow flex items-center gap-2 text-[#d4ff59]"><span className="size-1.5 rounded-full bg-[#d4ff59]" /> Join Evenza</p>
          <h1 className="display mt-5 max-w-lg text-6xl font-semibold leading-[.95]">Your next fête starts here.</h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/57">Create a client account to browse events, buy tickets, and book trusted service providers.</p>
        </div>
      </section>
      <section className="flex min-h-screen flex-col bg-[#101716] p-5 sm:p-9 lg:p-12">
        <div className="flex items-center justify-between"><Logo /><Link href="/" className="flex items-center gap-2 text-xs font-bold text-white/50"><ArrowLeft size={14} />Home</Link></div>
        <div className="mx-auto my-auto w-full max-w-md py-12">
          <p className="eyebrow text-[#d4ff59]">Create account</p>
          <h2 className="display mt-3 text-5xl font-semibold">Join as a client.</h2>
          <p className="mt-4 text-sm leading-6 text-white/50">Browse events, buy tickets, and book trusted service providers.</p>
          <form action={action} className="mt-8 grid gap-5">
            <label><span className="label-text text-white/70">Full name</span><input className="field bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#d4ff59]" type="text" name="fullName" placeholder="Your full name" required /></label>
            <label><span className="label-text text-white/70">Email address</span><input className="field bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#d4ff59]" type="email" name="email" placeholder="you@example.com" required /></label>
            <label><span className="label-text text-white/70">Password</span><input className="field bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#d4ff59]" type="password" name="password" placeholder="At least 8 characters" minLength={8} required /></label>
            {state.message && <p className={`rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{state.ok && <CheckCircle2 className="mr-1 inline" size={14} />}{state.message}</p>}
            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#d4ff59] px-5 text-sm font-bold text-[#101716] transition hover:-translate-y-0.5 hover:bg-[#e2ff8e] w-full" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" size={16} /> Creating account</> : <> Create account</>}</button>
          </form>
          <p className="mt-4 text-center text-xs text-white/50">Already have an account? <Link href="/login" className="font-bold text-[#d4ff59]">Sign in</Link></p>
          <p className="mt-3 text-center text-[10px] text-white/60">By creating an account, you agree to our <Link href="/terms" className="text-[#d4ff59] font-semibold hover:underline">Terms and Conditions</Link> and <Link href="/privacy" className="text-[#d4ff59] font-semibold hover:underline">Privacy Policy</Link></p>
        </div>
        <p className="text-center text-[10px] text-white/35"><ShieldCheck className="mr-1 inline text-[#d4ff59]" size={10} />Open self-registration for clients</p>
      </section>
    </main>
  );
}
