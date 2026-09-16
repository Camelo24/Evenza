'use client';

import {
  submitPasswordResetToken,
  verifyPasswordResetToken,
  type ActionState,
} from '@backend/auth/actions';
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useActionState, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const initialState: ActionState = { ok: false, message: '' };

async function submitResetAction(_: ActionState, formData: FormData): Promise<ActionState> {
  return submitPasswordResetToken(String(formData.get('token') ?? ''), String(formData.get('password') ?? ''));
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-paper p-6 text-sm text-ink/60">Loading password reset...</div>}>
      <SetPasswordForm />
    </Suspense>
  );
}

function SetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [state, action, pending] = useActionState(submitResetAction, initialState);
  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    void (async () => {
      const result = await verifyPasswordResetToken(token);
      setStatus(result.ok ? 'valid' : 'invalid');
    })();
  }, [token]);

  useEffect(() => {
    if (state.ok) {
      const timer = window.setTimeout(() => router.push('/login?setup=success'), 1200);
      return () => window.clearTimeout(timer);
    }
  }, [state.ok, router]);

  const localError = password && confirm && password !== confirm ? 'Passwords do not match.' : '';

  if (status === 'checking') {
    return (
      <main className="grid min-h-screen place-items-center bg-paper p-6">
        <div className="paper-card max-w-md p-8 text-center">
          <p className="eyebrow text-berry">Password reset</p>
          <h1 className="display mt-3 text-3xl font-semibold">Checking your secure link…</h1>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-ink/55"><LoaderCircle className="animate-spin" size={16} />Validating token</div>
        </div>
      </main>
    );
  }

  if (status === 'invalid') {
    return (
      <main className="grid min-h-screen place-items-center bg-paper p-6">
        <div className="paper-card max-w-md p-8 text-center">
          <p className="eyebrow text-berry">Password reset</p>
          <h1 className="display mt-3 text-3xl font-semibold">This link is no longer valid.</h1>
          <p className="mt-4 text-sm leading-6 text-ink/55">It may have expired or already been used. Request a fresh reset email from the login page.</p>
          <Link href="/login" className="btn-ink mt-6 inline-flex w-full justify-center">Back to login <ArrowRight size={16} /></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper p-6">
      <div className="paper-card w-full max-w-md p-6 sm:p-8">
        <Link href="/login" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-ink/55"><ArrowLeft size={14} />Back to sign in</Link>
        <p className="eyebrow text-berry">Set a new password</p>
        <h1 className="display mt-3 text-4xl font-semibold">Choose a secure password.</h1>
        <form action={action} className="mt-7 grid gap-4">
          <input type="hidden" name="token" value={token} />
          <label>
            <span className="label-text">New password</span>
            <input className="field" type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required />
          </label>
          <label>
            <span className="label-text">Confirm password</span>
            <input className="field" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your new password" minLength={8} required />
          </label>
          {(localError || state.message) && (
            <p className={`rounded-xl px-3 py-2 text-sm ${state.ok ? 'bg-mint/20 text-forest' : 'bg-berry/10 text-berry'}`} role="alert">
              {localError || state.message}
            </p>
          )}
          <button className="btn-ink w-full" disabled={pending || !!localError || !password || !confirm}>
            {pending ? <><LoaderCircle className="animate-spin" size={16} />Setting password...</> : <><ShieldCheck size={16} />Set password</>}
          </button>
        </form>
        {state.ok && <div className="mt-5 flex items-center gap-2 rounded-xl bg-mint/20 px-3 py-2 text-sm text-forest"><CheckCircle2 size={16} />{state.message}</div>}
      </div>
    </main>
  );
}
