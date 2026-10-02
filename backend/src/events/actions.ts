"use server";

import crypto from "crypto";
import { db } from "@db/client";
import { categories, eventTicketTypes, eventVendorApplications, events, eventVendors, hiringDomains, hiringPosts, notifications, vendorCategories, vendorProfiles } from "@db/schema";
import { requireRole } from "@backend/auth/session";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@backend/auth/actions";
import { saveEventCover } from "@backend/uploads/event-covers";

// ---- Module 6: event CRUD with vendor assignment ----------------------------

const hiringDomainsSchema = z
  .array(
    z.object({
      categoryId: z.number().int().positive({ message: "Choose a professional type." }),
      placesNeeded: z.number().int().min(1, { message: "At least 1 person is required." }).max(1000),
      unitPrice: z.number().int().min(0, { message: "Unit price cannot be negative." }).max(1_000_000_000),
      currency: z.enum(["XAF", "USD", "EUR", "GBP"]).default("XAF"),
      requirementNote: z.string().trim().max(600).optional().nullable(),
      budget: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
    }),
  )
  .min(1)
  .max(20);

/** Insert (or replace) the hiring post + domains for an event within an open transaction. */
async function writeHiringPost(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], args: { eventId: string; organiserId: string; deadline: Date; domains: z.infer<typeof hiringDomainsSchema> }) {
  const [existing] = await tx.select({ id: hiringPosts.id, status: hiringPosts.status }).from(hiringPosts).where(eq(hiringPosts.eventId, args.eventId)).limit(1);
  const postId = existing?.id ?? crypto.randomUUID();
  if (existing) {
    await tx.update(hiringPosts).set({ deadline: args.deadline, status: "open" }).where(eq(hiringPosts.id, existing.id));
    await tx.delete(hiringDomains).where(eq(hiringDomains.hiringPostId, existing.id));
  } else {
    await tx.insert(hiringPosts).values({ id: postId, eventId: args.eventId, organiserId: args.organiserId, deadline: args.deadline, status: "open" });
  }
  await tx.insert(hiringDomains).values(
    args.domains.map((d) => ({
      id: crypto.randomUUID(),
      hiringPostId: postId,
      categoryId: d.categoryId,
      placesNeeded: d.placesNeeded,
      requirementNote: d.requirementNote ?? null,
      unitPrice: d.unitPrice,
      currency: d.currency,
      // Kept for backward compatibility with older listings; derived from unit price × people.
      budget: d.unitPrice * d.placesNeeded,
      status: "open" as const,
    })),
  );
  return postId;
}

function readHiringFields(formData: FormData, startsAt: Date): { deadline: Date; domains: z.infer<typeof hiringDomainsSchema> } | string | null {
  const enabled = String(formData.get("hiringEnabled") ?? "");
  if (enabled !== "on" && enabled !== "true") return null;
  const rawDeadline = String(formData.get("hiringDeadline") ?? "");
  const deadline = new Date(rawDeadline);
  if (Number.isNaN(deadline.getTime())) return "The recruitment deadline must be a valid date.";
  if (deadline >= startsAt) return "The recruitment deadline must be before the event starts.";
  let domains: z.infer<typeof hiringDomainsSchema>;
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(formData.get("hiringDomains") ?? "[]"));
  } catch {
    return "Professional entries could not be read. Please refresh and try again.";
  }
  const validation = hiringDomainsSchema.safeParse(parsed);
  if (!validation.success) {
    const first = validation.error.issues[0];
    const path = first?.path?.join(".") ?? "";
    const prefix = path ? `Row ${path.split(".")[0]} — ` : "";
    return `${prefix}${first?.message ?? "Please fix the highlighted professional fields."}`;
  }
  domains = validation.data;
  if (new Set(domains.map((d) => d.categoryId)).size !== domains.length) return "Add each professional type only once.";
  return { deadline, domains };
}

const eventSchema = z.object({
  title: z.string().trim().min(3, "Give the event a title."),
  eventType: z.string().trim().min(2, "Choose an event type."),
  venue: z.string().trim().min(3, "Enter the venue."),
  city: z.string().trim().min(2, "Enter the city."),
  startsAt: z.string().min(1, "Choose a start date and time."),
  endsAt: z.string().min(1, "Choose an end date and time."),
  guestCount: z.coerce.number().int().min(1).max(50000),
  visibility: z.enum(["private", "public"]),
  ticketPrice: z.coerce.number().int().min(0).optional(),
  ticketTypes: z.string().optional(),
  description: z.string().trim().max(2000).optional(),
});

export async function createEvent(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("organiser");
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the event details." };

  const eventImage = formData.get("coverImage");
  let coverUrl: string | null = null;

  if (eventImage instanceof File && eventImage.size > 0) {
    try {
      const savedImage = await saveEventCover(eventImage);
      coverUrl = savedImage.url;
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Upload a valid JPG, PNG, or WEBP cover image.",
      };
    }
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (Number.isNaN(startsAt.getTime()) || startsAt < new Date()) return { ok: false, message: "The event must start in the future." };
  if (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) return { ok: false, message: "The event must end after it starts." };
  let ticketTypes: { name: string; price: number }[] = [];
  try { ticketTypes = z.array(z.object({ name: z.string().trim().min(2).max(100), price: z.number().int().min(0) })).min(1).max(10).parse(parsed.data.ticketTypes ? JSON.parse(parsed.data.ticketTypes) : []); } catch { if (parsed.data.visibility === "public") return { ok: false, message: "Add at least one ticket type with a valid price." }; }
  if (parsed.data.visibility === "public" && !ticketTypes.length) return { ok: false, message: "Add at least one ticket type." };
  const eventId = crypto.randomUUID();
  const hiringInput = readHiringFields(formData, startsAt);
  if (typeof hiringInput === "string") return { ok: false, message: hiringInput };
  await db.transaction(async (tx) => {
    await tx.insert(events).values({
      id: eventId,
      organiserId: session.userId,
      title: parsed.data.title,
      eventType: parsed.data.eventType,
      venue: parsed.data.venue,
      city: parsed.data.city,
      startsAt,
      endsAt,
      guestCount: parsed.data.guestCount,
      visibility: parsed.data.visibility,
      ticketPrice: parsed.data.visibility === "public" ? parsed.data.ticketPrice ?? ticketTypes[0]?.price ?? null : null,
      description: parsed.data.description,
      coverUrl,
    });
    if (ticketTypes.length) await tx.insert(eventTicketTypes).values(ticketTypes.map((ticketType) => ({ id: crypto.randomUUID(), eventId, ...ticketType })));
    if (hiringInput) {
      await writeHiringPost(tx, { eventId, organiserId: session.userId, deadline: hiringInput.deadline, domains: hiringInput.domains });
    }
  });
  revalidatePath("/events");
  revalidatePath("/dashboard");
  if (hiringInput) revalidatePath("/applicants");
  return { ok: true, message: hiringInput ? "Event created. Hiring post published." : "Event created." };
}

export async function updateEvent(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("organiser");
  const rawEventId = formData.get("eventId");
  const eventId = typeof rawEventId === "string" ? rawEventId : null;
  if (!eventId || !/^[0-9a-fA-F-]{36}$/.test(eventId)) {
    return { ok: false, message: "Choose a valid event to update." };
  }

  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the event details." };

  const [existingEvent] = await db.select().from(events).where(and(eq(events.id, eventId), eq(events.organiserId, session.userId))).limit(1);
  if (!existingEvent) return { ok: false, message: "This event no longer exists or is not yours." };

  const eventImage = formData.get("coverImage");
  let coverUrl = existingEvent.coverUrl ?? null;

  if (eventImage instanceof File && eventImage.size > 0) {
    try {
      const savedImage = await saveEventCover(eventImage);
      coverUrl = savedImage.url;
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Upload a valid JPG, PNG, or WEBP cover image.",
      };
    }
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (Number.isNaN(startsAt.getTime()) || startsAt < new Date()) return { ok: false, message: "The event must start in the future." };
  if (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) return { ok: false, message: "The event must end after it starts." };

  await db.update(events).set({
    title: parsed.data.title,
    eventType: parsed.data.eventType,
    venue: parsed.data.venue,
    city: parsed.data.city,
    startsAt,
    endsAt,
    guestCount: parsed.data.guestCount,
    visibility: parsed.data.visibility,
    ticketPrice: parsed.data.visibility === "public" ? parsed.data.ticketPrice ?? existingEvent.ticketPrice ?? null : null,
    description: parsed.data.description,
    coverUrl,
  }).where(and(eq(events.id, eventId), eq(events.organiserId, session.userId)));

  const hiringInput = readHiringFields(formData, startsAt);
  if (typeof hiringInput === "string") return { ok: false, message: hiringInput };
  if (hiringInput) {
    await db.transaction(async (tx) => {
      await writeHiringPost(tx, { eventId, organiserId: session.userId, deadline: hiringInput.deadline, domains: hiringInput.domains });
    });
  }

  revalidatePath("/events");
  revalidatePath("/dashboard");
  return { ok: true, message: hiringInput ? "Event and hiring conditions updated." : "Event details updated." };
}

export async function applyToEvent(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("service_provider");
  const parsed = z.object({ eventId: z.string().uuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Choose a valid event." };

  const [event] = await db.select().from(events).where(and(eq(events.id, parsed.data.eventId), eq(events.visibility, "public"))).limit(1);
  const [vendor] = await db.select().from(vendorProfiles).where(eq(vendorProfiles.userId, session.userId)).limit(1);
  if (!event || event.startsAt <= new Date() || !event.serviceCategoryId) return { ok: false, message: "This event is not accepting provider applications." };
  if (!vendor) return { ok: false, message: "Create your service provider profile before applying." };

  const [match] = await db.select({ categoryId: categories.id }).from(vendorCategories)
    .innerJoin(categories, eq(categories.id, vendorCategories.categoryId))
    .where(and(eq(vendorCategories.vendorId, vendor.id), eq(categories.id, event.serviceCategoryId))).limit(1);
  if (!match) return { ok: false, message: "This event is outside your listed service domains." };

  const [application] = await db.insert(eventVendorApplications).values({ eventId: event.id, vendorId: vendor.id })
    .onConflictDoNothing().returning({ id: eventVendorApplications.id });
  if (!application) return { ok: false, message: "You have already applied to this event." };

  await db.insert(notifications).values({
    id: crypto.randomUUID(),
    userId: event.organiserId,
    title: "Service provider application",
    body: `${vendor.businessName} applied to provide services for ${event.title}.`,
    href: "/events",
  });
  revalidatePath("/vendor/dashboard/events");
  revalidatePath("/events");
  return { ok: true, message: "Application sent to the event organiser." };
}

export async function reviewEventProviderApplication(formData: FormData) {
  const session = await requireRole("organiser");
  const parsed = z.object({ applicationId: z.string().uuid(), decision: z.enum(["approved", "rejected"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const [row] = await db.select({ application: eventVendorApplications, event: events })
    .from(eventVendorApplications).innerJoin(events, eq(events.id, eventVendorApplications.eventId))
    .where(and(eq(eventVendorApplications.id, parsed.data.applicationId), eq(events.organiserId, session.userId))).limit(1);
  if (!row) return;
  await db.update(eventVendorApplications).set({ status: parsed.data.decision }).where(eq(eventVendorApplications.id, row.application.id));
  if (parsed.data.decision === "approved") {
    await db.insert(eventVendors).values({ eventId: row.event.id, vendorId: row.application.vendorId }).onConflictDoNothing();
  }
  revalidatePath("/events");
  revalidatePath("/vendor/dashboard/events");
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

export async function getCategoriesAction() {
  const { getCategories } = await import("@backend/vendors/queries");
  return getCategories();
}
