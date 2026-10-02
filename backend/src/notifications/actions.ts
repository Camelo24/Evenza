"use server";

import { db } from "@db/client";
import { notifications } from "@db/schema";
import { getSession } from "@backend/auth/session";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function markNotificationRead(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return;
  const session = await getSession();
  if (!session) return;
  await db.update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, session.userId)));
  revalidatePath("/notifications");
}
