import { db } from "@db/client";
import { events, notifications, tickets } from "@db/schema";
import { asc, desc, eq } from "drizzle-orm";

export async function getClientData(userId: string) {
  const ownedTickets = await db
    .select({ ticket: tickets, event: events })
    .from(tickets)
    .innerJoin(events, eq(events.id, tickets.eventId))
    .where(eq(tickets.attendeeId, userId))
    .orderBy(asc(events.startsAt));
  const publicEvents = await db.select().from(events).where(eq(events.visibility, "public")).orderBy(asc(events.startsAt));
  const notes = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  return { tickets: ownedTickets, events: publicEvents, notifications: notes };
}
