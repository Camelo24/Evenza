// The `server-only` package is for Next server components. When running
// the seed script directly with Node/ts-node it throws, so require it
// defensively.
try {
  require("server-only");
} catch {
  // ignore when not available (e.g., running outside Next server runtime)
}
import { db } from "../drizzle/client";
import {
  accessRequests,
  bookings,
  categories,
  escrowTransactions,
  events,
  messages,
  notifications,
  payments,
  services,
  tickets,
  users,
  vendorCategories,
  vendorProfiles,
} from "../drizzle/schema";
import { eq, inArray, or, sql } from "drizzle-orm";

// The category catalogue matches Trufeta's Module 5 vendor taxonomy.
const categorySeed = [
  ["Photography", "photography", "Camera"],
  ["Catering / Restoration", "catering", "Utensils"],
  ["Decoration", "decoration", "Sparkles"],
  ["Sound & Lighting", "sound-lighting", "Music"],
  ["Event Planning", "event-planning", "Clipboard"],
  ["MC / Entertainment", "entertainment", "Mic"],
  ["Security", "security", "Shield"],
  ["Venue Rental", "venue", "Building"],
  ["Cake & Pastry", "cake-pastry", "Cake"],
  ["Transport", "transport", "Car"],
] as const;

export async function purgeDemoData() {
  if (process.env.NODE_ENV === "production") {
    console.warn("[seed][purge-demo-data] blocked in production");
    return;
  }

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(users);
  if (Number(count) === 0) {
    console.info("[seed][purge-demo-data] no users to purge");
    return;
  }

  const nonAdminDemoEmails = [
    "organiser@trufeta.cm",
    "attendee@trufeta.cm",
    "studio@lumenoir.cm",
    "hello@savanna-table.cm",
    "atelier@ndolo.cm",
    "bookings@pulse237.cm",
    "events@maison-mboa.cm",
    "reservations@canopy237.cm",
    "sandrine@example.cm",
    "patrick@example.cm",
    "yvette@example.cm",
  ];

  const nonAdminUserIds = await db.select({ id: users.id }).from(users).where(inArray(users.email, nonAdminDemoEmails)).then((rows) => rows.map((r) => r.id));
  const vendorProfileIds = nonAdminUserIds.length ? await db.select({ id: vendorProfiles.id }).from(vendorProfiles).where(inArray(vendorProfiles.userId, nonAdminUserIds)).then((rows) => rows.map((r) => r.id)) : [];
  const serviceIds = vendorProfileIds.length ? await db.select({ id: services.id }).from(services).where(inArray(services.vendorId, vendorProfileIds)).then((rows) => rows.map((r) => r.id)) : [];
  const eventIds = nonAdminUserIds.length ? await db.select({ id: events.id }).from(events).where(inArray(events.organiserId, nonAdminUserIds)).then((rows) => rows.map((r) => r.id)) : [];
  const bookingIds = [...nonAdminUserIds, ...vendorProfileIds].length ? await db.select({ id: bookings.id }).from(bookings).where(or(inArray(bookings.organiserId, nonAdminUserIds), inArray(bookings.vendorId, vendorProfileIds))).then((rows) => rows.map((r) => r.id)) : [];

  if (bookingIds.length) {
    await db.delete(messages).where(inArray(messages.bookingId, bookingIds));
    await db.delete(escrowTransactions).where(inArray(escrowTransactions.bookingId, bookingIds));
    await db.delete(payments).where(inArray(payments.bookingId, bookingIds));
    await db.delete(bookings).where(inArray(bookings.id, bookingIds));
  }
  if (eventIds.length) {
    await db.delete(tickets).where(inArray(tickets.eventId, eventIds));
    await db.delete(events).where(inArray(events.id, eventIds));
  }
  if (vendorProfileIds.length) {
    await db.delete(vendorCategories).where(inArray(vendorCategories.vendorId, vendorProfileIds));
    if (serviceIds.length) await db.delete(services).where(inArray(services.id, serviceIds));
    await db.delete(vendorProfiles).where(inArray(vendorProfiles.id, vendorProfileIds));
  }
  await db.delete(notifications).where(inArray(notifications.userId, nonAdminUserIds));
  await db.delete(accessRequests).where(inArray(accessRequests.email, nonAdminDemoEmails));
  await db.delete(users).where(inArray(users.email, nonAdminDemoEmails));

  console.info("[seed][purge-demo-data] removed demo accounts and related data");
}
