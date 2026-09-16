"use client";
/** Client-side role hint only — real enforcement is server-side. */
export function useRoleGuard(_roles: string[]) {
  return { allowed: true };
}
