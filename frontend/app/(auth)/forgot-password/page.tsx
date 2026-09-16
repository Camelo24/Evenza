"use client";

import { requestPasswordReset, type ActionState } from "@backend/auth/actions";
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

const initialState: ActionState = { ok: false, message: "" };

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <main className="grid min-h-screen bg-ink lg:grid-cols-[.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden lg:block">
        <img src="https://images.pexels.com/photos/37828092/pexels-photo-37828092.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1000" alt="African celebration portrait display" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/15 to-ink/10" />
        <div className="absolute bottom-0 p-12 text-white">
          <p className="eyebrow text-marigold">Account recovery</p>
          <h1 className="display mt-5 max-w-lg text-6xl font-semibold leading-[.95]">Reset access without losing your place.</h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/57">We’ll send a secure reset link to the email attached to your Evenza account.</p>
        </div>
      </section>

      <section className="flex min-h-screen flex-col bg-paper p-5 sm:p-9 lg:p-12">
        <div className="flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2 text-xs font-bold text-ink/50">
            <ArrowLeft size={14} />Back to sign in
          </Link>
        </div>

        <div className="mx-auto my-auto w-full max-w-md py-12">
          <p className="eyebrow text-berry">Need a new password?</p>
          <h2 className="display mt-3 text-5xl font-semibold">Recover your account.</h2>
          <p className="mt-4 text-sm leading-6 text-ink/50">Enter the email you use for Evenza. We’ll send a one-time reset link.</p>

          <form action={action} className="mt-8 grid gap-5">
            <label>
              <span className="label-text">Email address</span>
              <input className="field" type="email" name="email" placeholder="you@example.com" required />
            </label>

            {(state.message || state.ok) && (
              <p className={`rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-mint/20 text-forest" : "bg-berry/10 text-berry"}`} role="status">
                {state.ok && <CheckCircle2 className="mr-1 inline" size={14} />}
                {state.message}
              </p>
            )}

            <button className="btn-ink w-full" disabled={pending}>
              {pending ? (
                <>
                  <LoaderCircle className="mr-2 inline animate-spin" size={16} />
                  Sending reset link...
                </>
              ) : (
                <>
                  Send reset link
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 flex items-start gap-3 border-t border-ink/10 pt-6">
            <ShieldCheck className="mt-0.5 shrink-0 text-forest" size={17} />
            <p className="text-xs leading-5 text-ink/48">
              Need access approval instead? <Link href="/access-request" className="font-bold text-berry">Request access</Link>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
