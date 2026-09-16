import crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from '@db/client';
import { eventVendors, events, vendorProfiles } from '@db/schema';
import type { Session } from '@backend/auth/session';
import type { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  async createEvent(session: Session, input: CreateEventDto) {
    const startsAt = new Date(input.startsAt);

    if (Number.isNaN(startsAt.getTime()) || startsAt < new Date()) {
      throw new Error('The event must start in the future.');
    }

    if (input.visibility === 'public' && input.ticketPrice === undefined) {
      throw new Error('Set a ticket price for a public event.');
    }

    return db.insert(events).values({
      id: crypto.randomUUID(),
      organiserId: session.userId,
      title: input.title,
      eventType: input.eventType,
      venue: input.venue,
      city: input.city,
      startsAt,
      guestCount: input.guestCount,
      visibility: input.visibility,
      ticketPrice: input.visibility === 'public' ? input.ticketPrice ?? null : null,
      description: input.description,
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
