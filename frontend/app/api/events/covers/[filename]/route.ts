import { NextRequest, NextResponse } from "next/server";
import { readEventCover } from "@backend/uploads/event-covers";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;
    const buffer = await readEventCover(filename);
    const extension = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
    const contentType = MIME_TYPES[extension.toLowerCase()] ?? "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Event cover not found" }, { status: 404 });
  }
}
