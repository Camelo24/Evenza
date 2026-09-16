/**
 * NestJS-shaped module boundary for uploads.
 * Controllers/services live alongside this file.
 * Today the platform runs these as Next.js server actions/query modules;
 * swap the adapter layer to Nest controllers without changing the domain logic.
 */
export const uploadsModule = {
  name: "uploads",
} as const;
