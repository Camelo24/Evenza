"use server";

import { db } from "@db/client";
import { bookings, escrowTransactions, reviews, vendorProfiles } from "@db/schema";
import { requireRole } from "@backend/auth/session";
import { notify } from "@backend/notifications/service";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@backend/auth/actions";

// ---- Module 11: reviews unlock only once escrow is released ------------------

const schema = z.object({
  bookingId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(6, "Add a short comment.").max(2000),
});

export async function submitReview(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("organiser");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the review." };
  const [record] = await db
    .select({ booking: bookings, escrow: escrowTransactions })
    .from(bookings)
    .innerJoin(escrowTransactions, eq(escrowTransactions.bookingId, bookings.id))
    .where(and(eq(bookings.id, parsed.data.bookingId), eq(bookings.organiserId, session.userId), eq(bookings.status, "completed")))
    .limit(1);
  if (!record) return { ok: false, message: "Reviews unlock only after escrow has released." };
  if (!["released", "split"].includes(record.escrow.status)) return { ok: false, message: "Escrow has not released yet." };
  if (record.booking.reviewSubmitted) return { ok: false, message: "You have already reviewed this booking." };

  await db.transaction(async (tx) => {
    await tx.insert(reviews).values({
      bookingId: record.booking.id,
      vendorId: record.booking.vendorId,
      authorId: session.userId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });
    await tx.update(bookings).set({ reviewSubmitted: true, updatedAt: new Date() }).where(eq(bookings.id, record.booking.id));
    // Recompute vendor rating and review count from the reviews table.
    await tx.execute(sql`
      update vendor_profiles set
        rating = coalesce((select round(avg(rating)::numeric, 1) from reviews where vendor_id = ${record.booking.vendorId}), 0),
        review_count = (select count(*) from reviews where vendor_id = ${record.booking.vendorId})
      where id = ${record.booking.vendorId}
    `);
  });

  const [profile] = await db.select().from(vendorProfiles).where(eq(vendorProfiles.id, record.booking.vendorId)).limit(1);
  await notify({
    userId: profile.userId,
    title: "New review",
    body: `${session.fullName} left you a ${parsed.data.rating}-star review.`,
    href: "/vendor/dashboard",
  });
  revalidatePath("/dashboard");
  revalidatePath(`/vendors/${profile.slug}`);
  return { ok: true, message: "Thank you — your review is published." };
}
