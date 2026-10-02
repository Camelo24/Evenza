import { and, asc, desc, eq, gt, inArray } from "drizzle-orm";
import { db } from "@db/client";
import { categories, events, hiringApplications, hiringDomains, hiringPosts, interviews, services, vendorCategories, vendorProfiles } from "@db/schema";

export async function getOrganiserHiringPosts(organiserId: string) {
  try {
    const posts = await db
      .select({ post: hiringPosts, event: events })
      .from(hiringPosts)
      .innerJoin(events, eq(events.id, hiringPosts.eventId))
      .where(eq(hiringPosts.organiserId, organiserId))
      .orderBy(asc(hiringPosts.deadline));
    if (!posts.length) return [];
    const postIds = posts.map((row) => row.post.id);
    const [domains, applicationRows] = await Promise.all([
      db
        .select({ domain: hiringDomains, category: categories })
        .from(hiringDomains)
        .innerJoin(categories, eq(categories.id, hiringDomains.categoryId))
        .where(inArray(hiringDomains.hiringPostId, postIds)),
      db
        .select({ application: hiringApplications, vendor: vendorProfiles })
        .from(hiringApplications)
        .innerJoin(vendorProfiles, eq(vendorProfiles.id, hiringApplications.vendorId))
        .where(inArray(hiringApplications.hiringPostId, postIds)),
    ]);
    const applicationIds = applicationRows.map((row) => row.application.id);
    const interviewRows = applicationIds.length
      ? await db.select().from(interviews).where(inArray(interviews.hiringApplicationId, applicationIds))
      : [];
    return posts.map((row) => ({
      ...row,
      domains: domains.filter((d) => d.domain.hiringPostId === row.post.id),
      applications: applicationRows
        .filter((a) => a.application.hiringPostId === row.post.id)
        .map((a) => ({ ...a, interview: interviewRows.find((i) => i.hiringApplicationId === a.application.id) })),
    }));
  } catch (err: any) {
    const cause = err?.cause ?? err;
    console.error("Database query failed in getOrganiserHiringPosts:", err, "driver cause:", cause);
    throw err;
  }
}

export async function getOpenHiringPostsForVendor(vendorId: string) {
  const now = new Date();
  const rows = await db
    .select({ post: hiringPosts, event: events, domain: hiringDomains, category: categories })
    .from(hiringDomains)
    .innerJoin(hiringPosts, eq(hiringPosts.id, hiringDomains.hiringPostId))
    .innerJoin(events, eq(events.id, hiringPosts.eventId))
    .innerJoin(categories, eq(categories.id, hiringDomains.categoryId))
    .innerJoin(vendorCategories, and(eq(vendorCategories.vendorId, vendorId), eq(vendorCategories.categoryId, hiringDomains.categoryId)))
    .where(
      and(
        eq(hiringPosts.status, "open"),
        eq(hiringDomains.status, "open"),
        gt(hiringPosts.deadline, now),
        gt(events.startsAt, now),
      ),
    )
    .orderBy(asc(hiringPosts.deadline));
  const applications = await db.select().from(hiringApplications).where(eq(hiringApplications.vendorId, vendorId));
  return rows.map((row) => ({ ...row, application: applications.find((a) => a.hiringDomainId === row.domain.id) }));
}

export async function getVendorHiringInterviews(vendorId: string) {
  return db
    .select({ application: hiringApplications, interview: interviews, event: events, category: categories })
    .from(hiringApplications)
    .innerJoin(interviews, eq(interviews.hiringApplicationId, hiringApplications.id))
    .innerJoin(hiringPosts, eq(hiringPosts.id, hiringApplications.hiringPostId))
    .innerJoin(events, eq(events.id, hiringPosts.eventId))
    .innerJoin(hiringDomains, eq(hiringDomains.id, hiringApplications.hiringDomainId))
    .innerJoin(categories, eq(categories.id, hiringDomains.categoryId))
    .where(eq(hiringApplications.vendorId, vendorId))
    .orderBy(asc(interviews.scheduledAt));
}

/** Applicant counts per event (used for the badge on the My Events cards). */
export async function getApplicantCountsByEvent(organiserId: string) {
  const rows = await db
    .select({ eventId: hiringPosts.eventId, count: hiringApplications.id })
    .from(hiringApplications)
    .innerJoin(hiringPosts, eq(hiringPosts.id, hiringApplications.hiringPostId))
    .where(eq(hiringPosts.organiserId, organiserId));
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.eventId, (map.get(r.eventId) ?? 0) + 1);
  return map;
}

export type ApplicantFilters = {
  eventId?: string;
  categoryId?: number;
  status?: "pending" | "shortlisted" | "accepted" | "rejected";
};

/** Cross-event applicants for an organiser, with a snapshot of the provider profile. */
export async function getOrganiserApplicants(organiserId: string, filters: ApplicantFilters = {}) {
  const postFilter = eq(hiringPosts.organiserId, organiserId);
  const conditions = [postFilter];
  if (filters.eventId) conditions.push(eq(hiringPosts.eventId, filters.eventId));
  if (filters.categoryId) conditions.push(eq(hiringDomains.categoryId, filters.categoryId));
  if (filters.status) conditions.push(eq(hiringApplications.status, filters.status));

  try {
    const rows = await db
      .select({
        application: hiringApplications,
        post: hiringPosts,
        domain: hiringDomains,
        event: events,
        category: categories,
        vendor: vendorProfiles,
      })
      .from(hiringApplications)
      .innerJoin(hiringPosts, eq(hiringPosts.id, hiringApplications.hiringPostId))
      .innerJoin(hiringDomains, eq(hiringDomains.id, hiringApplications.hiringDomainId))
      .innerJoin(events, eq(events.id, hiringPosts.eventId))
      .innerJoin(categories, eq(categories.id, hiringDomains.categoryId))
      .innerJoin(vendorProfiles, eq(vendorProfiles.id, hiringApplications.vendorId))
      .where(and(...conditions))
      .orderBy(desc(hiringApplications.createdAt));

    if (!rows.length) return [] as Array<ReturnType<typeof shape>[0]>;

    const applicationIds = rows.map((r) => r.application.id);
    const vendorIds = Array.from(new Set(rows.map((r) => r.vendor.id)));
    const [interviewRows, serviceRows] = await Promise.all([
      db.select().from(interviews).where(inArray(interviews.hiringApplicationId, applicationIds)),
      db.select().from(services).where(and(inArray(services.vendorId, vendorIds), eq(services.active, true))),
    ]);
    return shape(rows, interviewRows, serviceRows);
  } catch (err: any) {
    const cause = err?.cause ?? err;
    console.error("Database query failed in getOrganiserApplicants:", err, "driver cause:", cause);
    throw err;
  }
}

function shape(
  rows: Array<{ application: typeof hiringApplications.$inferSelect; post: typeof hiringPosts.$inferSelect; domain: typeof hiringDomains.$inferSelect; event: typeof events.$inferSelect; category: typeof categories.$inferSelect; vendor: typeof vendorProfiles.$inferSelect }>,
  interviewRows: Array<typeof interviews.$inferSelect>,
  serviceRows: Array<typeof services.$inferSelect>,
) {
  return rows.map((r) => ({
    ...r,
    interview: interviewRows.find((i) => i.hiringApplicationId === r.application.id) ?? null,
    portfolio: serviceRows.filter((s) => s.vendorId === r.vendor.id).slice(0, 4),
  }));
}
