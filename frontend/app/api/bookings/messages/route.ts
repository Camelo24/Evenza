import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@db/client";
import { bookingConversations, bookings, messages, vendorProfiles } from "@db/schema";
import { getSession } from "@backend/auth/session";
import { saveChatAttachment } from "@backend/uploads/chat-attachments";

const chatStatuses = ["confirmed", "in_progress", "awaiting_review", "disputed"];

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["organiser", "service_provider"].includes(session.role)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const data = await request.formData();
  const bookingId = String(data.get("bookingId") ?? "");
  const body = String(data.get("body") ?? "").trim().slice(0, 2000);
  const file = data.get("attachment");
  if (!bookingId || (!body && !(file instanceof File))) return NextResponse.json({ error: "A message or attachment is required." }, { status: 400 });

  const [record] = await db.select({ booking: bookings, vendor: vendorProfiles }).from(bookings).innerJoin(vendorProfiles, eq(vendorProfiles.id, bookings.vendorId)).where(eq(bookings.id, bookingId)).limit(1);
  if (!record || !chatStatuses.includes(record.booking.status)) return NextResponse.json({ error: "Messaging is available after a booking is confirmed." }, { status: 403 });
  if (record.booking.organiserId !== session.userId && record.vendor.userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [conversation] = await db.select({ id: bookingConversations.id }).from(bookingConversations).where(eq(bookingConversations.bookingId, bookingId)).limit(1);
  if (!conversation) return NextResponse.json({ error: "This booking conversation is not available." }, { status: 403 });

  const attachment = file instanceof File ? await saveChatAttachment(file) : null;
  const [message] = await db.insert(messages).values({
    bookingId,
    senderId: session.userId,
    body: body || "Sent a file",
    attachmentPath: attachment?.path ?? null,
    attachmentName: attachment?.name ?? null,
    attachmentType: attachment?.type ?? null,
  }).returning();
  return NextResponse.json({ message: { message, sender: { id: session.userId, fullName: session.fullName } } }, { status: 201 });
}
