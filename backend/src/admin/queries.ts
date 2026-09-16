import { db } from "@db/client";
import { accessRequests, bookings, disputeLogs, disputes, emailLog, escrowTransactions, organizerApplications, payments, reviews, users, vendorProfiles } from "@db/schema";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";

export async function getAdminData() {
  const [requests, vendorRows, userRows, bookingRows, disputeRows, escrowRows, paymentRows, reviewRows, emails, organizerApps] = await Promise.all([
    db.select().from(accessRequests).orderBy(desc(accessRequests.createdAt)),
    db.select().from(vendorProfiles).orderBy(desc(vendorProfiles.createdAt)),
    db.select({ id: users.id, fullName: users.fullName, email: users.email, role: users.role, isActive: users.isActive, isBanned: users.isBanned, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt)),
    db
      .select({ id: bookings.id, reference: bookings.reference, fundedAmount: bookings.fundedAmount, totalAmount: bookings.totalAmount, status: bookings.status, eventDate: bookings.eventDate, createdAt: bookings.createdAt })
      .from(bookings)
      .orderBy(desc(bookings.createdAt)),
    db
      .select({
        dispute: disputes,
        booking: {
          id: bookings.id,
          reference: bookings.reference,
          organiserId: bookings.organiserId,
          vendorId: bookings.vendorId,
          status: bookings.status,
          fundedAmount: bookings.fundedAmount,
        },
        escrow: escrowTransactions,
      })
      .from(disputes)
      .innerJoin(bookings, eq(bookings.id, disputes.bookingId))
      .innerJoin(escrowTransactions, eq(escrowTransactions.bookingId, bookings.id))
      .orderBy(desc(disputes.createdAt)),
    db.select().from(escrowTransactions).orderBy(desc(escrowTransactions.createdAt)),
    db.select().from(payments).orderBy(desc(payments.createdAt)),
    db.select().from(reviews).orderBy(desc(reviews.createdAt)),
    db.select().from(emailLog).orderBy(desc(emailLog.createdAt)).limit(50),
    db.select().from(organizerApplications).orderBy(desc(organizerApplications.createdAt)),
  ]);
  const logs = disputeRows.length
    ? await db.select().from(disputeLogs).where(inArray(disputeLogs.disputeId, disputeRows.map((row) => row.dispute.id))).orderBy(asc(disputeLogs.createdAt))
    : [];
  console.info("[admin][access-requests-read]", {
    total: requests.length,
    pending: requests.filter((request) => request.status === "pending").length,
    approved: requests.filter((request) => request.status === "approved").length,
    rejected: requests.filter((request) => request.status === "rejected").length,
  });
  const [{ held }] = await db
    .select({ held: sql<number>`coalesce(sum(${escrowTransactions.amount}) filter (where ${escrowTransactions.status} in ('held','release_scheduled','disputed')), 0)` })
    .from(escrowTransactions);
  const organizerRequestRows = await db
    .select({
      id: organizerApplications.id,
      fullName: users.fullName,
      email: users.email,
      businessName: organizerApplications.businessName,
      message: organizerApplications.message,
      identityDocumentPath: organizerApplications.documentPath,
      identityDocumentName: organizerApplications.documentName,
      status: organizerApplications.status,
      reviewNote: organizerApplications.reviewNote,
      reviewedAt: organizerApplications.reviewedAt,
      createdAt: organizerApplications.createdAt,
    })
    .from(organizerApplications)
    .innerJoin(users, eq(users.id, organizerApplications.userId))
    .orderBy(desc(organizerApplications.createdAt));
  const accessReviewRequests = [
    ...requests.map((request) => ({ ...request, requestType: "access" as const })),
    ...organizerRequestRows.map((request) => ({
      ...request,
      desiredRole: "client_organizer",
      phone: null,
      // organizerVerificationStatus also contains not_requested, but an application
      // itself is always a reviewable pending/approved/rejected record.
      status: (request.status === "approved" || request.status === "rejected" ? request.status : "pending") as "pending" | "approved" | "rejected",
      requestType: "organizer" as const,
    })),
  ].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  const providerHealth = Object.values(paymentRows.reduce<Record<string, { provider: string; volume: number; total: number; failed: number }>>((result, payment) => {
    const row = result[payment.provider] ?? { provider: payment.provider, volume: 0, total: 0, failed: 0 };
    row.volume += payment.amount; row.total += 1; if (payment.status === "failed") row.failed += 1; result[payment.provider] = row; return result;
  }, {}));
  const highRiskBookings = bookingRows.filter((booking) => ["disputed", "pending_vendor_acceptance"].includes(booking.status) || booking.fundedAmount >= 250000 || booking.eventDate < new Date()).slice(0, 12);
  return {
    requests,
    accessReviewRequests,
    vendors: vendorRows,
    users: userRows,
    bookings: bookingRows,
    highRiskBookings,
    escrow: escrowRows,
    payments: paymentRows,
    providerHealth,
    reviews: reviewRows,
    emailLog: emails,
    disputes: disputeRows.map((row) => ({ ...row, logs: logs.filter((log) => log.disputeId === row.dispute.id) })),
    heldAmount: Number(held),
    organizerApplications: organizerApps,
  };
}
