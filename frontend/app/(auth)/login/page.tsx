import { loginAction } from "@backend/auth/actions";
import { Logo } from "@/shared/components/logo";
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen bg-[#101716] text-white lg:grid-cols-[.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden lg:block">
        <img src="https://images.pexels.com/photos/37828092/pexels-photo-37828092.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1000" alt="African celebration portrait display" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101716] via-[#101716]/15 to-[#101716]/10" />
        <div className="absolute bottom-0 p-12 text-white">
          <p className="eyebrow flex items-center gap-2 text-[#d4ff59]"><span className="size-1.5 rounded-full bg-[#d4ff59]" /> Credential-gated by design</p>
          <h1 className="display mt-5 max-w-lg text-6xl font-semibold leading-[.95]">Trust begins before the first booking.</h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/57">Every Evenza account belongs to a person or business reviewed by our team.</p>
        </div>
      </section>
      <section className="flex min-h-screen flex-col bg-[#101716] p-5 sm:p-9 lg:p-12">
        <div className="flex items-center justify-between"><Logo /><Link href="/" className="flex items-center gap-2 text-xs font-bold text-white/50"><ArrowLeft size={14} />Home</Link></div>
        <div className="mx-auto my-auto w-full max-w-md py-12">
          <p className="eyebrow text-[#d4ff59]">Welcome back</p>
          <h2 className="display mt-3 text-5xl font-semibold">Sign in to Evenza.</h2>
          <p className="mt-4 text-sm leading-6 text-white/50">Sign in with your email and password.</p>
          <form action={loginAction} className="mt-8 grid gap-5">
            <input type="hidden" name="next" value={params.next ?? ""} />
            <label><span className="label-text text-white/70">Email address</span><input className="field bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#d4ff59]" type="email" name="email" placeholder="you@example.com" required /></label>
            <label><span className="label-text text-white/70">Password</span><input className="field bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#d4ff59]" type="password" name="password" placeholder="Your issued password" required /></label>
            {params.error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{params.error}</p>}
            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#d4ff59] px-5 text-sm font-bold text-[#101716] transition hover:-translate-y-0.5 hover:bg-[#e2ff8e] w-full">Sign in securely <ArrowRight size={16} /></button>
          </form>
          <div className="mt-4 text-right">
            <Link href="/forgot-password" className="text-sm font-semibold text-[#d4ff59] hover:underline">Forgot password?</Link>
          </div>
          <div className="mt-7 flex items-start gap-3 border-t border-white/10 pt-6"><ShieldCheck className="mt-0.5 shrink-0 text-[#d4ff59]" size={17} /><p className="text-xs leading-5 text-white/48">Don’t have an account? <Link href="/register" className="font-bold text-[#d4ff59]">Create an account</Link> or <Link href="/access-request" className="font-bold text-[#d4ff59]">request service provider access</Link>.</p></div>
        </div>
        <p className="text-center text-[10px] text-white/35"><LockKeyhole className="mr-1 inline" size={10} />Secure, HTTP-only session</p>
      </section>
    </main>
  );
}
