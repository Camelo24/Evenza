"use server";

import crypto from "crypto";
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "@db/client";
import { categories, events, hiringApplications, hiringDomains, hiringPosts, interviews, vendorCategories, vendorProfiles } from "@db/schema";
import { requireRole } from "@backend/auth/session";
import type { ActionState } from "@backend/auth/actions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { notify } from "@backend/notifications/service";
import { createBookingFromHiringAccept } from "@backend/bookings/records";

const domainSchema = z
  .object({
    categoryId: z.number().int().positive({ message: "Choose a professional type." }),
    placesNeeded: z.number().int().min(1, { message: "At least 1 person is required." }).max(1000),
    unitPrice: z.number().int().min(0, { message: "Unit price cannot be negative." }).max(1_000_000_000),
    currency: z.enum(["XAF", "USD", "EUR", "GBP"]).default("XAF"),
    requirementNote: z.string().trim().max(600).optional().nullable(),
    budget: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
  });
const postSchema = z.object({
  eventId: z.string().uuid(),
  deadline: z.string().min(1),
  domains: z.string().min(2),
});

function refreshHiringViews() {
  revalidatePath("/events");
  revalidatePath("/applicants");
  revalidatePath("/vendor/dashboard/events");
}

async function resolveEventOwnedByOrganiser(eventId: string, organiserId: string) {
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.organiserId, organiserId)))
    .limit(1);
  return event ?? null;
}

async function validateDomains(raw: z.infer<typeof domainSchema>[]): Promise<string | null> {
  if (!raw.length || raw.length > 20) return "Choose at least one service domain.";
  if (new Set(raw.map((d) => d.categoryId)).size !== raw.length) return "Add each service domain only once.";
  if (raw.some((d) => !Number.isFinite(d.unitPrice) || d.unitPrice < 0)) return "Every professional needs a unit price of 0 or more.";
  if (raw.some((d) => !Number.isFinite(d.placesNeeded) || d.placesNeeded < 1)) return "Every professional needs at least 1 person.";
  const validCategories = await db.select({ id: categories.id }).from(categories);
  const validIds = new Set(validCategories.map((c) => c.id));
  if (raw.some((d) => !validIds.has(d.categoryId))) return "One of the selected service domains is unavailable.";
  return null;
}

/** Create OR replace the hiring post for an event (idempotent per event while still open). */
async function upsertHiringPost(eventId: string, organiserId: string, deadline: Date, domains: z.infer<typeof domainSchema>[]) {
  const [existing] = await db.select().from(hiringPosts).where(eq(hiringPosts.eventId, eventId)).limit(1);
  if (existing && existing.status === "closed") {
    return { error: "This recruitment post is already closed and cannot be edited." } as { error?: string; postId?: string };
  }
  const postId = existing?.id ?? crypto.randomUUID();
  await db.transaction(async (tx) => {
    if (existing) {
      await tx.update(hiringPosts).set({ deadline, status: "open" }).where(eq(hiringPosts.id, existing.id));
      await tx.delete(hiringDomains).where(eq(hiringDomains.hiringPostId, existing.id));
    } else {
      await tx.insert(hiringPosts).values({ id: postId, eventId, organiserId, deadline, status: "open" });
    }
    await tx.insert(hiringDomains).values(
      domains.map((d) => ({
        id: crypto.randomUUID(),
        hiringPostId: postId,
        categoryId: d.categoryId,
        placesNeeded: d.placesNeeded,
        requirementNote: d.requirementNote ?? null,
        unitPrice: d.unitPrice,
        currency: d.currency,
        // Derived total kept for backward compatibility with older listings.
        budget: d.unitPrice * d.placesNeeded,
        status: "open" as const,
      })),
    );
  });
  return { postId } as { error?: string; postId?: string };
}

export async function createHiringPost(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("organiser");
  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Provide a deadline and at least one service domain." };
  const deadline = new Date(parsed.data.deadline);
  if (Number.isNaN(deadline.getTime())) return { ok: false, message: "The recruitment deadline must be a valid date." };
  let domains: z.infer<typeof domainSchema>[];
  let raw: unknown;
  try {
    raw = JSON.parse(parsed.data.domains || "[]");
  } catch {
    return { ok: false, message: "Professional entries could not be read. Please refresh and try again." };
  }
  const domainsValidation = domainSchema.array().safeParse(raw);
  if (!domainsValidation.success) {
    const first = domainsValidation.error.issues[0];
    const rowPrefix = first?.path?.[0] != null ? `Row ${String(first.path[0])} — ` : "";
    return { ok: false, message: `${rowPrefix}${first?.message ?? "Please fix the professional entries."}` };
  }
  domains = domainsValidation.data;

  const event = await resolveEventOwnedByOrganiser(parsed.data.eventId, session.userId);
  if (!event) return { ok: false, message: "You can only create a hiring post for one of your events." };
  if (deadline >= event.startsAt) return { ok: false, message: "The recruitment deadline must be before the event starts." };

  const domainError = await validateDomains(domains);
  if (domainError) return { ok: false, message: domainError };

  const result = await upsertHiringPost(event.id, session.userId, deadline, domains);
  if (result.error) return { ok: false, message: result.error };
  refreshHiringViews();
  return { ok: true, message: "Hiring conditions saved." };
}

export async function updateHiringConditions(_: ActionState, formData: FormData): Promise<ActionState> {
  return createHiringPost(_, formData);
}

export async function applyToHiringDomain(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("service_provider");
  const parsed = z.object({ hiringPostId: z.string().uuid(), hiringDomainId: z.string().uuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Choose a valid recruitment domain." };
  const [vendor] = await db.select().from(vendorProfiles).where(eq(vendorProfiles.userId, session.userId)).limit(1);
  if (!vendor) return { ok: false, message: "Create your service provider profile before applying." };
  const result = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ post: hiringPosts, domain: hiringDomains, event: events })
      .from(hiringDomains)
      .innerJoin(hiringPosts, eq(hiringPosts.id, hiringDomains.hiringPostId))
      .innerJoin(events, eq(events.id, hiringPosts.eventId))
      .where(and(eq(hiringDomains.id, parsed.data.hiringDomainId), eq(hiringPosts.id, parsed.data.hiringPostId)))
      .limit(1);
    if (!row || row.post.status !== "open" || row.post.deadline <= new Date() || row.domain.status !== "open" || row.domain.placesFilled >= row.domain.placesNeeded)
      return { error: "This recruitment domain is closed." };
    const [match] = await tx
      .select({ categoryId: vendorCategories.categoryId })
      .from(vendorCategories)
      .where(and(eq(vendorCategories.vendorId, vendor.id), eq(vendorCategories.categoryId, row.domain.categoryId)))
      .limit(1);
    if (!match) return { error: "This recruitment domain is outside your listed services." };
    const [application] = await tx
      .insert(hiringApplications)
      .values({ hiringPostId: row.post.id, hiringDomainId: row.domain.id, vendorId: vendor.id })
      .onConflictDoNothing()
      .returning({ id: hiringApplications.id });
    if (!application) return { error: "You have already applied for this domain." };
    return { event: row.event, post: row.post, applicationId: application.id };
  });
  if ("error" in result && typeof result.error === "string") return { ok: false, message: result.error };
  await notify({
    userId: result.post.organiserId,
    title: "Hiring application",
    body: `${vendor.businessName} applied to the recruitment post for ${result.event.title}.`,
    href: "/applicants",
  });
  refreshHiringViews();
  return { ok: true, message: "Application sent to the organiser." };
}

/** Shortlist a pending application (Applied → Shortlisted). Plain form-action for the /events and /applicants cards. */
export async function shortlistHiringApplication(formData: FormData) {
  const session = await requireRole("organiser");
  const parsed = z.object({ applicationId: z.string().uuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const [row] = await db
    .select({ application: hiringApplications, post: hiringPosts, vendor: vendorProfiles, event: events })
    .from(hiringApplications)
    .innerJoin(hiringPosts, eq(hiringPosts.id, hiringApplications.hiringPostId))
    .innerJoin(events, eq(events.id, hiringPosts.eventId))
    .innerJoin(vendorProfiles, eq(vendorProfiles.id, hiringApplications.vendorId))
    .where(and(eq(hiringApplications.id, parsed.data.applicationId), eq(hiringPosts.organiserId, session.userId)))
    .limit(1);
  if (!row || row.application.status !== "pending") return;
  await db.update(hiringApplications).set({ status: "shortlisted" }).where(eq(hiringApplications.id, row.application.id));
  await notify({
    userId: row.vendor.userId,
    title: "Shortlisted",
    body: `You've been shortlisted for ${row.event.title}. The organiser will be in touch about next steps.`,
    href: "/vendor/dashboard/events",
  });
  refreshHiringViews();
}

export async function reviewHiringApplication(formData: FormData) {
  const session = await requireRole("organiser");
  const parsed = z.object({ applicationId: z.string().uuid(), decision: z.enum(["accepted", "rejected"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const outcome = await db.transaction(async (tx): Promise<{ error?: string; vendor?: typeof vendorProfiles.$inferSelect; event?: typeof events.$inferSelect; domain?: typeof hiringDomains.$inferSelect; decision?: "accepted" | "rejected"; booking?: unknown }> => {
    const [row] = await tx
      .select({ application: hiringApplications, post: hiringPosts, domain: hiringDomains, event: events, vendor: vendorProfiles })
      .from(hiringApplications)
      .innerJoin(hiringPosts, eq(hiringPosts.id, hiringApplications.hiringPostId))
      .innerJoin(hiringDomains, eq(hiringDomains.id, hiringApplications.hiringDomainId))
      .innerJoin(events, eq(events.id, hiringPosts.eventId))
      .innerJoin(vendorProfiles, eq(vendorProfiles.id, hiringApplications.vendorId))
      .where(and(eq(hiringApplications.id, parsed.data.applicationId), eq(hiringPosts.organiserId, session.userId)))
      .limit(1);
    if (!row) return { error: "Application not found." };
    if (!["pending", "shortlisted"].includes(row.application.status)) return { error: "This application has already been decided." };
    if (parsed.data.decision === "rejected") {
      await tx.update(hiringApplications).set({ status: "rejected" }).where(eq(hiringApplications.id, row.application.id));
      return { vendor: row.vendor, event: row.event, domain: row.domain, decision: "rejected" as const };
    }
    if (row.post.status !== "open" || row.post.deadline <= new Date()) return { error: "The recruitment post is closed." };
    // Conditional increment is the capacity gate: concurrent acceptances cannot exceed placesNeeded.
    const [domain] = await tx
      .update(hiringDomains)
      .set({ placesFilled: sql`${hiringDomains.placesFilled} + 1` })
      .where(and(eq(hiringDomains.id, row.domain.id), eq(hiringDomains.status, "open"), lt(hiringDomains.placesFilled, row.domain.placesNeeded)))
      .returning();
    if (!domain) return { error: "All places for this domain are already filled." };
    await tx.update(hiringApplications).set({ status: "accepted" }).where(eq(hiringApplications.id, row.application.id));
    if (domain.placesFilled + 1 >= domain.placesNeeded) {
      await tx.update(hiringDomains).set({ status: "closed" }).where(eq(hiringDomains.id, domain.id));
    }
    const openDomains = await tx
      .select({ id: hiringDomains.id })
      .from(hiringDomains)
      .where(and(eq(hiringDomains.hiringPostId, row.post.id), eq(hiringDomains.status, "open")))
      .limit(1);
    if (!openDomains.length) {
      await tx.update(hiringPosts).set({ status: "closed", closedAt: new Date() }).where(and(eq(hiringPosts.id, row.post.id), eq(hiringPosts.status, "open")));
    }
    // Reuse the existing Booking flow (bookings + contracts + bookingConversations)
    // through the shared helper so we never duplicate booking logic.
    const booking = await createBookingFromHiringAccept(tx, {
      organiserId: session.userId,
      vendorId: row.vendor.id,
      event: row.event,
      categoryDomain: row.domain,
    });
    return { vendor: row.vendor, event: row.event, domain: row.domain, decision: "accepted" as const, booking };
  });
  if (outcome.error || !outcome.vendor || !outcome.event || !outcome.decision) return;
  await notify({
    userId: outcome.vendor.userId,
    title: `Hiring application ${outcome.decision}`,
    body:
      outcome.decision === "accepted"
        ? `You were accepted for ${outcome.event.title}. A protected booking is ready for your confirmation.`
        : `Your application for ${outcome.event.title} was ${outcome.decision}.`,
    href: "/vendor/dashboard/bookings",
  });
  refreshHiringViews();
}

export async function scheduleInterview(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("organiser");
  const parsed = z
    .object({
      applicationId: z.string().uuid(),
      scheduledAt: z.string().min(1),
      meetingUrl: z.string().url().optional().nullable().or(z.literal("")),
      location: z.string().trim().max(240).optional().nullable().or(z.literal("")),
      note: z.string().trim().max(1000).optional().nullable().or(z.literal("")),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Provide a valid interview time and a meeting link or location." };
  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) return { ok: false, message: "Provide a valid interview time." };
  const meetingUrl = parsed.data.meetingUrl?.trim() || null;
  const location = parsed.data.location?.trim() || null;
  const note = parsed.data.note?.trim() || null;
  if (!meetingUrl && !location) return { ok: false, message: "Add a meeting link or a physical location." };
  const [application] = await db
    .select({ application: hiringApplications, post: hiringPosts, vendor: vendorProfiles, event: events })
    .from(hiringApplications)
    .innerJoin(hiringPosts, eq(hiringPosts.id, hiringApplications.hiringPostId))
    .innerJoin(events, eq(events.id, hiringPosts.eventId))
    .innerJoin(vendorProfiles, eq(vendorProfiles.id, hiringApplications.vendorId))
    .where(and(eq(hiringApplications.id, parsed.data.applicationId), eq(hiringPosts.organiserId, session.userId)))
    .limit(1);
  if (!application) return { ok: false, message: "Application not found." };
  if (!["pending", "shortlisted"].includes(application.application.status)) return { ok: false, message: "Only pending or shortlisted applications can be interviewed." };
  await db
    .insert(interviews)
    .values({ id: crypto.randomUUID(), hiringApplicationId: application.application.id, organiserId: session.userId, scheduledAt, meetingUrl, location, note, status: "scheduled" })
    .onConflictDoUpdate({
      target: interviews.hiringApplicationId,
      set: { scheduledAt, meetingUrl, location, note, status: "scheduled", completedAt: null, cancelledAt: null, updatedAt: new Date() },
    });
  // Move pending → shortlisted so the flow is Applied → Shortlisted → Interview scheduled.
  if (application.application.status === "pending") {
    await db.update(hiringApplications).set({ status: "shortlisted" }).where(eq(hiringApplications.id, application.application.id));
  }
  const where = meetingUrl ? ` Please join via ${meetingUrl}.` : location ? ` Location: ${location}.` : "";
  await notify({
    userId: application.vendor.userId,
    title: "Interview scheduled",
    body: `${application.event.title}: meeting ${scheduledAt.toLocaleString("en-CM", { dateStyle: "medium", timeStyle: "short" })}.${where}${note ? ` Note: ${note}` : ""}`,
    href: "/vendor/dashboard/events",
  });
  refreshHiringViews();
  return { ok: true, message: "Interview scheduled." };
}

export async function updateInterviewStatus(formData: FormData) {
  const session = await requireRole("organiser");
  const parsed = z.object({ interviewId: z.string().uuid(), status: z.enum(["completed", "cancelled"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const now = new Date();
  await db
    .update(interviews)
    .set({ status: parsed.data.status, completedAt: parsed.data.status === "completed" ? now : null, cancelledAt: parsed.data.status === "cancelled" ? now : null, updatedAt: now })
    .where(and(eq(interviews.id, parsed.data.interviewId), eq(interviews.organiserId, session.userId), eq(interviews.status, "scheduled")));
  refreshHiringViews();
}

/** Close a hiring post manually (organiser action). */
export async function closeHiringPost(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("organiser");
  const parsed = z.object({ hiringPostId: z.string().uuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Invalid post." };
  const [post] = await db
    .select()
    .from(hiringPosts)
    .where(and(eq(hiringPosts.id, parsed.data.hiringPostId), eq(hiringPosts.organiserId, session.userId)))
    .limit(1);
  if (!post) return { ok: false, message: "Post not found." };
  await db.transaction(async (tx) => {
    await tx.update(hiringPosts).set({ status: "closed", closedAt: new Date() }).where(eq(hiringPosts.id, post.id));
    const domains = await tx.select({ id: hiringDomains.id }).from(hiringDomains).where(eq(hiringDomains.hiringPostId, post.id));
    if (domains.length) {
      await tx.update(hiringDomains).set({ status: "closed" }).where(inArray(hiringDomains.id, domains.map((d) => d.id)));
    }
  });
  refreshHiringViews();
  return { ok: true, message: "Recruitment closed." };
}
