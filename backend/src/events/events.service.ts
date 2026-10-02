import crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from '@db/client';
import { eventTicketTypes, eventVendors, events, vendorProfiles } from '@db/schema';
import type { Session } from '@backend/auth/session';
import type { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  async createEvent(session: Session, input: CreateEventDto) {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);

    if (Number.isNaN(startsAt.getTime()) || startsAt < new Date()) {
      throw new Error('The event must start in the future.');
    }

    if (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) throw new Error('The event must end after it starts.');

    const eventId = crypto.randomUUID();
    return db.transaction(async (tx) => {
      const event = await tx.insert(events).values({
      id: eventId,
      organiserId: session.userId,
      title: input.title,
      eventType: input.eventType,
      venue: input.venue,
      city: input.city,
      startsAt,
      endsAt,
      guestCount: input.guestCount,
      visibility: input.visibility,
      ticketPrice: null,
      description: input.description,
      });
      return event;
    });
  }

  async deleteEvent(session: Session, eventId: string) {
    return db.delete(events).where(and(eq(events.id, eventId), eq(events.organiserId, session.userId)));
  }

  async assignVendor(session: Session, eventId: string, vendorId: string) {
    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.organiserId, session.userId)))
      .limit(1);

    const [vendor] = await db.select().from(vendorProfiles).where(eq(vendorProfiles.id, vendorId)).limit(1);

    if (!event || !vendor) return null;

    return db.insert(eventVendors).values({ eventId: event.id, vendorId: vendor.id }).onConflictDoNothing();
  }

  async removeVendor(session: Session, eventId: string, vendorId: string) {
    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.organiserId, session.userId)))
      .limit(1);

    if (!event) return null;

    return db.delete(eventVendors).where(and(eq(eventVendors.eventId, event.id), eq(eventVendors.vendorId, vendorId)));
  }
}
