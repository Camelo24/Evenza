
import { mkdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf", "audio/webm", "audio/ogg", "audio/mpeg"]);

function directory() {
  const roots = [path.resolve(process.cwd(), "backend"), path.resolve(process.cwd(), "../backend")];
  return path.join(roots.find(existsSync) ?? roots[0], "uploads/chat");
}

export async function saveChatAttachment(file: File) {
  if (!allowed.has(file.type)) throw new Error("Use an image, PDF, or voice recording.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Attachments must be 12 MB or smaller.");
  const extension = file.type === "application/pdf" ? ".pdf" : file.type.startsWith("image/") ? `.${file.type.split("/")[1].replace("jpeg", "jpg")}` : file.type === "audio/mpeg" ? ".mp3" : file.type === "audio/ogg" ? ".ogg" : ".webm";
  const filename = `${randomUUID()}${extension}`;
  await mkdir(directory(), { recursive: true });
  await writeFile(path.join(directory(), filename), Buffer.from(await file.arrayBuffer()));
  return { path: filename, name: file.name.slice(0, 255), type: file.type };
}

export async function readChatAttachment(filename: string) {
  if (path.basename(filename) !== filename) throw new Error("Invalid attachment.");
  return readFile(path.join(directory(), filename));
}
