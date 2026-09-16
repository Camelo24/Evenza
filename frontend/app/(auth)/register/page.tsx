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
    <main className="grid min-h-screen bg-ink lg:grid-cols-[.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden lg:block">
        <img src="https://images.pexels.com/photos/37828092/pexels-photo-37828092.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1000" alt="African celebration portrait display" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/15 to-ink/10" />
        <div className="absolute bottom-0 p-12 text-white">
          <p className="eyebrow text-marigold">Join Evenza</p>
          <h1 className="display mt-5 max-w-lg text-6xl font-semibold leading-[.95]">Your next fête starts here.</h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/57">Create a client account to browse events, buy tickets, and book trusted service providers.</p>
        </div>
      </section>
      <section className="flex min-h-screen flex-col bg-paper p-5 sm:p-9 lg:p-12">
        <div className="flex items-center justify-between"><Logo /><Link href="/" className="flex items-center gap-2 text-xs font-bold text-ink/50"><ArrowLeft size={14} />Home</Link></div>
        <div className="mx-auto my-auto w-full max-w-md py-12">
          <p className="eyebrow text-berry">Create account</p>
          <h2 className="display mt-3 text-5xl font-semibold">Join as a client.</h2>
          <p className="mt-4 text-sm leading-6 text-ink/50">Browse events, buy tickets, and book trusted service providers.</p>
          <form action={action} className="mt-8 grid gap-5">
            <label><span className="label-text">Full name</span><input className="field" type="text" name="fullName" placeholder="Your full name" required /></label>
            <label><span className="label-text">Email address</span><input className="field" type="email" name="email" placeholder="you@example.com" required /></label>
            <label><span className="label-text">Password</span><input className="field" type="password" name="password" placeholder="At least 8 characters" minLength={8} required /></label>
            {state.message && <p className={`rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-mint text-forest" : "bg-berry/10 text-berry"}`}>{state.ok && <CheckCircle2 className="mr-1 inline" size={14} />}{state.message}</p>}
            <button className="btn-ink w-full" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" size={16} /> Creating account</> : <> Create account</>}</button>
          </form>
          <p className="mt-4 text-center text-xs text-ink/50">Already have an account? <Link href="/login" className="font-bold text-berry">Sign in</Link></p>
        </div>
        <p className="text-center text-[10px] text-ink/35"><ShieldCheck className="mr-1 inline" size={10} />Open self-registration for clients</p>
      </section>
    </main>
  );
}
