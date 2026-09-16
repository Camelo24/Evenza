import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { getSession, sessionSatisfies, type Role } from "@backend/auth/session";

/** Nest-compatible role guard that checks the authenticated session. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly allowedRoles: Role[] = []) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const session = await getSession();

    if (!session) {
      throw new UnauthorizedException("Authentication required.");
    }

    if (this.allowedRoles.length > 0 && !this.allowedRoles.some((role) => sessionSatisfies(session, role))) {
      throw new ForbiddenException("You do not have permission to access this resource.");
    }

    const req = context.switchToHttp().getRequest();
    req.user = session;
    return true;
  }
}

export async function enforceRoles(...roles: Role[]) {
  const session = await getSession();
  if (!session) throw new UnauthorizedException("Authentication required.");
  if (!roles.some((role) => sessionSatisfies(session, role))) {
    throw new ForbiddenException("You do not have permission to access this resource.");
  }
  return session;
}
