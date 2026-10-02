import { db } from "@db/client";
import { reviews, users, vendorProfiles } from "@db/schema";
import { and, desc, eq, gte } from "drizzle-orm";

/** Public, positive reviews for marketing surfaces (hidden ones stay private). */
export async function getPublicReviews(limit = 9) {
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      authorName: users.fullName,
      vendorName: vendorProfiles.businessName,
      vendorSlug: vendorProfiles.slug,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.authorId))
    .innerJoin(vendorProfiles, eq(vendorProfiles.id, reviews.vendorId))
    .where(and(eq(reviews.isHidden, false), gte(reviews.rating, 4)))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}
