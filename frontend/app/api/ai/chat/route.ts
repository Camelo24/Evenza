import { NextResponse } from "next/server";
import { getSession } from "@backend/auth/session";
import { AiService, type ChatTurn } from "@backend/ai/ai.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The NestJS AiService has no injected dependencies (it uses the shared Prisma
// singleton), so it can be reused directly by the Next.js API route.
const aiService = new AiService();

type HistoryEntry = { role?: unknown; text?: unknown };

function sanitizeHistory(input: unknown): ChatTurn[] {
  if (!Array.isArray(input)) return [];
  return (input as HistoryEntry[])
    .filter((turn) => turn && typeof turn.text === "string" && (turn.role === "user" || turn.role === "model"))
    .slice(-20)
    .map((turn) => ({ role: turn.role as "user" | "model", text: String(turn.text).slice(0, 4000) }));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let body: { message?: unknown; history?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
  if (!message) return NextResponse.json({ error: "A message is required." }, { status: 400 });

  const result = await aiService.chat(session, message, sanitizeHistory(body.history));
  return NextResponse.json({ reply: result.reply, degraded: result.degraded });
}
