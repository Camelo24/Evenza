import { NextResponse } from "next/server";
import { getSession } from "@backend/auth/session";
import { db } from "@db/client";
import { vendorProfiles } from "@db/schema";
import { eq } from "drizzle-orm";
import { getServiceProviderWallet } from "@backend/wallets/service";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "service_provider") return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const [profile] = await db.select({ id: vendorProfiles.id }).from(vendorProfiles).where(eq(vendorProfiles.userId, session.userId)).limit(1);
  if (!profile) return NextResponse.json({ error: "Service provider profile not found" }, { status: 404 });
  return NextResponse.json(await getServiceProviderWallet(profile.id));
}
