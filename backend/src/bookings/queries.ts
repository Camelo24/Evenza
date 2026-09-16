import { db } from "@db/client";
import {
  bookingEvidence,
  bookings,
  contracts,
  escrowTransactions,
  events,
  eventVendors,
  messages,
  notifications,
  reviews,
  services,
  users,
  vendorProfiles,
} from "@db/schema";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

export async function getOrganiserDashboard(organiserId: string) {
  const [organiser] = await db.select().from(users).where(eq(users.id, organiserId)).limit(1);
  if (!organiser) throw new Error("Organiser profile not found");
  const rows = await db
    .select({ booking: bookings, vendor: vendorProfiles, service: services })
    .from(bookings)
    .innerJoin(vendorProfiles, eq(bookings.vendorId, vendorProfiles.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.organiserId, organiser.id))
    .orderBy(desc(bookings.createdAt));
  const escrowRows = rows.length ? await db.select().from(escrowTransactions).where(inArray(escrowTransactions.bookingId, rows.map((row) => row.booking.id))) : [];
  const contractRows = rows.length ? await db.select().from(contracts).where(inArray(contracts.bookingId, rows.map((row) => row.booking.id))) : [];
  const notes = await db.select().from(notifications).where(eq(notifications.userId, organiser.id)).orderBy(desc(notifications.createdAt));
  const chats = rows.length
    ? await db.select({ message: messages, sender: users }).from(messages).innerJoin(users, eq(messages.senderId, users.id)).where(inArray(messages.bookingId, rows.map((row) => row.booking.id))).orderBy(asc(messages.createdAt))
    : [];
  return {
    organiser,
    bookings: rows.map((row) => ({ ...row, escrow: escrowRows.find((item) => item.bookingId === row.booking.id), contract: contractRows.find((item) => item.bookingId === row.booking.id) })),
    notifications: notes,
    messages: chats,
  };
}

export async function getOrganiserEventsData(organiserId: string) {
  const eventRows = await db.select().from(events).where(eq(events.organiserId, organiserId)).orderBy(asc(events.startsAt));
  const assignments = eventRows.length
    ? await db
        .select({ eventId: eventVendors.eventId, vendor: vendorProfiles })
        .from(eventVendors)
        .innerJoin(vendorProfiles, eq(vendorProfiles.id, eventVendors.vendorId))
        .where(inArray(eventVendors.eventId, eventRows.map((event) => event.id)))
    : [];
  const vendorOptions = await db.select({ id: vendorProfiles.id, businessName: vendorProfiles.businessName, city: vendorProfiles.city }).from(vendorProfiles).orderBy(asc(vendorProfiles.businessName));
  return {
    events: eventRows.map((event) => ({ ...event, vendors: assignments.filter((row) => row.eventId === event.id).map((row) => row.vendor) })),
    vendorOptions,
  };
}

export async function getVendorDashboard(userId: string) {
  const [profile] = await db.select().from(vendorProfiles).where(eq(vendorProfiles.userId, userId)).limit(1);
  if (!profile) return null;
  const bookingRows = await db
    .select({ booking: bookings, organiser: users, service: services, escrow: escrowTransactions })
    .from(bookings)
    .innerJoin(users, eq(users.id, bookings.organiserId))
    .leftJoin(services, eq(services.id, bookings.serviceId))
    .leftJoin(escrowTransactions, eq(escrowTransactions.bookingId, bookings.id))
    .where(eq(bookings.vendorId, profile.id))
    .orderBy(desc(bookings.createdAt));
  const [notes, serviceRows, contractRows] = await Promise.all([
    db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)),
    db.select().from(services).where(eq(services.vendorId, profile.id)).orderBy(asc(services.price)),
    bookingRows.length ? db.select().from(contracts).where(inArray(contracts.bookingId, bookingRows.map((row) => row.booking.id))) : Promise.resolve([]),
  ]);
  const chats = bookingRows.length
    ? await db.select({ message: messages, sender: users }).from(messages).innerJoin(users, eq(messages.senderId, users.id)).where(inArray(messages.bookingId, bookingRows.map((row) => row.booking.id))).orderBy(asc(messages.createdAt))
    : [];
  const evidence = bookingRows.length
    ? await db.select().from(bookingEvidence).where(inArray(bookingEvidence.bookingId, bookingRows.map((row) => row.booking.id))).orderBy(desc(bookingEvidence.createdAt))
    : [];
  return { profile, bookings: bookingRows.map((row) => ({ ...row, contract: contractRows.find((item) => item.bookingId === row.booking.id) })), services: serviceRows, notifications: notes, messages: chats, evidence };
}

export async function getVendorReviews(vendorId: string) {
  return db
    .select({ review: reviews, author: users })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.authorId))
    .where(eq(reviews.vendorId, vendorId))
    .orderBy(desc(reviews.createdAt))
    .limit(6);
}

export async function getBookingReview(bookingId: string) {
  const [row] = await db.select().from(reviews).where(eq(reviews.bookingId, bookingId)).limit(1);
  return row ?? null;
}

export async function findServiceForBooking(serviceId: string, vendorId: string) {
  const [service] = await db.select().from(services).where(and(eq(services.id, serviceId), eq(services.vendorId, vendorId), eq(services.active, true))).limit(1);
  return service ?? null;
}
