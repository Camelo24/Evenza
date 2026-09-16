"use server";

import { db } from "@db/client";
import { bookings, disputeLogs, disputes, escrowTransactions, users, vendorProfiles } from "@db/schema";
import { requireRole } from "@backend/auth/session";
import { notify } from "@backend/notifications/service";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ---- Module 9b: dispute lifecycle with immutable audit logs ------------------

export async function raiseDispute(formData: FormData) {
  const session = await requireRole("organiser");
  const parsed = z.object({
    bookingId: z.string().uuid(),
    reason: z.string().trim().min(3).max(180),
    description: z.string().trim().min(10).max(2000),
    evidenceUrl: z.string().trim().url().optional().or(z.literal("")),
  }).parse(Object.fromEntries(formData));
  const [booking] = await db.select().from(bookings).where(and(eq(bookings.id, parsed.bookingId), eq(bookings.organiserId, session.userId), eq(bookings.status, "awaiting_review"))).limit(1);
  if (!booking || !booking.reviewDeadline || booking.reviewDeadline < new Date()) return;
  await db.transaction(async (tx) => {
    const [dispute] = await tx.insert(disputes).values({
      bookingId: booking.id,
      openedBy: session.userId,
      reason: parsed.reason,
      description: parsed.description,
      status: "open",
    }).returning();
    await tx.insert(disputeLogs).values({
      disputeId: dispute.id,
      actorId: session.userId,
      action: "DISPUTE_OPENED",
      details: `${parsed.description}\n\nAgreement snapshot for review:\n${JSON.stringify(booking.termsSnapshot ?? { unavailable: "This legacy booking has no saved terms snapshot." })}`,
      evidenceUrl: parsed.evidenceUrl || null,
    });
    await tx.update(bookings).set({ status: "disputed", updatedAt: new Date() }).where(eq(bookings.id, booking.id));
    await tx.update(escrowTransactions).set({ status: "disputed", updatedAt: new Date() }).where(eq(escrowTransactions.bookingId, booking.id));
  });
  const [vendorProfile] = await db.select().from(vendorProfiles).where(eq(vendorProfiles.id, booking.vendorId)).limit(1);
  await notify({ userId: vendorProfile.userId, title: "Dispute opened", body: `${booking.reference}: ${parsed.reason}`, href: "/vendor/dashboard" });
  revalidatePath("/dashboard");
  revalidatePath("/vendor/dashboard");
  revalidatePath("/admin");
}

export async function addDisputeEvidence(formData: FormData) {
  const session = await requireRole("organiser", "vendor", "admin");
  const parsed = z.object({
    disputeId: z.string().uuid(),
    details: z.string().trim().min(3).max(1000),
    evidenceUrl: z.string().trim().url().optional().or(z.literal("")),
  }).parse(Object.fromEntries(formData));
  const [record] = await db
    .select({ dispute: disputes, booking: bookings, vendor: vendorProfiles })
    .from(disputes)
    .innerJoin(bookings, eq(bookings.id, disputes.bookingId))
    .innerJoin(vendorProfiles, eq(vendorProfiles.id, bookings.vendorId))
    .where(eq(disputes.id, parsed.disputeId))
    .limit(1);
  if (!record || !["open", "under_review"].includes(record.dispute.status)) return;
  const allowed = session.role === "admin" || record.booking.organiserId === session.userId || record.vendor.userId === session.userId;
  if (!allowed) return;
  await db.insert(disputeLogs).values({
    disputeId: record.dispute.id,
    actorId: session.userId,
    action: "EVIDENCE_SUBMITTED",
    details: parsed.details,
    evidenceUrl: parsed.evidenceUrl || null,
  });
  revalidatePath("/dashboard");
  revalidatePath("/vendor/dashboard");
  revalidatePath("/admin");
}

export async function resolveDispute(formData: FormData) {
  const admin = await requireRole("admin");
  const parsed = z.object({
    disputeId: z.string().uuid(),
    decision: z.enum(["vendor", "organiser", "split"]),
    resolutionNote: z.string().trim().min(10).max(2000),
    vendorShare: z.coerce.number().int().min(0).optional(),
    organiserRefund: z.coerce.number().int().min(0).optional(),
  }).parse(Object.fromEntries(formData));
  const [record] = await db
    .select({ dispute: disputes, booking: bookings, escrow: escrowTransactions, vendor: vendorProfiles })
    .from(disputes)
    .innerJoin(bookings, eq(bookings.id, disputes.bookingId))
    .innerJoin(escrowTransactions, eq(escrowTransactions.bookingId, bookings.id))
    .innerJoin(vendorProfiles, eq(vendorProfiles.id, bookings.vendorId))
    .where(eq(disputes.id, parsed.disputeId))
    .limit(1);
  if (!record || !["open", "under_review"].includes(record.dispute.status)) return;
  const vendorShare = parsed.decision === "vendor" ? record.escrow.amount : parsed.decision === "organiser" ? 0 : parsed.vendorShare ?? 0;
  const organiserRefund = parsed.decision === "organiser" ? record.escrow.amount : parsed.decision === "vendor" ? 0 : parsed.organiserRefund ?? 0;
  if (vendorShare + organiserRefund !== record.escrow.amount) return;
  const disputeState = parsed.decision === "vendor" ? "resolved_vendor" : parsed.decision === "organiser" ? "resolved_organiser" : "resolved_split";
  const escrowState = parsed.decision === "vendor" ? "released" : parsed.decision === "organiser" ? "refunded" : "split";
  await db.transaction(async (tx) => {
    await tx.update(disputes).set({ status: disputeState, resolutionNote: parsed.resolutionNote, vendorShare, organiserRefund, resolvedBy: admin.userId, resolvedAt: new Date() }).where(eq(disputes.id, record.dispute.id));
    await tx.update(escrowTransactions).set({ status: escrowState, releasedAt: parsed.decision === "vendor" ? new Date() : null, updatedAt: new Date() }).where(eq(escrowTransactions.id, record.escrow.id));
    await tx.update(bookings).set({ status: parsed.decision === "organiser" ? "cancelled" : "completed", updatedAt: new Date() }).where(eq(bookings.id, record.booking.id));
    await tx.insert(disputeLogs).values({
      disputeId: record.dispute.id,
      actorId: admin.userId,
      action: "ADMIN_RESOLUTION",
      details: `${parsed.resolutionNote} Vendor: ${vendorShare} XAF; organiser: ${organiserRefund} XAF.`,
    });
  });
  const [organiser] = await db.select().from(users).where(eq(users.id, record.booking.organiserId)).limit(1);
  await notify({ userId: record.booking.organiserId, title: "Dispute resolved", body: parsed.resolutionNote, href: "/dashboard", email: { to: organiser.email } });
  await notify({ userId: record.vendor.userId, title: "Dispute resolved", body: parsed.resolutionNote, href: "/vendor/dashboard" });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/vendor/dashboard");
}
