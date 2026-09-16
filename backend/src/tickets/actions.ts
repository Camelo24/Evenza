"use server";

import { db } from "@db/client";
import crypto from "crypto";
import { events, tickets, users } from "@db/schema";
import { requireRole } from "@backend/auth/session";
import { notify } from "@backend/notifications/service";
import { authorize } from "@backend/payments/providers/campay.provider";
import { and, eq, gt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@backend/auth/actions";

const ticketPurchaseSchema = z.object({
  eventId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(20),
  phoneNumber: z.string().trim().regex(/^(\+?237)?[26]\d{8}$/, "Enter a valid Cameroonian mobile number."),
});

/** Authorises mobile money and issues one QR ticket for a public event order. */
export async function purchaseTicket(_: ActionState, formData: FormData): Promise<ActionState> {
  const client = await requireRole("client");
  const parsed = ticketPurchaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your ticket details." };

  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, parsed.data.eventId), eq(events.visibility, "public"), gt(events.startsAt, new Date())))
    .limit(1);
  if (!event || event.ticketPrice === null) return { ok: false, message: "This event is no longer available for ticket purchases." };

  const [{ sold }] = await db
    .select({ sold: sql<number>`coalesce(sum(${tickets.quantity}), 0)` })
    .from(tickets)
    .where(eq(tickets.eventId, event.id));
  if (Number(sold) + parsed.data.quantity > (event.guestCount ?? 0)) return { ok: false, message: "There are not enough tickets remaining for that quantity." };

  const amount = event.ticketPrice * parsed.data.quantity;
  const reference = `TKT-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
  if (amount > 0) {
    const authorization = await authorize({ amount, phoneNumber: parsed.data.phoneNumber, reference });
    if (!authorization.ok) return { ok: false, message: (authorization as any).message ?? "Payment failed" };
  }

  const code = `TRUFETA-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
  await db.insert(tickets).values({ id: crypto.randomUUID(), eventId: event.id, attendeeId: client.userId as string, code, quantity: parsed.data.quantity, amount });

  const [organiser] = await db.select({ email: users.email }).from(users).where(eq(users.id, event.organiserId)).limit(1);
  await Promise.all([
    notify({ userId: client.userId, title: "Ticket issued", body: `${parsed.data.quantity} ticket${parsed.data.quantity === 1 ? "" : "s"} for ${event.title} is ready in your wallet.`, href: "/client" }),
    notify({ userId: event.organiserId as string, title: "New ticket order", body: `${parsed.data.quantity} ticket${parsed.data.quantity === 1 ? "" : "s"} sold for ${event.title}.`, href: "/events", email: organiser && organiser.email ? { to: organiser.email } : undefined }),
  ]);
  revalidatePath("/client");
  revalidatePath("/events");
  return { ok: true, message: "Payment authorised. Your QR ticket is ready." };
}
