import { releaseExpiredEscrows } from "@backend/escrow/jobs/auto-release.job";
import { closeExpiredHiringPosts } from "@backend/hiring/jobs/close-expired-posts.job";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization");
  if (!expected || provided !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorised scheduler request" }, { status: 401 });
  }
  const [escrow, hiring] = await Promise.all([releaseExpiredEscrows(), closeExpiredHiringPosts()]);
  return NextResponse.json({ escrow, hiring });
}
