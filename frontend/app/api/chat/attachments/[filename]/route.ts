import { NextRequest, NextResponse } from "next/server";
import { readChatAttachment } from "@backend/uploads/chat-attachments";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".webm": "audio/webm",
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;
    const buffer = await readChatAttachment(filename);
    const extension = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
    const contentType = MIME_TYPES[extension.toLowerCase()] ?? "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }
}
