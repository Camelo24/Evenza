"use server";

import { db } from "@db/client";
import { accessRequests, organizerApplications, users, vendorProfiles } from "@db/schema";
import type { ActionState } from "@backend/auth/actions";
import { requireRole } from "@backend/auth/session";
import { deliverEmail, notify } from "@backend/notifications/service";
import { saveIdentityDocument } from "@backend/uploads/access-request-documents";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ---- Module 13/14: access-request approval or rejection ---------------------

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  return Array.from(randomBytes(16), (byte) => alphabet[byte % alphabet.length]).join("");
}

export async function submitOrganizerApplication(_: ActionState, formData: FormData) {
  const session = await requireRole("client");
  const parsed = z.object({ businessName: z.string().trim().min(2, "Enter your business or organization name.").max(180), message: z.string().trim().max(1000).optional() }).parse(Object.fromEntries(formData));
  const document = formData.get("identityDocument");
  const file = document instanceof File ? document : null;
  const savedDocument = file?.size ? await saveIdentityDocument(file) : null;
  const [existing] = await db.select().from(organizerApplications).where(eq(organizerApplications.userId, session.userId)).limit(1);
  if (existing && existing.status === "pending") return { ok: true, message: "Your organizer application is already pending review." };
  if (existing && existing.status === "approved") return { ok: false, message: "You are already an approved organizer." };
  await db.insert(organizerApplications).values({
    id: randomUUID(),
    userId: session.userId,
    businessName: parsed.businessName,
    message: parsed.message || null,
    status: "pending",
    documentPath: savedDocument?.path ?? null,
    documentName: savedDocument?.name ?? null,
  }).onConflictDoNothing();
  await db.update(users).set({ organizerVerificationStatus: "pending", updatedAt: new Date() }).where(eq(users.id, session.userId));
  const admins = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.role, "admin"));
  try {
    await Promise.all(admins.map((admin) => notify({
      userId: admin.id,
      title: "New organizer application",
      body: `${session.fullName} requested organizer privileges.`,
      href: "/admin/access-review",
    })));
  } catch {}
  revalidatePath("/dashboard");
  revalidatePath("/client");
  return { ok: true, message: "Your application has been submitted for review." };
}

export async function reviewOrganizerApplication(formData: FormData) {
  const admin = await requireRole("admin");
  const parsed = z.object({ id: z.string().uuid(), decision: z.enum(["approved", "rejected"]), reviewNote: z.string().trim().max(1000).optional() }).parse(Object.fromEntries(formData));
  const [request] = await db.select().from(organizerApplications).where(eq(organizerApplications.id, parsed.id)).limit(1);
  if (!request || request.status !== "pending") return;
  await db.transaction(async (tx) => {
    await tx.update(organizerApplications).set({ status: parsed.decision, reviewedBy: admin.userId, reviewedAt: new Date(), reviewNote: parsed.reviewNote ?? null }).where(eq(organizerApplications.id, request.id));
    await tx.update(users).set({ organizerVerificationStatus: parsed.decision === "approved" ? "approved" : "rejected", updatedAt: new Date() }).where(eq(users.id, request.userId));
  });
  if (parsed.decision === "approved") {
    try {
      await notify({
        userId: request.userId,
        title: "Organizer access approved",
        body: "You can now switch to the organiser workspace while keeping your client access.",
        href: "/client",
      });
    } catch (error) {
      // The access decision is already committed; notification failure must not
      // leave the admin UI appearing to fail.
      console.error("[admin][organizer-review][notification-failed]", error);
    }
  }
  revalidatePath("/admin");
  revalidatePath("/admin/access-review");
  revalidatePath("/client");
}

export async function reviewAccessRequest(formData: FormData) {
  const admin = await requireRole("admin");
  const parsed = z.object({ id: z.string().uuid(), decision: z.enum(["approved", "rejected"]), reviewNote: z.string().trim().max(1000).optional() }).parse(Object.fromEntries(formData));
  const [request] = await db.select().from(accessRequests).where(eq(accessRequests.id, parsed.id)).limit(1);
  if (!request) {
    await reviewOrganizerApplication(formData);
    return;
  }
  if (request.status !== "pending") return;
  const temporaryPassword = parsed.decision === "approved" ? generateTemporaryPassword() : null;
  let accountCreated = false;

  await db.transaction(async (tx) => {
    await tx.update(accessRequests).set({
      status: parsed.decision,
      reviewedBy: admin.userId,
      reviewedAt: new Date(),
      reviewNote: parsed.decision === "approved" ? "Approved after trust-team review." : parsed.reviewNote || "Application did not meet current access criteria.",
    }).where(eq(accessRequests.id, request.id));
    if (parsed.decision === "approved") {
      const passwordHash = await bcrypt.hash(temporaryPassword!, 10);
      const approvedRole = request.desiredRole === "service_provider" ? "service_provider" : "client";
      const created = await tx.insert(users).values({ id: randomUUID(), fullName: request.fullName, email: request.email, passwordHash, role: approvedRole, mustChangePassword: true, isActive: true }).onConflictDoNothing({ target: users.email }).returning({ id: users.id });
      if (!created.length) throw new Error("An account already exists for this applicant.");
      accountCreated = true;
      await tx.delete(accessRequests).where(and(eq(accessRequests.email, request.email), ne(accessRequests.id, request.id)));
    }
  });

  if (parsed.decision === "approved" && accountCreated) {
    try {
      await deliverEmail({
        to: request.email,
        subject: "Your Trufeta access is approved",
        body: `Hello ${request.fullName},\n\nYour ${request.desiredRole} access has been approved.\n\nSign in at /login with:\nEmail: ${request.email}\nTemporary password: ${temporaryPassword}\n\nFor your security, change this password after your first sign-in.\n\n— The Trufeta trust team`,
      });
    } catch (err) {
      console.error('[admin][review][email-failed]', { requestId: request.id, to: request.email, error: err instanceof Error ? err.stack || err.message : String(err) });
      // Approval has already been committed. Do not turn an SMTP outage into a failed review.
      // The email remains recorded in email_log for retry/support follow-up.
    }
  } else if (parsed.reviewNote) {
    try {
      await deliverEmail({
        to: request.email,
        subject: "Update on your Trufeta application",
        body: `Hello ${request.fullName},\n\nThank you for your interest. Your application was not approved at this time.\n\nReason: ${parsed.reviewNote}\n\nâ€” The Trufeta trust team`,
      });
    } catch (err) {
      console.error('[admin][review][email-failed]', { requestId: request.id, to: request.email, error: err instanceof Error ? err.stack || err.message : String(err) });
      // The review decision is already saved; email delivery can be retried separately.
    }
  } else {
    try {
      await deliverEmail({ to: request.email, subject: "Update on your Trufeta application", body: `Hello ${request.fullName},\n\nThank you for your interest. Your application was not approved at this time.\n\n— The Trufeta trust team` });
    } catch (err) {
      console.error('[admin][review][email-failed]', { requestId: request.id, to: request.email, error: err instanceof Error ? err.stack || err.message : String(err) });
      // The review decision is already saved; email delivery can be retried separately.
    }
  }
  revalidatePath("/admin");
  revalidatePath("/admin/access-review");
}

// ---- Service provider verification toggle ------------------------------------

export async function setServiceProviderVerified(formData: FormData) {
  const admin = await requireRole("admin");
  const parsed = z.object({ vendorId: z.string().uuid(), verified: z.enum(["true", "false"]) }).parse(Object.fromEntries(formData));
  const [profile] = await db.update(vendorProfiles).set({ verified: parsed.verified === "true" }).where(eq(vendorProfiles.id, parsed.vendorId)).returning();
  if (profile) {
    await notify({
      userId: profile.userId,
      title: profile.verified ? "Service provider verified" : "Verification revoked",
      body: profile.verified ? "Your studio is now visible with the verified badge." : "An admin has removed your verified badge.",
      href: "/vendor/dashboard",
    });
  }
  void admin;
  revalidatePath("/admin");
}

export async function setAccountAccess(formData: FormData) {
  const admin = await requireRole("admin");
  const parsed = z.object({ userId: z.string().uuid(), action: z.enum(["activate", "suspend", "ban"]) }).parse(Object.fromEntries(formData));
  if (parsed.userId === admin.userId) return;
  const [user] = await db.update(users).set({
    isActive: parsed.action === "activate",
    isBanned: parsed.action === "ban",
    updatedAt: new Date(),
  }).where(eq(users.id, parsed.userId)).returning();
  if (user) await notify({ userId: user.id, title: parsed.action === "activate" ? "Account restored" : "Account access restricted", body: parsed.action === "ban" ? "Your account has been banned by the trust team." : parsed.action === "suspend" ? "Your account has been suspended by the trust team." : "Your account is active again.", href: "/login" });
  revalidatePath("/admin");
}

export async function moderateReview(formData: FormData) {
  const admin = await requireRole("admin");
  const parsed = z.object({ reviewId: z.string().uuid(), hidden: z.enum(["true", "false"]) }).parse(Object.fromEntries(formData));
  const { reviews } = await import("@db/schema");
  await db.update(reviews).set({ isHidden: parsed.hidden === "true", moderatedAt: new Date(), moderatedBy: admin.userId }).where(eq(reviews.id, parsed.reviewId));
  revalidatePath("/admin");
}

export async function updateVendorCoordinates(formData: FormData) {
  const admin = await requireRole("admin");
  const parsed = z.object({
    vendorId: z.string().uuid(),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
  }).parse(Object.fromEntries(formData));
  await db.update(vendorProfiles).set({
    latitude: parsed.latitude.toString(),
    longitude: parsed.longitude.toString(),
  }).where(eq(vendorProfiles.id, parsed.vendorId));
  revalidatePath("/admin");
  revalidatePath("/vendors");
}
