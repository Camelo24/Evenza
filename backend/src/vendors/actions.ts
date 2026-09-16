"use server";

import { db } from "@db/client";
import { services, vendorProfiles } from "@db/schema";
import crypto from "crypto";
import { requireRole } from "@backend/auth/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@backend/auth/actions";

const profileSchema = z.object({
  businessName: z.string().trim().min(2).max(180),
  tagline: z.string().trim().min(8).max(240),
  description: z.string().trim().min(30).max(2000),
  city: z.string().trim().min(2).max(90),
  address: z.string().trim().min(3).max(240),
  startingPrice: z.coerce.number().int().min(0).max(100_000_000),
  imageUrl: z.string().url("Enter a valid profile image URL."),
  coverUrl: z.string().url("Enter a valid cover image URL."),
});

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 160);
}

/** Creates the marketplace profile required before a vendor can receive bookings. */
export async function createVendorProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  const vendor = await requireRole("service_provider");
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your profile details." };
  const [existing] = await db.select({ id: vendorProfiles.id }).from(vendorProfiles).where(eq(vendorProfiles.userId, vendor.userId)).limit(1);
  if (existing) return { ok: false, message: "Your vendor profile already exists." };
  const baseSlug = slugify(parsed.data.businessName) || "vendor";
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
  await db.insert(vendorProfiles).values({
    id: crypto.randomUUID(),
    userId: vendor.userId,
    slug,
    ...parsed.data,
    responseTime: "Within 2 hours",
  });
  revalidatePath("/vendor/dashboard");
  revalidatePath("/vendors");
  return { ok: true, message: "Your vendor profile is live. Add services next so organisers can book you." };
}

const serviceSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(2000),
  price: z.coerce.number().int().min(0).max(100_000_000),
  durationHours: z.coerce.number().int().min(1).max(168),
});

export async function createVendorService(_: ActionState, formData: FormData): Promise<ActionState> {
  const vendor = await requireRole("service_provider");
  const parsed = serviceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the service details." };
  const [profile] = await db.select({ id: vendorProfiles.id }).from(vendorProfiles).where(eq(vendorProfiles.userId, vendor.userId)).limit(1);
  if (!profile) return { ok: false, message: "Complete your vendor profile before adding services." };
  await db.insert(services).values({ id: crypto.randomUUID(), vendorId: profile.id, ...parsed.data });
  revalidatePath("/vendor/dashboard");
  revalidatePath("/vendors");
  return { ok: true, message: "Service added and ready for organisers to book." };
}
