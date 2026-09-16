import { db } from "@db/client";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  await db.execute(sql`select 1`);
  return NextResponse.json({ ok: true, service: "trufeta" });
}
