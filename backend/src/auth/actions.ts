"use server";

import { db } from "@db/client";
import { accessRequests, passwordSetupTokens, users } from "@db/schema";
import { createSession, dashboardForRole, destroySession, getSession, getWorkspaceView, setWorkspaceViewCookie, type WorkspaceView } from "@backend/auth/session";
import { deliverEmail, notify } from "@backend/notifications/service";
import { removeIdentityDocument, saveIdentityDocument, validateIdentityDocument } from "@backend/uploads/access-request-documents";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export type ActionState = { ok: boolean; message: string; reference?: string };

function passwordResetUrl(token: string) {
  const baseUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/set-password?token=${encodeURIComponent(token)}`;
}

export async function requestPasswordReset(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({ email: z.string().trim().email().transform((value) => value.toLowerCase()) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Enter a valid email address." };

  const [user] = await db.select({ id: users.id, email: users.email, fullName: users.fullName }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (!user) {
    return { ok: false, message: "No account was found for that email. If you are still waiting on approval, request access from the login page." };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  try {
    await db.delete(passwordSetupTokens).where(eq(passwordSetupTokens.userId, user.id));
    await db.insert(passwordSetupTokens).values({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = passwordResetUrl(rawToken);
    await deliverEmail({
      to: user.email,
      subject: "Reset your Trufeta password",
      body: `Hello ${user.fullName},\n\nUse the link below to set a new password for your Trufeta account. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you didn't request this change, you can ignore this email.`,
    });

    return { ok: true, message: "A reset link has been sent to your email." };
  } catch (error) {
    console.error("[auth][request-password-reset][failed]", { email: user.email, error });
    return { ok: false, message: "We could not send the reset email. Please try again in a moment." };
  }
}

export async function verifyPasswordResetToken(token: string): Promise<ActionState> {
  if (!token || token.length < 16) return { ok: false, message: "This link is invalid or has expired." };
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const [record] = await db.select({
    id: passwordSetupTokens.id,
    userId: passwordSetupTokens.userId,
    expiresAt: passwordSetupTokens.expiresAt,
    usedAt: passwordSetupTokens.usedAt,
    email: users.email,
  }).from(passwordSetupTokens).innerJoin(users, eq(users.id, passwordSetupTokens.userId)).where(eq(passwordSetupTokens.tokenHash, tokenHash)).limit(1);

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false, message: "This link is invalid or has expired." };
  }

  return { ok: true, message: "Token is valid.", reference: record.email };
}

export async function submitPasswordResetToken(token: string, password: string): Promise<ActionState> {
  if (!token || token.length < 16) return { ok: false, message: "This link is invalid or has expired." };
  if (password.length < 8) return { ok: false, message: "Use at least 8 characters." };

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const [record] = await db.select({
    id: passwordSetupTokens.id,
    userId: passwordSetupTokens.userId,
    expiresAt: passwordSetupTokens.expiresAt,
    usedAt: passwordSetupTokens.usedAt,
    userEmail: users.email,
  }).from(passwordSetupTokens).innerJoin(users, eq(users.id, passwordSetupTokens.userId)).where(eq(passwordSetupTokens.tokenHash, tokenHash)).limit(1);

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false, message: "This link is invalid or has expired." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash, mustChangePassword: false, isActive: true, updatedAt: new Date() }).where(eq(users.id, record.userId));
    await tx.update(passwordSetupTokens).set({ usedAt: new Date() }).where(eq(passwordSetupTokens.id, record.id));
  });

  return { ok: true, message: "Password updated successfully. You can sign in now." };
}

export async function changePassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await (await import("@backend/auth/session")).getSession();
  if (!session) return { ok: false, message: "Your session has ended. Please sign in again." };
  const parsed = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8, "Use at least 8 characters.") }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the password fields." };
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) return { ok: false, message: "Your current password is incorrect." };
  await db.update(users).set({ passwordHash: await bcrypt.hash(parsed.data.newPassword, 10), mustChangePassword: false, updatedAt: new Date() }).where(eq(users.id, session.userId));
  return { ok: true, message: "Password updated securely." };
}

// ---- Access requests (Modules 4 + 14) ---------------------------------------

const accessSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name."),
  email: z.string().trim().email("Enter a valid email address.").transform((value) => value.toLowerCase()),
  desiredRole: z.enum(["service_provider"]),
  phone: z.string().trim().min(8, "Enter a phone number.").max(30),
  businessName: z.string().trim().min(2, "Enter your studio or business name.").max(180),
  message: z.string().trim().max(1000).optional(),
});

export async function requestAccess(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = accessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your details." };
  const identityDocument = formData.get("identityDocument");
  const documentFile = identityDocument instanceof File ? identityDocument : null;
  if (parsed.data.desiredRole === "service_provider") {
    const documentError = validateIdentityDocument(documentFile);
    if (documentError) return { ok: false, message: documentError };
  }
  const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existingUser.length) return { ok: false, message: "An account already exists for this email. Try signing in." };
  const existingRequests = await db.select({ id: accessRequests.id, status: accessRequests.status }).from(accessRequests).where(eq(accessRequests.email, parsed.data.email));
  if (existingRequests.length) {
    const requestStatus = existingRequests[0]?.status ?? "pending";
    if (requestStatus === "pending") return { ok: true, message: "Your access request is already pending review. We’ll email you when there is an update." };
    if (requestStatus === "approved") return { ok: false, message: "An approved account already exists for this email. Try signing in." };
    return { ok: true, message: "A previous request for this email is already on file. We’ll email you when there is an update." };
  }
  const savedDocument = documentFile?.size ? await saveIdentityDocument(documentFile) : null;
  try {
    const insertResult = await db.insert(accessRequests).values({
      id: crypto.randomUUID(),
      ...parsed.data,
      identityDocumentPath: savedDocument?.path,
      identityDocumentName: savedDocument?.name,
    });
    console.info("[access-request][write]", {
      email: parsed.data.email,
      desiredRole: parsed.data.desiredRole,
      inserted: Boolean(insertResult),
      identityDocument: Boolean(savedDocument),
    });
  } catch (error) {
    if (savedDocument) await removeIdentityDocument(savedDocument.path);
    console.error("[access-request][write-failed]", {
      email: parsed.data.email,
      desiredRole: parsed.data.desiredRole,
      error,
    });
    return { ok: false, message: "We could not save your request right now. Please try again in a moment." };
  }
  // Pending requests alert reviewers only; applicants receive the decision email.
  const sendApplicantReceipt = false;
  if (sendApplicantReceipt) await deliverEmail({
    to: parsed.data.email,
    subject: "We received your Trufeta access request",
    body: `Hello ${parsed.data.fullName},\n\nWe’ve received your request to join Trufeta as a ${parsed.data.desiredRole}. Our trust team reviews every application manually — we’ll email you your credentials once approved.\n\n— The Trufeta team`,
  });
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  try {
    await Promise.all(admins.map((admin) => notify({
      userId: admin.id,
      title: "New access request awaiting review",
      body: `${parsed.data.fullName} requested ${parsed.data.desiredRole} access.`,
      href: "/admin/access-requests",
    })));
  } catch (err) {
    console.error('[access-request][notify-admins-failed]', { emailCounts: admins.length, error: err instanceof Error ? err.stack || err.message : String(err) });
    // Continue — admins might not get email but request is still saved for manual review.
  }
  revalidatePath("/admin");
  return { ok: true, message: "Request received. Our trust team will review it and reply by email." };
}

// ---- Session (Module 2) -----------------------------------------------------

export async function loginAction(formData: FormData) {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(6), next: z.string().optional() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/login?error=Check%20your%20email%20and%20password");
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1);
  if (!user || !user.isActive || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    redirect("/login?error=Those%20credentials%20do%20not%20match%20an%20active%20account");
  }
  const session = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role === "service_provider" ? "service_provider" as const : user.role === "admin" ? "admin" as const : "client" as const,
    isOrganizer: user.organizerVerificationStatus === "approved",
    organizerStatus: user.organizerVerificationStatus,
    mustChangePassword: user.mustChangePassword,
  };
  await createSession(session);
  const workspace = await getWorkspaceView();
  const safeNext = parsed.data.next?.startsWith("/") && !parsed.data.next.startsWith("//") ? parsed.data.next : dashboardForRole(session, workspace);
  redirect(safeNext);
}

/** Modal-friendly login: preserves validation errors in place while successful sign-in redirects. */
export async function loginWithPassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({ email: z.string().trim().email("Enter a valid email address.").transform((value) => value.toLowerCase()), password: z.string().min(6, "Enter your password.") }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your email and password." };
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (!user || !user.isActive || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return { ok: false, message: "Those credentials do not match an active account." };
  const session = {
    userId: user.id, email: user.email, fullName: user.fullName,
    role: user.role === "service_provider" ? "service_provider" as const : user.role === "admin" ? "admin" as const : "client" as const,
    isOrganizer: user.organizerVerificationStatus === "approved", organizerStatus: user.organizerVerificationStatus, mustChangePassword: user.mustChangePassword,
  };
  await createSession(session);
  const workspace = await getWorkspaceView();
  redirect(dashboardForRole(session, workspace));
}

export async function registerClient(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({
    fullName: z.string().trim().min(2, "Please enter your full name."),
    email: z.string().trim().email("Enter a valid email address.").transform((value) => value.toLowerCase()),
    password: z.string().min(8, "Use at least 8 characters."),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your details." };
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existing.length) return { ok: false, message: "An account already exists for this email. Try signing in." };
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const [user] = await db.insert(users).values({
    id: crypto.randomUUID(),
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    passwordHash,
    role: "client",
    organizerVerificationStatus: "not_requested",
    mustChangePassword: false,
    isActive: true,
  }).returning({ id: users.id, email: users.email, fullName: users.fullName });
  await createSession({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: "client",
    isOrganizer: false,
    organizerStatus: "not_requested",
    mustChangePassword: false,
  });
  await notify({
    userId: user.id,
    title: "Welcome to Trufeta",
    body: "Your client account is ready. Browse live events or buy tickets whenever you like.",
    href: "/client",
  });
  redirect("/client");
}

export async function setWorkspaceViewAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const view = String(formData.get("view") ?? "client") === "organiser" ? "organiser" : "client";
  if (view === "organiser" && !session.isOrganizer) redirect("/client");
  await setWorkspaceViewCookie(view as WorkspaceView);
  redirect(view === "organiser" ? "/dashboard" : "/client");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

// ---- Dev-only registration (guarded per spec Section 4) ---------------------

const devRegisterSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(6),
  role: z.enum(["admin", "client", "service_provider"]),
});

export async function devRegister(_: ActionState, formData: FormData): Promise<ActionState> {
  if (process.env.NODE_ENV === "production") return { ok: false, message: "Dev registration is disabled in production." };
  const parsed = devRegisterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid form." };
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existing.length) return { ok: false, message: "A user already exists with that email." };
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.insert(users).values({ id: crypto.randomUUID(), fullName: parsed.data.fullName, email: parsed.data.email, passwordHash, role: parsed.data.role });
  await notify({
    userId: (await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1))[0].id,
    title: "Welcome to Trufeta (dev)",
    body: `Your ${parsed.data.role} account was created via the dev tool.`,
    href: dashboardForRole(parsed.data.role),
  });
  return { ok: true, message: `Test ${parsed.data.role} account created. You can sign in now.` };
}
