import { mkdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const allowedTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);
const maxFileSize = 10 * 1024 * 1024;

function uploadDirectory() {
  const roots = [
    path.resolve(process.cwd(), "backend"),
    path.resolve(process.cwd(), "../backend"),
    path.resolve(__dirname, "../.."),
  ];
  const backendDirectory = roots.find(existsSync) ?? roots[0];
  return path.join(backendDirectory, "uploads/events");
}

export function validateEventCover(file: File | null) {
  if (!file || file.size === 0) return null;
  if (!allowedTypes.has(file.type)) return "Upload a JPG, PNG, or WEBP image.";
  if (file.size > maxFileSize) return "Your cover image must be 10 MB or smaller.";
  return null;
}

export async function saveEventCover(file: File) {
  const error = validateEventCover(file);
  if (error) throw new Error(error);

  const extension = allowedTypes.get(file.type) ?? ".jpg";
  const filename = `${randomUUID()}${extension}`;
  const directory = uploadDirectory();

  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));

  return {
    path: filename,
    name: file.name.slice(0, 255),
    url: `/api/events/covers/${filename}`,
  };
}

export async function readEventCover(filename: string) {
  if (path.basename(filename) !== filename) throw new Error("Invalid cover image path.");
  return readFile(path.join(uploadDirectory(), filename));
}
