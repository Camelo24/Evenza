"use client";

import { loginWithPassword, registerClient, type ActionState } from "@backend/auth/actions";
import { Eye, EyeOff, LoaderCircle, X } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

const initialState: ActionState = { ok: false, message: "" };
type Mode = "login" | "signup";

function SubmitButton({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  return <button className="auth-modal-submit" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" size={17} /> Please wait</> : mode === "login" ? "Log in" : "Create account"}</button>;
}

function AuthProgress({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return <div className="auth-progress-screen" role="status"><div className="auth-progress-dots"><i /><i /><i /></div><p>{mode === "login" ? "Login in progress." : "Creating your account."}</p></div>;
}

function PasswordField() {
  const [visible, setVisible] = useState(false);
  return <label className="auth-modal-label">Password<div className="auth-modal-password"><input name="password" type={visible ? "text" : "password"} minLength={6} required autoComplete="current-password" /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>;
}

function AuthForm({ mode, onClose }: { mode: Mode; onClose: () => void }) {
  const actionFn = mode === "login" ? loginWithPassword : registerClient;
  const [state, action] = useActionState(actionFn, initialState);
  return <form action={action} className="auth-modal-form">
    {mode === "signup" && <label className="auth-modal-label">Full name<input name="fullName" type="text" required autoComplete="name" /></label>}
    <label className="auth-modal-label">Email<input name="email" type="email" required autoComplete="email" /></label>
    <PasswordField />
    {state.message && <p role="status" className={`auth-modal-message ${state.ok ? "success" : "error"}`}>{state.message}</p>}
    <SubmitButton mode={mode} />
    <button type="button" className="auth-modal-cancel" onClick={onClose}>Cancel</button>
    <AuthProgress mode={mode} />
  </form>;
}

export function AuthModalTrigger({ mode, className, children }: { mode: Mode; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState<Mode>(mode);
  const title = currentMode === "login" ? "Log in" : "Create your account";
  return <>
    <button type="button" className={className} onClick={() => { setCurrentMode(mode); setOpen(true); }}>{children}</button>
    {open && <div className="auth-modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}><section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" onMouseDown={(event) => event.stopPropagation()}>
      <button className="auth-modal-close" type="button" aria-label="Close" onClick={() => setOpen(false)}><X size={21} /></button>
      <h2 id="auth-modal-title">{title}</h2>
      <p className="auth-modal-intro">{currentMode === "login" ? "Welcome back. Log in to continue planning." : "Join Evenza to discover events and book with confidence."}</p>
      <AuthForm key={currentMode} mode={currentMode} onClose={() => setOpen(false)} />
      <p className="auth-modal-switch">{currentMode === "login" ? "New to Evenza?" : "Already have an account?"} <button type="button" onClick={() => setCurrentMode(currentMode === "login" ? "signup" : "login")}>{currentMode === "login" ? "Sign up" : "Log in"}</button></p>
    </section></div>}
  </>;
}
