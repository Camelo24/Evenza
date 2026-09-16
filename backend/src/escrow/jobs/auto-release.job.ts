import { db } from "@db/client";
import { bookings, escrowTransactions, notifications, vendorProfiles } from "@db/schema";
import { and, eq, isNotNull, lte } from "drizzle-orm";
import { creditServiceProviderWallet } from "@backend/wallets/service";

// Scheduled worker for Section 9a's five-day auto-release. Invoked by
// /api/cron/escrow-release which is protected with CRON_SECRET.

export async function releaseExpiredEscrows(now = new Date()) {
  const due = await db
    .select({ booking: bookings, escrow: escrowTransactions, vendor: vendorProfiles })
    .from(bookings)
    .innerJoin(escrowTransactions, eq(escrowTransactions.bookingId, bookings.id))
    .innerJoin(vendorProfiles, eq(vendorProfiles.id, bookings.vendorId))
    .where(and(
      eq(bookings.status, "awaiting_review"),
      eq(escrowTransactions.status, "release_scheduled"),
      isNotNull(bookings.termsSnapshot),
      isNotNull(bookings.reviewDeadline),
      lte(bookings.reviewDeadline, now),
    ));

  let released = 0;
  for (const row of due) {
    await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(bookings)
        .set({ status: "completed", updatedAt: now })
        .where(and(eq(bookings.id, row.booking.id), eq(bookings.status, "awaiting_review")))
        .returning();
      if (!updated) return;
      await tx.update(escrowTransactions).set({ status: "released", releasedAt: now, updatedAt: now }).where(eq(escrowTransactions.id, row.escrow.id));
      await tx.insert(notifications).values([
        { userId: row.booking.organiserId, title: "Escrow auto-released", body: `${row.booking.reference} passed the five-day review window without a dispute.`, href: "/dashboard" },
        { userId: row.vendor.userId, title: "Funds released", body: `${row.booking.reference} has cleared the protected review window.`, href: "/vendor/dashboard" },
      ]);
      released += 1;
    });
    await creditServiceProviderWallet({ vendorId: row.vendor.id, bookingId: row.booking.id, amount: row.escrow.amount, reference: row.booking.reference });
  }
  return { scanned: due.length, released, processedAt: now.toISOString() };
}
