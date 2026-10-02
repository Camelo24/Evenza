import { db } from "@db/client";
import { eventTicketTypes, events, notifications, tickets } from "@db/schema";
import { asc, desc, eq, inArray } from "drizzle-orm";

export async function getClientData(userId: string) {
  const ownedTickets = await db
    .select({ ticket: tickets, event: events })
    .from(tickets)
    .innerJoin(events, eq(events.id, tickets.eventId))
    .where(eq(tickets.attendeeId, userId))
    .orderBy(asc(events.startsAt));
  const publicEvents = await db.select().from(events).where(eq(events.visibility, "public")).orderBy(asc(events.startsAt));
  const ticketTypes = publicEvents.length ? await db.select().from(eventTicketTypes).where(inArray(eventTicketTypes.eventId, publicEvents.map((event) => event.id))) : [];
  const notes = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  return { tickets: ownedTickets, events: publicEvents.map((event) => ({ ...event, ticketTypes: ticketTypes.filter((type) => type.eventId === event.id) })), notifications: notes };
}
