import { and, eq, lte } from "drizzle-orm";
import { db } from "@db/client";
import { hiringPosts } from "@db/schema";

/** Closes recruitment posts whose application deadline has passed. */
export async function closeExpiredHiringPosts(now = new Date()) {
  const closed = await db
    .update(hiringPosts)
    .set({ status: "closed", closedAt: now })
    .where(and(eq(hiringPosts.status, "open"), lte(hiringPosts.deadline, now)))
    .returning({ id: hiringPosts.id });
  return { closed: closed.length, processedAt: now.toISOString() };
}
