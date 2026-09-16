import { releaseExpiredEscrows } from "@backend/escrow/jobs/auto-release.job";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization");
  if (!expected || provided !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorised scheduler request" }, { status: 401 });
  }
  const result = await releaseExpiredEscrows();
  return NextResponse.json(result);
}
