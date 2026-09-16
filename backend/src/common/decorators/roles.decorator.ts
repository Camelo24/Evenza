import type { Role } from "@backend/auth/session";

const ROLES_KEY = "trufeta:roles";

/** Nest-compatible Roles metadata helper (no reflect-metadata required). */
export function Roles(...roles: Role[]) {
  return function (_target: unknown, _key?: string | symbol, descriptor?: PropertyDescriptor) {
    if (descriptor?.value) {
      (descriptor.value as { [ROLES_KEY]?: Role[] })[ROLES_KEY] = roles;
    }
    return descriptor as PropertyDescriptor;
  };
}

export function readRoles(handler: { [key: string]: unknown }): Role[] | undefined {
  return handler[ROLES_KEY] as Role[] | undefined;
}
