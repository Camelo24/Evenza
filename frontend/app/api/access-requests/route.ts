import { notify } from "@backend/notifications/service";
import { removeIdentityDocument, saveIdentityDocument, validateIdentityDocument } from "@backend/uploads/access-request-documents";
import { db } from "@db/client";
import { accessRequests, users } from "@db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const accessRequestSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(140),
  email: z.string().trim().email("Enter a valid email address.").transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(30).optional(),
  businessName: z.string().trim().min(2, "Enter your studio or business name.").max(180),
  message: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = accessRequestSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    businessName: formData.get("businessName"),
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message ?? "Check your details." }, { status: 400 });
  }

  const candidate = formData.get("identityDocument");
  const document = candidate instanceof File ? candidate : null;
  const documentError = validateIdentityDocument(document);
  if (documentError) return NextResponse.json({ ok: false, message: documentError }, { status: 400 });

  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existingUser) return NextResponse.json({ ok: false, message: "An account already exists for this email. Try signing in." }, { status: 409 });
  const existingRequests = await db.select({ status: accessRequests.status }).from(accessRequests).where(eq(accessRequests.email, parsed.data.email));
  if (existingRequests.some((item) => item.status === "pending")) {
    return NextResponse.json({ ok: true, message: "Your access request is already pending review. We’ll email you when there is an update." });
  }

  let savedDocument: Awaited<ReturnType<typeof saveIdentityDocument>> | null = null;
  try {
    savedDocument = await saveIdentityDocument(document!);
    await db.insert(accessRequests).values({
      id: randomUUID(),
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      desiredRole: "service_provider",
      phone: parsed.data.phone || null,
      businessName: parsed.data.businessName,
      message: parsed.data.message || null,
      identityDocumentPath: savedDocument.path,
      identityDocumentName: savedDocument.name,
      status: "pending",
    });
  } catch (error) {
    if (savedDocument?.path) await removeIdentityDocument(savedDocument.path);
    console.error("[access-request][create-failed]", error);
    return NextResponse.json({ ok: false, message: "We could not save your request right now. Please try again." }, { status: 500 });
  }

  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  await Promise.allSettled(admins.map((admin) => notify({
    userId: admin.id,
    title: "New access request awaiting review",
    body: `${parsed.data.fullName} requested service provider access.`,
    href: "/admin/access-review",
  })));
  return NextResponse.json({ ok: true, message: "Request received. Our trust team will review it and reply by email." }, { status: 201 });
}
