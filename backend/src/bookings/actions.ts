"use server";

import crypto from "crypto";
import { db } from "@db/client";
import { bookingConversations, bookings, contracts, escrowTransactions, messages, payments, services, users, vendorProfiles } from "@db/schema";
import { requireRole } from "@backend/auth/session";
import { notify } from "@backend/notifications/service";
import { authorize } from "@backend/payments/providers/campay.provider";
import { saveChatAttachment } from "@backend/uploads/chat-attachments";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@backend/auth/actions";

// ---- Module 7 + 8 + 9: booking, payment, escrow bootstrap -------------------

const bookingSchema = z.object({
  vendorId: z.string().uuid(),
  serviceId: z.string().uuid(),
  eventType: z.string().trim().min(2, "Choose an event type."),
  eventDate: z.string().min(1, "Choose an event date."),
  venue: z.string().trim().min(3, "Enter the venue or neighbourhood."),
  guestCount: z.coerce.number().int().min(1).max(10000),
  notes: z.string().trim().max(1500).optional(),
  escrowMode: z.enum(["full", "deposit"]),
  depositPercent: z.coerce.number().int().min(20).max(100),
  phoneNumber: z.string().trim().regex(/^(\+?237)?[26]\d{8}$/, "Enter a valid Cameroonian mobile number."),
  termsAccepted: z.literal("on", { error: "You must accept the booking terms before authorising payment." }),
});

const BOOKING_TERMS_VERSION = "2026-08-20";
const BOOKING_DEADLINE_DAYS = 5;
const CANCELLATION_AND_REFUND_POLICY = [
  "Escrow funds are held until delivery is approved, the five-day review window ends, or an admin resolves a dispute.",
  "A vendor decline triggers a full refund of funds held for the booking.",
  "After confirmation, cancellation and refund outcomes are determined from this agreement, submitted evidence, and an admin resolution where needed.",
];

function getBookingDeadline(eventDate: Date) {
  return new Date(eventDate.getTime() - BOOKING_DEADLINE_DAYS * 24 * 60 * 60 * 1000);
}

export async function createBooking(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("organiser");
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your booking details." };
  const eventDate = new Date(parsed.data.eventDate);
  const now = new Date();
  if (Number.isNaN(eventDate.getTime()) || eventDate <= now) return { ok: false, message: "The event date must be in the future." };
  const bookingDeadline = getBookingDeadline(eventDate);
  if (now >= bookingDeadline) return { ok: false, message: "Bookings are closed for this event. The final booking deadline is five days before the event date." };
  const [service] = await db.select().from(services).where(and(eq(services.id, parsed.data.serviceId), eq(services.vendorId, parsed.data.vendorId), eq(services.active, true))).limit(1);
  if (!service) return { ok: false, message: "That service is no longer available." };
  const [vendor] = await db.select().from(vendorProfiles).where(eq(vendorProfiles.id, parsed.data.vendorId)).limit(1);
  if (!vendor) return { ok: false, message: "Vendor not found." };

  const percent = parsed.data.escrowMode === "full" ? 100 : parsed.data.depositPercent;
  const totalAmount = service.price;
  const fundedAmount = Math.round((totalAmount * percent) / 100);
  const reference = `TRU-${Date.now().toString(36).slice(-6).toUpperCase()}`;
  const organiserAcceptedAt = new Date().toISOString();
  // This record is deliberately created before payment persistence and is never
  // updated after confirmation. It protects both parties from later listing edits.
  const termsSnapshot = {
    version: BOOKING_TERMS_VERSION,
    capturedAt: organiserAcceptedAt,
    organiserAcceptedAt,
    vendorAcceptanceRecordedAt: null,
    vendor: { id: vendor.id, businessName: vendor.businessName, city: vendor.city },
    service: {
      id: service.id,
      name: service.name,
      description: service.description,
      price: totalAmount,
      durationHours: service.durationHours,
    },
    event: {
      type: parsed.data.eventType,
      date: eventDate.toISOString(),
      venue: parsed.data.venue,
      guestCount: parsed.data.guestCount,
      notes: parsed.data.notes || null,
    },
    payment: { currency: "XAF", serviceTotal: totalAmount, escrowMode: parsed.data.escrowMode, depositPercent: percent, protectedNow: fundedAmount },
    cancellationAndRefundPolicy: CANCELLATION_AND_REFUND_POLICY,
  };

  // Step 8: call payment API. Failure short-circuits before touching booking state.
  const authorization = await authorize({ amount: fundedAmount, phoneNumber: parsed.data.phoneNumber, reference });
  if (!authorization.ok) return { ok: false, message: (authorization as any).message ?? "Payment failed" };

  // Steps 9-13: persist payment + escrow + booking atomically.
  const bookingId = crypto.randomUUID();
  const contractId = crypto.randomUUID();
  const paymentId = crypto.randomUUID();
  const escrowId = crypto.randomUUID();
  await db.transaction(async (tx) => {
    const [booking] = await tx.insert(bookings).values({
      id: bookingId,
      reference,
      organiserId: session.userId,
      vendorId: vendor.id,
      serviceId: service.id,
      eventType: parsed.data.eventType,
      eventDate,
      venue: parsed.data.venue,
      guestCount: parsed.data.guestCount,
      notes: parsed.data.notes,
      totalAmount,
      escrowMode: parsed.data.escrowMode,
      depositPercent: percent,
      fundedAmount,
      termsSnapshot,
      status: "pending_vendor_acceptance",
    }).returning();
    await tx.insert(contracts).values({
      id: contractId,
      bookingId: booking.id,
      termsContent: termsSnapshot,
      organiserSignedAt: new Date(organiserAcceptedAt),
      status: "partially_signed",
    });
    const [payment] = await tx.insert(payments).values({
      id: paymentId,
      bookingId: booking.id,
      provider: "Campay",
      providerReference: authorization.providerReference,
      phoneNumber: parsed.data.phoneNumber,
      amount: fundedAmount,
      status: "authorized",
    }).returning();
    await tx.insert(escrowTransactions).values({ id: escrowId, bookingId: booking.id, paymentId: payment.id, amount: fundedAmount, status: "held" });
  });

  // Step 14: notify vendor & organiser (in-app + email).
  const [vendorUser] = await db.select().from(users).where(eq(users.id, vendor.userId)).limit(1);
  await notify({ userId: vendor.userId, title: "New protected booking", body: `${session.fullName} requested ${service.name}. Funds are held in escrow.`, href: "/vendor/dashboard", email: { to: vendorUser.email } });
  await notify({ userId: session.userId, title: "Payment authorised", body: `${reference}: ${percent}% is now protected in escrow pending vendor acceptance.`, href: "/dashboard", email: { to: session.email } });

  revalidatePath("/dashboard");
  revalidatePath("/vendor/dashboard");
  return { ok: true, message: "Payment authorised and protected. The vendor has been notified.", reference };
}

// ---- Steps 15-16: vendor accepts or rejects ---------------------------------

export async function serviceProviderBookingDecision(formData: FormData) {
  const session = await requireRole("service_provider");
  const parsed = z.object({ bookingId: z.string().uuid(), decision: z.enum(["confirmed", "rejected"]) }).parse(Object.fromEntries(formData));
  const [profile] = await db.select().from(vendorProfiles).where(eq(vendorProfiles.userId, session.userId)).limit(1);
  if (!profile) return;
  const [booking] = await db.select().from(bookings).where(and(eq(bookings.id, parsed.bookingId), eq(bookings.vendorId, profile.id), eq(bookings.status, "pending_vendor_acceptance"))).limit(1);
  if (!booking) return;
  await db.transaction(async (tx) => {
    if (parsed.decision === "confirmed") {
      // New bookings always have a snapshot. Legacy pending bookings receive a
      // one-time fallback snapshot at confirmation; confirmed terms are never edited.
      if (!booking.termsSnapshot) {
        const [serviceRecord] = booking.serviceId ? await tx.select().from(services).where(eq(services.id, booking.serviceId)).limit(1) : [null];
        await tx.update(bookings).set({
          termsSnapshot: {
            version: BOOKING_TERMS_VERSION,
            capturedAt: booking.createdAt.toISOString(),
            organiserAcceptedAt: booking.createdAt.toISOString(),
            vendorAcceptanceRecordedAt: null,
            vendor: { id: profile.id, businessName: profile.businessName, city: profile.city },
            service: serviceRecord ? { id: serviceRecord.id, name: serviceRecord.name, description: serviceRecord.description, price: serviceRecord.price, durationHours: serviceRecord.durationHours } : null,
            event: { type: booking.eventType, date: booking.eventDate.toISOString(), venue: booking.venue, guestCount: booking.guestCount, notes: booking.notes },
            payment: { currency: "XAF", serviceTotal: booking.totalAmount, escrowMode: booking.escrowMode, depositPercent: booking.depositPercent, protectedNow: booking.fundedAmount },
            cancellationAndRefundPolicy: CANCELLATION_AND_REFUND_POLICY,
          },
        }).where(eq(bookings.id, booking.id));
      }
      const [contract] = await tx.select().from(contracts).where(eq(contracts.bookingId, booking.id)).limit(1);
      if (!contract?.organiserSignedAt) return;
      const acceptedAt = new Date();
      await tx.update(bookings).set({ status: parsed.decision, updatedAt: acceptedAt, termsAcceptedAt: acceptedAt }).where(eq(bookings.id, booking.id));
      await tx.update(contracts).set({ vendorSignedAt: acceptedAt, status: "executed", updatedAt: acceptedAt }).where(eq(contracts.bookingId, booking.id));
      await tx.insert(bookingConversations).values({ bookingId: booking.id, organiserId: booking.organiserId, vendorId: profile.userId, unlockedAt: acceptedAt }).onConflictDoNothing({ target: bookingConversations.bookingId });
    } else {
      await tx.update(bookings).set({ status: parsed.decision, updatedAt: new Date() }).where(eq(bookings.id, booking.id));
      if (parsed.decision === "rejected") {
        await tx.update(escrowTransactions).set({ status: "refunded", updatedAt: new Date() }).where(eq(escrowTransactions.bookingId, booking.id));
        await tx.update(payments).set({ status: "refunded" }).where(eq(payments.bookingId, booking.id));
      }
    }
  });
  const [organiser] = await db.select().from(users).where(eq(users.id, booking.organiserId)).limit(1);
  await notify({
    userId: booking.organiserId,
    title: parsed.decision === "confirmed" ? "Booking confirmed" : "Booking declined",
    body: parsed.decision === "confirmed"
      ? `${booking.reference} is confirmed. Its service, price, escrow, and cancellation terms are now fixed.`
      : `${booking.reference} has been ${parsed.decision}.`,
    href: "/dashboard",
    email: { to: organiser.email },
  });
  revalidatePath("/vendor/dashboard");
  revalidatePath("/dashboard");
}

// ---- Module 15: booking chat (organiser ↔ vendor) ---------------------------

export async function sendBookingMessage(formData: FormData) {
  const session = await requireRole("organiser", "vendor");
  const rawBody = formData.get("body");
  const rawAttachment = formData.get("attachment");
  const parsed = z.object({
    bookingId: z.string().uuid(),
    body: z.string().trim().max(2000).optional(),
  }).parse({
    bookingId: formData.get("bookingId"),
    body: typeof rawBody === "string" ? rawBody : "",
  });

  const [record] = await db
    .select({ booking: bookings, vendor: vendorProfiles })
    .from(bookings)
    .innerJoin(vendorProfiles, eq(vendorProfiles.id, bookings.vendorId))
    .where(eq(bookings.id, parsed.bookingId))
    .limit(1);
  if (!record || !["confirmed", "in_progress", "awaiting_review", "disputed"].includes(record.booking.status)) return;
  const isOrganiser = record.booking.organiserId === session.userId;
  const isVendor = record.vendor.userId === session.userId;
  if (!isOrganiser && !isVendor) return;
  const [conversation] = await db.select({ id: bookingConversations.id }).from(bookingConversations).where(eq(bookingConversations.bookingId, record.booking.id)).limit(1);
  if (!conversation) return;

  const attachment = rawAttachment instanceof File ? rawAttachment : null;
  const body = (parsed.body ?? "").trim();
  if (!attachment && !body) return;

  let savedAttachment: { path: string; name: string; type: string } | null = null;
  if (attachment) {
    savedAttachment = await saveChatAttachment(attachment);
  }

  const messageBody = attachment ? (body || (savedAttachment ? "Sent a file" : "Sent a message")) : body;
  const recipientId = isOrganiser ? record.vendor.userId : record.booking.organiserId;
  await db.transaction(async (tx) => {
    await tx.insert(messages).values({
      bookingId: record.booking.id,
      senderId: session.userId,
      body: messageBody,
      attachmentPath: savedAttachment?.path ?? null,
      attachmentName: savedAttachment?.name ?? null,
      attachmentType: savedAttachment?.type ?? null,
    });
  });
  await notify({
    userId: recipientId,
    title: `New message · ${record.booking.reference}`,
    body: `${session.fullName}: ${messageBody.slice(0, 120)}`,
    href: isOrganiser ? "/vendor/dashboard/messages" : "/dashboard/messages",
  });
  revalidatePath("/dashboard");
  revalidatePath("/vendor/dashboard");
}
