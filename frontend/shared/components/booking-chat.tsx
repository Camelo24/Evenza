"use client";

import { Download, FileText, ImageIcon, Mic, MicOff, Paperclip, PhoneCall, Send, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/shared/hooks/useSocket";

type ChatMessage = {
  message: {
    id: string;
    bookingId: string;
    body: string;
    createdAt: Date | string;
    attachmentPath?: string | null;
    attachmentName?: string | null;
    attachmentType?: string | null;
  };
  sender: { id: string; fullName: string };
};

type BookingChatProps = {
  bookingId: string;
  messages: ChatMessage[];
  currentUserId: string;
  recipientName: string;
  status: string;
  action: (formData: FormData) => void | Promise<void>;
};

function formatTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleTimeString("en-CM", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString("en-CM", { dateStyle: "medium", timeStyle: "short" });
}

function attachmentUrl(path?: string | null) {
  if (!path) return "";
  return `/api/chat/attachments/${encodeURIComponent(path)}`;
}

function getAttachmentLabel(type?: string | null, fileName?: string | null) {
  if (type?.startsWith("image/")) return "Image";
  if (type?.startsWith("audio/")) return "Voice note";
  if (type === "application/pdf") return "PDF";
  return fileName ? "Attachment" : "File";
}

export function BookingChat({ bookingId, messages, currentUserId, recipientName, status, action }: BookingChatProps) {
  const [thread, setThread] = useState<ChatMessage[]>(messages);
  const [pendingAttachmentName, setPendingAttachmentName] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const socket = useSocket("/booking");

  useEffect(() => {
    setThread(messages);
  }, [messages]);

  useEffect(() => {
    if (!socket?.on) return;
    const onIncoming = (...args: unknown[]) => {
      const payload = args[0] as { bookingId?: string; message?: ChatMessage } | undefined;
      const event = payload;
      if (!event?.message || event.bookingId !== bookingId) return;
      setThread((current) => (current.some((item) => item.message.id === event.message!.message.id) ? current : [...current, event.message!]));
    };
    socket.on("booking:message", onIncoming);
    return () => socket.off?.("booking:message", onIncoming);
  }, [socket, bookingId]);

  const submitAttachment = (file: File) => {
    const input = fileInputRef.current;
    if (!input || !formRef.current) return;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    setPendingAttachmentName(file.name);
    formRef.current.requestSubmit();
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = () => {
        const recording = new File(chunks, `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        submitAttachment(recording);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    setMediaRecorder(null);
    setIsRecording(false);
  };

  const renderAttachment = (item: ChatMessage) => {
    const attachment = item.message.attachmentPath;
    const type = item.message.attachmentType ?? "";
    const url = attachmentUrl(attachment);
    const fileName = item.message.attachmentName ?? "shared file";

    if (!attachment || !url) return null;

    if (type.startsWith("image/")) {
      return (
        <div className="mt-3 overflow-hidden rounded-2xl border border-current/10 bg-white/10">
          <img src={url} alt={fileName} className="max-h-64 w-full object-cover" />
        </div>
      );
    }

    if (type.startsWith("audio/")) {
      return (
        <div className="mt-3 rounded-2xl border border-current/10 bg-white/10 p-2">
          <audio controls src={url} className="w-full" />
        </div>
      );
    }

    if (type === "application/pdf") {
      return (
        <a href={url} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 rounded-2xl border border-current/10 bg-white/10 px-3 py-2 text-left text-[11px] font-semibold">
          <FileText size={14} />
          <span className="truncate">{fileName}</span>
          <Download size={13} className="ml-auto" />
        </a>
      );
    }

    return (
      <a href={url} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 rounded-2xl border border-current/10 bg-white/10 px-3 py-2 text-left text-[11px] font-semibold">
        <ImageIcon size={14} />
        <span className="truncate">{fileName}</span>
        <Download size={13} className="ml-auto" />
      </a>
    );
  };

  return (
    <section id="messages" className="overflow-hidden rounded-[22px] border border-ink/10 bg-[#f5f1e8] shadow-[0_14px_32px_rgba(23,35,31,0.06)]">
      <div className="flex items-center justify-between border-b border-ink/10 bg-[#edf5f1] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-full bg-forest text-sm font-bold text-white">{recipientName.slice(0, 1).toUpperCase()}</div>
          <div>
            <p className="display text-lg font-semibold leading-none">{recipientName}</p>
            <div className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-forest/75">
              <span className="inline-block size-2 rounded-full bg-green-500" />
              {status === "confirmed" || status === "in_progress" || status === "awaiting_review" || status === "disputed" ? "Confirmed" : "Active"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" aria-label="Voice call" className="grid size-9 place-items-center rounded-full border border-ink/10 bg-white text-ink/70 transition hover:bg-ink hover:text-white">
            <PhoneCall size={15} />
          </button>
          <button type="button" aria-label="Video call" className="grid size-9 place-items-center rounded-full border border-ink/10 bg-white text-ink/70 transition hover:bg-ink hover:text-white">
            <Video size={15} />
          </button>
        </div>
      </div>

      <div className="flex h-[440px] flex-col bg-[radial-gradient(circle_at_top,_rgba(35,79,64,0.06),_transparent_55%)]">
        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {thread.length ? thread.map((item) => {
            const mine = item.sender.id === currentUserId;
            const attachmentType = item.message.attachmentType ?? "";
            return (
              <div key={item.message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[84%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  {!mine && <span className="mb-1 ml-2 text-[9px] font-bold uppercase tracking-[0.12em] text-ink/40">{item.sender.fullName}</span>}
                  <div className={`rounded-2xl px-4 py-3 shadow-sm ${mine ? "bg-[#234f40] text-white" : "bg-white text-ink"}`}>
                    {!mine && item.message.body && <p className="text-[12px] leading-6">{item.message.body}</p>}
                    {mine && item.message.body && <p className="text-[12px] leading-6">{item.message.body}</p>}
                    {item.message.attachmentPath && renderAttachment(item)}
                    <div className={`mt-2 flex items-center gap-1.5 ${mine ? "justify-end text-white/55" : "text-ink/40"}`}>
                      <span className="mono text-[9px]">{formatTime(item.message.createdAt)}</span>
                      {mine && <span className="text-[10px]">✓✓</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-ink/15 bg-white/70 text-center text-[11px] text-ink/45">
              No booking messages yet. Start with the next update.
            </div>
          )}
        </div>

        <div className="border-t border-ink/10 bg-white/85 p-3 sm:p-4">
          <form ref={formRef} action={action} className="space-y-3">
            <input type="hidden" name="bookingId" value={bookingId} />
            <input
              ref={fileInputRef}
              type="file"
              name="attachment"
              accept="image/*,.pdf,audio/webm,audio/ogg,audio/mpeg"
              className="hidden"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) setPendingAttachmentName(selected.name);
              }}
            />

            {pendingAttachmentName && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-forest/15 bg-mint/50 px-3 py-2 text-[10px] font-semibold text-forest">
                <span className="flex items-center gap-2 truncate"><Paperclip size={12} />{pendingAttachmentName}</span>
                <button type="button" onClick={() => { setPendingAttachmentName(""); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="grid place-items-center rounded-full bg-white p-1 text-ink/50" aria-label="Clear attachment">
                  ×
                </button>
              </div>
            )}

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-ink/10 bg-paper text-ink/70 transition hover:bg-ink hover:text-white"
                aria-label="Attach file"
              >
                <Paperclip size={16} />
              </button>

              <div className="relative flex-1">
                <textarea name="body" rows={1} placeholder="Type a message…" className="w-full resize-none rounded-2xl border border-ink/10 bg-paper px-4 py-3 pr-12 text-sm text-ink outline-none transition focus:border-forest focus:shadow-[0_0_0_3px_rgba(35,79,64,0.12)]" />
              </div>

              <button type="button" onClick={() => (isRecording ? stopRecording() : startRecording())} className={`grid size-11 shrink-0 place-items-center rounded-full ${isRecording ? "bg-berry text-white" : "bg-ink text-white"}`} aria-label={isRecording ? "Stop recording" : "Record voice note"}>
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <button type="submit" className="grid size-11 shrink-0 place-items-center rounded-full bg-forest text-white shadow-[0_10px_20px_rgba(35,79,64,0.2)]" aria-label="Send message">
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
