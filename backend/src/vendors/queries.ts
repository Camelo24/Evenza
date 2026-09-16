import { db } from "@db/client";
import { categories, services, vendorCategories, vendorProfiles, vendorUnavailableDates } from "@db/schema";
import { and, asc, desc, eq, gte, ilike, inArray, or } from "drizzle-orm";

export async function getCategories() {
  return db.select().from(categories).orderBy(asc(categories.id));
}

export async function getVendors(filters?: { q?: string; category?: string; city?: string; featured?: boolean }) {
  const conditions: any[] = [];
  if (filters?.q) conditions.push(or(ilike(vendorProfiles.businessName, `%${filters.q}%`), ilike(vendorProfiles.tagline, `%${filters.q}%`))!);
  if (filters?.city && filters.city !== "all") conditions.push(eq(vendorProfiles.city, filters.city));
  if (filters?.featured) conditions.push(eq(vendorProfiles.featured, true));

  let profiles = await db
    .select()
    .from(vendorProfiles)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(vendorProfiles.featured), desc(vendorProfiles.rating));

  if (filters?.category && filters.category !== "all") {
    const matches = await db
      .select({ vendorId: vendorCategories.vendorId })
      .from(vendorCategories)
      .innerJoin(categories, eq(categories.id, vendorCategories.categoryId))
      .where(eq(categories.slug, filters.category));
    const ids = matches.map((match) => match.vendorId);
    profiles = ids.length ? profiles.filter((profile) => ids.includes(profile.id)) : [];
  }

  if (!profiles.length) return [];
  const links = await db
    .select({ vendorId: vendorCategories.vendorId, name: categories.name, slug: categories.slug })
    .from(vendorCategories)
    .innerJoin(categories, eq(categories.id, vendorCategories.categoryId))
    .where(inArray(vendorCategories.vendorId, profiles.map((profile) => profile.id)));
  return profiles.map((profile) => ({ ...profile, categories: links.filter((link) => link.vendorId === profile.id) }));
}

export async function getVendor(slug: string) {
  const [profile] = await db.select().from(vendorProfiles).where(eq(vendorProfiles.slug, slug)).limit(1);
  if (!profile) return null;
  const [serviceRows, categoryRows, unavailable] = await Promise.all([
    db.select().from(services).where(and(eq(services.vendorId, profile.id), eq(services.active, true))).orderBy(asc(services.price)),
    db.select({ name: categories.name, slug: categories.slug }).from(vendorCategories).innerJoin(categories, eq(categories.id, vendorCategories.categoryId)).where(eq(vendorCategories.vendorId, profile.id)),
    db.select().from(vendorUnavailableDates).where(and(eq(vendorUnavailableDates.vendorId, profile.id), gte(vendorUnavailableDates.date, new Date()))).orderBy(asc(vendorUnavailableDates.date)),
  ]);
  return { ...profile, services: serviceRows, categories: categoryRows, unavailableDates: unavailable };
}
