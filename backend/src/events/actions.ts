"use server";

import crypto from "crypto";
import { db } from "@db/client";
import { events, eventVendors, vendorProfiles } from "@db/schema";
import { requireRole } from "@backend/auth/session";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@backend/auth/actions";

// ---- Module 6: event CRUD with vendor assignment ----------------------------

const eventSchema = z.object({
  title: z.string().trim().min(3, "Give the event a title."),
  eventType: z.string().trim().min(2, "Choose an event type."),
  venue: z.string().trim().min(3, "Enter the venue."),
  city: z.string().trim().min(2, "Enter the city."),
  startsAt: z.string().min(1, "Choose a start date and time."),
  guestCount: z.coerce.number().int().min(1).max(50000),
  visibility: z.enum(["private", "public"]),
  ticketPrice: z.coerce.number().int().min(0).optional(),
  description: z.string().trim().max(2000).optional(),
});

export async function createEvent(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("organiser");
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the event details." };
  const startsAt = new Date(parsed.data.startsAt);
  if (Number.isNaN(startsAt.getTime()) || startsAt < new Date()) return { ok: false, message: "The event must start in the future." };
  if (parsed.data.visibility === "public" && parsed.data.ticketPrice === undefined) return { ok: false, message: "Set a ticket price for a public event." };
  await db.insert(events).values({
    id: crypto.randomUUID(),
    organiserId: session.userId,
    title: parsed.data.title,
    eventType: parsed.data.eventType,
    venue: parsed.data.venue,
    city: parsed.data.city,
    startsAt,
    guestCount: parsed.data.guestCount,
    visibility: parsed.data.visibility,
    ticketPrice: parsed.data.visibility === "public" ? parsed.data.ticketPrice ?? null : null,
    description: parsed.data.description,
  });
  revalidatePath("/events");
  return { ok: true, message: "Event created." };
}

export async function deleteEvent(formData: FormData) {
  const session = await requireRole("organiser");
  const parsed = z.object({ eventId: z.string().uuid() }).parse(Object.fromEntries(formData));
  await db.delete(events).where(and(eq(events.id, parsed.eventId), eq(events.organiserId, session.userId)));
  revalidatePath("/events");
}

export async function assignEventVendor(formData: FormData) {
  const session = await requireRole("organiser");
  const parsed = z.object({ eventId: z.string().uuid(), vendorId: z.string().uuid() }).parse(Object.fromEntries(formData));
  const [event] = await db.select().from(events).where(and(eq(events.id, parsed.eventId), eq(events.organiserId, session.userId))).limit(1);
  const [vendor] = await db.select().from(vendorProfiles).where(eq(vendorProfiles.id, parsed.vendorId)).limit(1);
  if (!event || !vendor) return;
  await db.insert(eventVendors).values({ eventId: event.id, vendorId: vendor.id }).onConflictDoNothing();
  revalidatePath("/events");
}

export async function removeEventVendor(formData: FormData) {
  const session = await requireRole("organiser");
  const parsed = z.object({ eventId: z.string().uuid(), vendorId: z.string().uuid() }).parse(Object.fromEntries(formData));
  const [event] = await db.select().from(events).where(and(eq(events.id, parsed.eventId), eq(events.organiserId, session.userId))).limit(1);
  if (!event) return;
  await db.delete(eventVendors).where(and(eq(eventVendors.eventId, event.id), eq(eventVendors.vendorId, parsed.vendorId)));
  revalidatePath("/events");
}
