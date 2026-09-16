import { NextResponse } from "next/server";
import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "@db/client";
import { bookings, messages, vendorProfiles } from "@db/schema";
import { getSession } from "@backend/auth/session";

const chatStatuses = ["confirmed", "in_progress", "awaiting_review", "disputed"];

export async function POST(_request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const session = await getSession();
  const { bookingId } = await params;
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const [record] = await db.select({ booking: bookings, vendor: vendorProfiles }).from(bookings).innerJoin(vendorProfiles, eq(vendorProfiles.id, bookings.vendorId)).where(eq(bookings.id, bookingId)).limit(1);
  if (!record || !chatStatuses.includes(record.booking.status) || (record.booking.organiserId !== session.userId && record.vendor.userId !== session.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await db.update(messages).set({ readAt: new Date() }).where(and(eq(messages.bookingId, bookingId), ne(messages.senderId, session.userId), isNull(messages.readAt)));
  return NextResponse.json({ ok: true });
}
