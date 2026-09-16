/**
 * HTTP surface for authentication.
 * In the NestJS deployment this becomes @Controller('auth').
 * In the Next.js adapter these endpoints are exposed via server actions + /login.
 */
export const AUTH_ROUTES = {
  login: "POST /auth/login",
  logout: "POST /auth/logout",
  me: "GET /auth/me",
  requestAccess: "POST /access-requests",
} as const;
