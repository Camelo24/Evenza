import { requireRole } from "@backend/auth/session";
import { notify } from "@backend/notifications/service";
import { removeIdentityDocument, saveIdentityDocument, validateIdentityDocument } from "@backend/uploads/access-request-documents";
import { db } from "@db/client";
import { organizerApplications, users } from "@db/schema";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const organizerRequestSchema = z.object({
  businessName: z.string().trim().min(2, "Enter your business or organization name.").max(180),
  message: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request) {
  const session = await requireRole("client");
  const formData = await request.formData();
  const parsed = organizerRequestSchema.safeParse({
    businessName: formData.get("businessName"),
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message ?? "Check the form and try again." }, { status: 400 });
  }

  const candidate = formData.get("identityDocument");
  const document = candidate instanceof File && candidate.size > 0 ? candidate : null;
  if (document) {
    const error = validateIdentityDocument(document);
    if (error) return NextResponse.json({ ok: false, message: error }, { status: 400 });
  }

  const [latest] = await db.select().from(organizerApplications)
    .where(eq(organizerApplications.userId, session.userId))
    .orderBy(desc(organizerApplications.createdAt))
    .limit(1);
  if (latest?.status === "pending") return NextResponse.json({ ok: true, message: "Your organizer request is already pending review." });
  if (latest?.status === "approved") return NextResponse.json({ ok: false, message: "You already have organizer access." }, { status: 409 });

  let savedDocument: Awaited<ReturnType<typeof saveIdentityDocument>> | null = null;
  try {
    if (document) savedDocument = await saveIdentityDocument(document);
    await db.transaction(async (tx) => {
      await tx.insert(organizerApplications).values({
        id: randomUUID(),
        userId: session.userId,
        businessName: parsed.data.businessName,
        message: parsed.data.message || null,
        documentPath: savedDocument?.path ?? null,
        documentName: savedDocument?.name ?? null,
        status: "pending",
      });
      await tx.update(users).set({ organizerVerificationStatus: "pending", updatedAt: new Date() }).where(eq(users.id, session.userId));
    });
  } catch (error) {
    if (savedDocument?.path) await removeIdentityDocument(savedDocument.path);
    console.error("[organizer-request][create-failed]", error);
    return NextResponse.json({ ok: false, message: "We could not submit your request. Please try again." }, { status: 500 });
  }

  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  await Promise.allSettled(admins.map((admin) => notify({
    userId: admin.id,
    title: "New organizer request",
    body: `${session.fullName} requested organizer access.`,
    href: "/admin/access-review",
  })));
  return NextResponse.json({ ok: true, message: "Your organizer request has been submitted for review." }, { status: 201 });
}
