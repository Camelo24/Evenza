import { db } from "@db/client";
import { and, asc, desc, eq, gt, lt, sql } from "drizzle-orm";
import { events } from "@db/schema";

export async function getLiveEvents(limit = 6) {
  const now = new Date();
  return db
    .select()
    .from(events)
    .where(and(eq(events.visibility, "public"), lt(events.startsAt, now), gt(events.startsAt, sql`now() - interval '8 hours'`)))
    .orderBy(desc(events.startsAt))
    .limit(limit);
}

export async function getUpcomingEvents(limit = 6) {
  const now = new Date();
  return db
    .select()
    .from(events)
    .where(and(eq(events.visibility, "public"), gt(events.startsAt, now)))
    .orderBy(asc(events.startsAt))
    .limit(limit);
}
