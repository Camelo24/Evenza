import { api } from "@/shared/lib/axios";

/** Thin HTTP client for the chat backend module. */
export const chatService = {
  list: (params?: Record<string, unknown>) => api.get("/api/chat", { params }),
  get: (id: string) => api.get(`/api/chat/${id}`),
  create: (body: unknown) => api.post("/api/chat", body),
  update: (id: string, body: unknown) => api.patch(`/api/chat/${id}`, body),
  remove: (id: string) => api.delete(`/api/chat/${id}`),
};
