import { db } from "@db/client";
import { and, asc, desc, eq, gt, lt, sql } from "drizzle-orm";
import { eventVendorApplications, events, users } from "@db/schema";

export async function getLiveEvents(limit = 6) {
  const now = new Date();
  const rows = await db
    .select({ event: events, organiserName: users.fullName, organiserVerified: users.organizerVerificationStatus })
    .from(events)
    .leftJoin(users, eq(events.organiserId, users.id))
    .where(and(eq(events.visibility, "public"), lt(events.startsAt, now), gt(events.startsAt, sql`now() - interval '8 hours'`)))
    .orderBy(desc(events.startsAt))
    .limit(limit);
  return rows.map(({ event, organiserName, organiserVerified }) => ({ ...event, organiserName, organiserVerified: organiserVerified === "approved" }));
}

export async function getUpcomingEvents(limit = 6) {
  const now = new Date();
  const rows = await db
    .select({ event: events, organiserName: users.fullName, organiserVerified: users.organizerVerificationStatus })
    .from(events)
    .leftJoin(users, eq(events.organiserId, users.id))
    .where(and(eq(events.visibility, "public"), gt(events.startsAt, now)))
    .orderBy(asc(events.startsAt))
    .limit(limit);
  return rows.map(({ event, organiserName, organiserVerified }) => ({ ...event, organiserName, organiserVerified: organiserVerified === "approved" }));
}

export async function getPublicEventById(eventId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)) return null;
  const [row] = await db
    .select({ event: events, organiserName: users.fullName, organiserVerified: users.organizerVerificationStatus })
    .from(events)
    .leftJoin(users, eq(events.organiserId, users.id))
    .where(and(eq(events.id, eventId), eq(events.visibility, "public")))
    .limit(1);
  return row ? { ...row.event, organiserName: row.organiserName, organiserVerified: row.organiserVerified === "approved" } : null;
}

export async function getVendorEventApplications(vendorId: string) {
  return db.select({ eventId: eventVendorApplications.eventId, status: eventVendorApplications.status })
    .from(eventVendorApplications).where(eq(eventVendorApplications.vendorId, vendorId));
}
