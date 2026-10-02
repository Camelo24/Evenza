"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ChevronRight, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { aiService, type AiChatTurn } from "@/shared/services/ai.service";

type Bubble = { id: string; role: "user" | "model"; text: string };

const EXAMPLES = [
  "What tickets do I have coming up?",
  "Summarise my recent bookings",
  "How does escrow protection work?",
];

let counter = 0;
const nextId = () => `ai-${Date.now()}-${counter++}`;

/** The Evenza three-bar brand glyph (matches <Logo />), tinted via currentColor. */
function BrandBars() {
  return (
    <span className="flex flex-col gap-1.5" aria-hidden="true">
      <span className="h-0.5 w-4 rounded-full bg-current" />
      <span className="h-0.5 w-2.5 rounded-full bg-current" />
      <span className="h-0.5 w-4 rounded-full bg-current" />
    </span>
  );
}

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    const openAssistant = () => setOpen(true);
    window.addEventListener("evenza:open-ai-assistant", openAssistant);
    return () => window.removeEventListener("evenza:open-ai-assistant", openAssistant);
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, loading, open]);

  async function send(raw?: string) {
    const text = (raw ?? input).trim();
    if (!text || loading) return;

    const history: AiChatTurn[] = messages.map((message) => ({ role: message.role, text: message.text }));

    setMessages((current) => [...current, { id: nextId(), role: "user", text }]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const { reply } = await aiService.chat(text, history);
      setMessages((current) => [...current, { id: nextId(), role: "model", text: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.section
            key="panel"
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-label="Evenza assistant"
            className="fixed bottom-[88px] right-4 z-50 flex h-[min(540px,calc(100dvh-7.5rem))] w-[calc(100vw-2rem)] max-w-[368px] flex-col overflow-hidden rounded-[20px] border border-ink/10 bg-paper shadow-[0_20px_50px_rgba(23,35,31,0.18)] sm:right-6"
          >
            <header className="flex items-center gap-3 border-b border-ink/10 bg-white px-4 py-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[#d4ff59] text-[#101716]">
                <BrandBars />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-none text-ink">Evenza Assistant</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-ink/45">
                  <span className="size-1.5 rounded-full bg-forest" />
                  Answers from your account
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="grid size-8 place-items-center rounded-lg text-ink/40 transition hover:bg-ink/5 hover:text-ink"
              >
                <X size={16} />
              </button>
            </header>

            <div ref={scrollRef} className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
              {!hasMessages && !loading ? (
                <div className="flex h-full flex-col">
                  <div className="pt-4 text-center">
                    <h2 className="display text-[17px] font-semibold text-ink">How can I help?</h2>
                    <p className="mx-auto mt-2 max-w-[17rem] text-[12px] leading-5 text-ink/50">
                      I can read your tickets, bookings, services and wallet, or explain how Evenza works.
                    </p>
                  </div>
                  <div className="mt-6 divide-y divide-ink/8 border-y border-ink/8">
                    {EXAMPLES.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => send(example)}
                        className="group flex w-full items-center justify-between gap-3 py-3 text-left text-[12px] text-ink/65 transition hover:text-ink"
                      >
                        <span>{example}</span>
                        <ChevronRight size={14} className="shrink-0 text-ink/25 transition group-hover:translate-x-0.5 group-hover:text-ink/50" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) =>
                    message.role === "user" ? (
                      <div key={message.id} className="flex justify-end">
                        <div className="max-w-[86%] whitespace-pre-wrap rounded-[14px] rounded-tr-[4px] bg-ink px-3.5 py-2.5 text-[13px] leading-6 text-white">
                          {message.text}
                        </div>
                      </div>
                    ) : (
                      <div key={message.id} className="flex justify-start">
                        <div className="max-w-[86%] whitespace-pre-wrap rounded-[14px] rounded-tl-[4px] border border-ink/8 bg-white px-3.5 py-2.5 text-[13px] leading-6 text-ink/85 shadow-[0_1px_2px_rgba(23,35,31,0.04)]">
                          {message.text}
                        </div>
                      </div>
                    ),
                  )}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-1.5 rounded-[14px] rounded-tl-[4px] border border-ink/8 bg-white px-4 py-3.5">
                        {[0, 1, 2].map((index) => (
                          <span
                            key={index}
                            className="size-1.5 animate-pulse rounded-full bg-ink/35"
                            style={{ animationDelay: `${index * 160}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="mx-4 mb-2 flex items-start gap-2 rounded-[12px] border border-berry/20 bg-berry/5 px-3 py-2.5 text-[12px] leading-5 text-berry"
              >
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t border-ink/10 bg-white px-3 py-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                type="text"
                maxLength={2000}
                placeholder="Ask about your account…"
                aria-label="Message the Evenza assistant"
                className="h-10 min-w-0 flex-1 rounded-full border border-ink/12 bg-paper px-4 text-[13px] text-ink outline-none transition placeholder:text-ink/35 focus:border-ink/30 focus:bg-white"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-white transition hover:bg-forest disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close Evenza assistant" : "Open Evenza assistant"}
        aria-expanded={open}
        whileHover={reducedMotion ? undefined : { y: -2 }}
        whileTap={reducedMotion ? undefined : { scale: 0.96 }}
        className="fixed bottom-5 right-4 z-50 grid size-[52px] place-items-center rounded-full bg-ink text-[#d4ff59] shadow-[0_10px_28px_rgba(23,35,31,0.28)] transition sm:right-6"
      >
        {open ? <X size={20} /> : <BrandBars />}
      </motion.button>
    </>
  );
}
