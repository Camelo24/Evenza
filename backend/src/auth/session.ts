import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@db/client";
import { users } from "@db/schema";

export type ActorRole = "admin" | "client" | "service_provider";
export type Role = ActorRole | "organiser" | (string & {});
export type OrganizerStatus = "not_requested" | "pending" | "approved" | "rejected";
export type WorkspaceView = "client" | "organiser";
export type Session = {
  userId: string;
  email: string;
  fullName: string;
  role: ActorRole;
  isOrganizer: boolean;
  organizerStatus: OrganizerStatus;
  mustChangePassword: boolean;
};

const cookieName = "trufeta_session";
const workspaceCookie = "trufeta_workspace";

export function normalizeActorRole(role: string | null | undefined): ActorRole {
  const normalized = String(role ?? "").trim().toLowerCase();
  if (normalized === "service_provider") return "service_provider";
  if (normalized === "admin") return "admin";
  return "client";
}

/** @deprecated Use normalizeActorRole. Kept so existing call sites compile. */
export function normalizeRole(role: string | null | undefined): Role {
  return normalizeActorRole(role);
}

export function sessionSatisfies(session: Session, role: Role): boolean {
  const normalized = String(role ?? "").trim().toLowerCase();
  if (normalized === "admin") return session.role === "admin";
  if (normalized === "service_provider") return session.role === "service_provider";
  if (normalized === "organiser") return session.role === "admin" || (session.role === "client" && session.isOrganizer);
  if (normalized === "client") return session.role === "client";
  return session.role === normalized;
}

function secret() {
  const value = process.env.SESSION_SECRET ?? "trufeta-local-preview-secret-change-in-production";
  return new TextEncoder().encode(value);
}

export async function createSession(session: Session) {
  const token = await new SignJWT({
    userId: session.userId,
    email: session.email,
    fullName: session.fullName,
    role: session.role,
    isOrganizer: session.isOrganizer,
    organizerStatus: session.organizerStatus,
    mustChangePassword: session.mustChangePassword,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(cookieName);
}

function sessionFromPayload(payload: {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  isOrganizer?: boolean;
  organizerStatus?: string;
  mustChangePassword?: boolean;
}): Session {
  const role = normalizeActorRole(payload.role);
  const organizerStatus = (["not_requested", "pending", "approved", "rejected"].includes(String(payload.organizerStatus))
    ? payload.organizerStatus
    : payload.isOrganizer
      ? "approved"
      : "not_requested") as OrganizerStatus;
  return {
    userId: payload.userId,
    email: payload.email,
    fullName: payload.fullName,
    role,
    isOrganizer: organizerStatus === "approved" || Boolean(payload.isOrganizer) || String(payload.role).toLowerCase() === "organiser",
    organizerStatus,
    mustChangePassword: Boolean(payload.mustChangePassword),
  };
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.userId || !payload.email || !payload.fullName || !payload.role) return null;
    const fallback = sessionFromPayload({
      userId: String(payload.userId),
      email: String(payload.email),
      fullName: String(payload.fullName),
      role: String(payload.role),
      isOrganizer: Boolean(payload.isOrganizer),
      organizerStatus: payload.organizerStatus ? String(payload.organizerStatus) : undefined,
      mustChangePassword: Boolean(payload.mustChangePassword),
    });
    try {
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          role: users.role,
          organizerVerificationStatus: users.organizerVerificationStatus,
          mustChangePassword: users.mustChangePassword,
          isActive: users.isActive,
          isBanned: users.isBanned,
        })
        .from(users)
        .where(eq(users.id, fallback.userId))
        .limit(1);
      if (!user || !user.isActive || user.isBanned) return null;
      return sessionFromPayload({
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizerStatus: user.organizerVerificationStatus,
        isOrganizer: user.organizerVerificationStatus === "approved",
        mustChangePassword: user.mustChangePassword,
      });
    } catch {
      return fallback;
    }
  } catch {
    return null;
  }
}

export async function getWorkspaceView(): Promise<WorkspaceView> {
  const store = await cookies();
  return store.get(workspaceCookie)?.value === "organiser" ? "organiser" : "client";
}

export async function setWorkspaceViewCookie(view: WorkspaceView) {
  const store = await cookies();
  store.set(workspaceCookie, view, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function requireRole(...roles: Role[]) {
  const session = await getSession();
  if (!session) {
    const next = roles.some((role) => String(role).toLowerCase() === "admin")
      ? "/admin"
      : roles.some((role) => ["organiser"].includes(String(role).toLowerCase()))
        ? "/dashboard"
        : roles.some((role) => ["service_provider"].includes(String(role).toLowerCase()))
          ? "/vendor/dashboard"
          : "/client";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  if (!roles.some((role) => sessionSatisfies(session, role))) redirect("/unauthorised");
  return session;
}

export function dashboardForRole(roleOrSession: Role | Session, workspace: WorkspaceView = "client") {
  const session = typeof roleOrSession === "object" && roleOrSession && "userId" in roleOrSession ? roleOrSession : null;
  const role = session ? session.role : normalizeActorRole(String(roleOrSession));
  if (role === "admin") return "/admin";
  if (role === "service_provider") return "/vendor/dashboard";
  if (session?.isOrganizer && workspace === "organiser") return "/dashboard";
  return "/client";
}
