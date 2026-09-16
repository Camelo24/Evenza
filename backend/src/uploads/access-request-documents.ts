
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const allowedTypes = new Map([
  ["application/pdf", ".pdf"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
]);
const maxFileSize = 10 * 1024 * 1024;

function uploadDirectory() {
  const backendDirectories = [
    path.resolve(process.cwd(), "backend"),
    path.resolve(process.cwd(), "../backend"),
    path.resolve(__dirname, "../.."),
  ];
  const backendDirectory = backendDirectories.find(existsSync) ?? backendDirectories[0];
  return path.join(backendDirectory, "uploads/access-requests");
}

export function validateIdentityDocument(file: File | null) {
  if (!file || file.size === 0) return "Upload a government-issued ID or a business registration document.";
  if (!allowedTypes.has(file.type)) return "Upload a PDF, JPG, or PNG document.";
  if (file.size > maxFileSize) return "Your document must be 10 MB or smaller.";
  return null;
}

export async function saveIdentityDocument(file: File) {
  const extension = allowedTypes.get(file.type);
  if (!extension) throw new Error("Unsupported identity-document type.");
  const filename = `${randomUUID()}${extension}`;
  const directory = uploadDirectory();
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
  return { path: filename, name: file.name.slice(0, 255) };
}

export async function getIdentityDocument(filename: string) {
  if (path.basename(filename) !== filename) throw new Error("Invalid document path.");
  return readFile(path.join(uploadDirectory(), filename));
}

export async function removeIdentityDocument(filename: string) {
  if (path.basename(filename) !== filename) return;
  await unlink(path.join(uploadDirectory(), filename)).catch(() => undefined);
}
