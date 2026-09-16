import { getSession } from "@backend/auth/session";
import { db } from "@db/client";
import { accessRequests, organizerApplications } from "@db/schema";
import { getIdentityDocument } from "@backend/uploads/access-request-documents";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";

const contentTypes: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".png": "image/png",
};

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ message: "Unauthorised" }, { status: 403 });

  const { id } = await params;
  const [accessRequest] = await db
    .select({ path: accessRequests.identityDocumentPath, name: accessRequests.identityDocumentName })
    .from(accessRequests)
    .where(eq(accessRequests.id, id))
    .limit(1);
  const [organizerRequest] = accessRequest ? [] : await db
    .select({ path: organizerApplications.documentPath, name: organizerApplications.documentName })
    .from(organizerApplications)
    .where(eq(organizerApplications.id, id))
    .limit(1);
  const documentRequest = accessRequest ?? organizerRequest;
  if (!documentRequest?.path || !documentRequest.name) return NextResponse.json({ message: "Document not found" }, { status: 404 });

  try {
    const document = await getIdentityDocument(documentRequest.path);
    const name = documentRequest.name.replace(/[\\"\r\n]/g, "_");
    return new NextResponse(document, {
      headers: {
        "Content-Type": contentTypes[path.extname(documentRequest.path).toLowerCase()] ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${name}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ message: "Document not found" }, { status: 404 });
  }
}
