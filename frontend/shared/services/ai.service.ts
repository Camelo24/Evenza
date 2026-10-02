export type AiChatTurn = { role: "user" | "model"; text: string };
export type AiChatResponse = { reply: string; degraded?: boolean };

/**
 * Same-origin client for the AI assistant endpoint.
 * Uses fetch (not the cross-origin axios instance) so the httpOnly session
 * cookie is sent to the Next.js API route that serves POST /api/ai/chat.
 */
export const aiService = {
  async chat(message: string, history: AiChatTurn[] = []): Promise<AiChatResponse> {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });

    const data = (await response.json().catch(() => ({}))) as { reply?: string; error?: string; degraded?: boolean };

    if (!response.ok) {
      throw new Error(data.error || "The assistant could not be reached. Please try again.");
    }
    if (!data.reply) {
      throw new Error("The assistant returned an empty response. Please try again.");
    }
    return { reply: data.reply, degraded: Boolean(data.degraded) };
  },
};
