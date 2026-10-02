import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@db/client";
import {
  bookingConversations,
  bookings,
  contracts,
  hiringDomains,
  services,
  vendorProfiles,
  type events,
} from "@db/schema";

/**
 * Shared booking-record factory.
 *
 * The existing `createBooking` server action performs payment authorization
 * before writing the booking row. When an organiser accepts a hiring
 * application we already have an agreed provider + event, so we reuse the
 * same record shape (bookings + contracts + bookingConversations) without
 * re-implementing payment/escrow. The vendor still confirms via the
 * existing `serviceProviderBookingDecision` action, which flips the
 * contract to executed and unlocks chat.
 */
const BOOKING_TERMS_VERSION = "2026-08-20";
const CANCELLATION_AND_REFUND_POLICY = [
  "Escrow funds are held until delivery is approved, the five-day review window ends, or an admin resolves a dispute.",
  "A vendor decline triggers a full refund of funds held for the booking.",
  "After confirmation, cancellation and refund outcomes are determined from this agreement, submitted evidence, and an admin resolution where needed.",
];

type EventRow = typeof events.$inferSelect;

type TxLike = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function createBookingFromHiringAccept(
  executor: TxLike,
  args: {
    organiserId: string;
    vendorId: string;
    event: EventRow;
    categoryDomain: Pick<typeof hiringDomains.$inferSelect, "id" | "categoryId" | "unitPrice" | "budget" | "placesNeeded" | "requirementNote">;
  },
) {
  const tx = executor as unknown as typeof db;
  const [vendor] = await tx.select().from(vendorProfiles).where(eq(vendorProfiles.id, args.vendorId)).limit(1);
  if (!vendor) throw new Error("Vendor profile not found for hiring acceptance.");
  // Pick the vendor's cheapest active service that matches the recruitment
  // category so the booking has a service reference. Falls back to a
  // synthetic "Custom hiring" line priced from the domain budget when the
  // vendor hasn't published a matching service.
  const [matchingService] = await tx
    .select()
    .from(services)
    .where(and(eq(services.vendorId, vendor.id), eq(services.active, true)))
    .limit(1);
  const totalAmount = args.categoryDomain.unitPrice != null
    ? args.categoryDomain.unitPrice * args.categoryDomain.placesNeeded
    : args.categoryDomain.budget ?? matchingService?.price ?? 0;
  const reference = `TRU-${Date.now().toString(36).slice(-6).toUpperCase()}`;
  const acceptedAt = new Date();
  const termsSnapshot = {
    version: BOOKING_TERMS_VERSION,
    capturedAt: acceptedAt.toISOString(),
    organiserAcceptedAt: acceptedAt.toISOString(),
    vendorAcceptanceRecordedAt: null,
    vendor: { id: vendor.id, businessName: vendor.businessName, city: vendor.city },
    service: matchingService
      ? { id: matchingService.id, name: matchingService.name, description: matchingService.description, price: totalAmount, durationHours: matchingService.durationHours }
      : { id: null, name: "Custom hiring", description: args.categoryDomain.requirementNote ?? "Recruited via event hiring post", price: totalAmount, durationHours: null },
    event: {
      type: args.event.eventType,
      date: args.event.startsAt.toISOString(),
      venue: args.event.venue,
      guestCount: args.event.guestCount,
      notes: args.categoryDomain.requirementNote ?? null,
      eventId: args.event.id,
    },
    payment: { currency: "XAF", serviceTotal: totalAmount, escrowMode: "full", depositPercent: 100, protectedNow: 0 },
    cancellationAndRefundPolicy: CANCELLATION_AND_REFUND_POLICY,
    source: "hiring_accept",
  };
  const [booking] = await tx
    .insert(bookings)
    .values({
      id: crypto.randomUUID(),
      reference,
      organiserId: args.organiserId,
      vendorId: vendor.id,
      serviceId: matchingService?.id ?? null,
      eventId: args.event.id,
      eventType: args.event.eventType,
      eventDate: args.event.startsAt,
      venue: args.event.venue,
      guestCount: args.event.guestCount,
      notes: args.categoryDomain.requirementNote ?? null,
      totalAmount,
      escrowMode: "full",
      depositPercent: 100,
      fundedAmount: 0,
      termsSnapshot,
      termsAcceptedAt: acceptedAt,
      status: "pending_vendor_acceptance",
    })
    .returning();
  await tx.insert(contracts).values({
    id: crypto.randomUUID(),
    bookingId: booking.id,
    termsContent: termsSnapshot,
    organiserSignedAt: acceptedAt,
    status: "partially_signed",
  });
  await tx
    .insert(bookingConversations)
    .values({ bookingId: booking.id, organiserId: args.organiserId, vendorId: vendor.userId, unlockedAt: acceptedAt })
    .onConflictDoNothing({ target: bookingConversations.bookingId });
  return booking;
}
