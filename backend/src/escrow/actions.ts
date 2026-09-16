"use server";

import { db } from "@db/client";
import { bookingEvidence, bookings, escrowTransactions, users, vendorProfiles } from "@db/schema";
import { requireRole } from "@backend/auth/session";
import { notify } from "@backend/notifications/service";
import { creditServiceProviderWallet } from "@backend/wallets/service";
import { and, eq, isNotNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ---- Module 9a: vendor uploads timestamped evidence -------------------------

export async function submitBookingEvidence(formData: FormData) {
  const session = await requireRole("service_provider");
  const parsed = z.object({
    bookingId: z.string().uuid(),
    type: z.enum(["photo", "video", "gps", "qr"]),
    url: z.string().trim().url().optional().or(z.literal("")),
    note: z.string().trim().min(3).max(500),
    latitude: z.string().trim().optional(),
    longitude: z.string().trim().optional(),
  }).parse(Object.fromEntries(formData));
  const [profile] = await db.select().from(vendorProfiles).where(eq(vendorProfiles.userId, session.userId)).limit(1);
  if (!profile) return;
  const [owned] = await db.select().from(bookings).where(and(eq(bookings.id, parsed.bookingId), eq(bookings.vendorId, profile.id), eq(bookings.status, "confirmed"))).limit(1);
  if (!owned) return;
  await db.insert(bookingEvidence).values({
    bookingId: owned.id,
    uploadedBy: session.userId,
    type: parsed.type,
    url: parsed.url || null,
    note: parsed.note,
    latitude: parsed.latitude || null,
    longitude: parsed.longitude || null,
    capturedAt: new Date(),
  });
  revalidatePath("/vendor/dashboard");
}

// ---- Step 17: vendor marks the booking completed ----------------------------
// Requires at least one photo/video proof per Section 9a.

export async function markBookingComplete(formData: FormData) {
  const session = await requireRole("service_provider");
  const bookingId = z.string().uuid().parse(formData.get("bookingId"));
  const [profile] = await db.select().from(vendorProfiles).where(eq(vendorProfiles.userId, session.userId)).limit(1);
  if (!profile) return;
  const [proof] = await db
    .select({ id: bookingEvidence.id })
    .from(bookingEvidence)
    .where(and(eq(bookingEvidence.bookingId, bookingId), or(eq(bookingEvidence.type, "photo"), eq(bookingEvidence.type, "video"))))
    .limit(1);
  if (!proof) return;
  const deadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const [updated] = await db
    .update(bookings)
    .set({ status: "awaiting_review", completionMarkedAt: new Date(), reviewDeadline: deadline, updatedAt: new Date() })
    .where(and(eq(bookings.id, bookingId), eq(bookings.vendorId, profile.id), eq(bookings.status, "confirmed"), isNotNull(bookings.termsSnapshot)))
    .returning();
  if (updated) {
    await db.update(escrowTransactions).set({ status: "release_scheduled", releaseScheduledAt: deadline, updatedAt: new Date() }).where(eq(escrowTransactions.bookingId, updated.id));
    const [organiser] = await db.select().from(users).where(eq(users.id, updated.organiserId)).limit(1);
    await notify({
      userId: updated.organiserId,
      title: "Service marked complete",
      body: `Review ${updated.reference} within five days or escrow will auto-release.`,
      href: "/dashboard",
      email: { to: organiser.email },
    });
  }
  revalidatePath("/vendor/dashboard");
}

// ---- Step 18: organiser confirms release ------------------------------------

export async function confirmCompletion(formData: FormData) {
  const session = await requireRole("organiser");
  const bookingId = z.string().uuid().parse(formData.get("bookingId"));
  const [updated] = await db.transaction(async (tx) => {
    const [booking] = await tx
      .update(bookings)
      .set({ status: "completed", updatedAt: new Date() })
      .where(and(eq(bookings.id, bookingId), eq(bookings.organiserId, session.userId), eq(bookings.status, "awaiting_review"), isNotNull(bookings.termsSnapshot)))
      .returning();
    if (booking) {
      await tx.update(escrowTransactions).set({ status: "released", releasedAt: new Date(), updatedAt: new Date() }).where(eq(escrowTransactions.bookingId, booking.id));
    }
    return [booking];
  });
  if (updated) {
    const [vendorProfile] = await db.select().from(vendorProfiles).where(eq(vendorProfiles.id, updated.vendorId)).limit(1);
    await creditServiceProviderWallet({ vendorId: vendorProfile.id, bookingId: updated.id, amount: updated.fundedAmount, reference: updated.reference });
    await notify({ userId: vendorProfile.userId, title: "Escrow released", body: `${updated.reference} has been approved. Funds are on their way.`, href: "/vendor/dashboard" });
  }
  revalidatePath("/dashboard");
  revalidatePath("/vendor/dashboard");
}
