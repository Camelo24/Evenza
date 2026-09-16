import { api } from "@/shared/lib/axios";

/** Thin HTTP client for the events backend module. */
export const eventsService = {
  list: (params?: Record<string, unknown>) => api.get("/api/events", { params }),
  get: (id: string) => api.get(`/api/events/${id}`),
  create: (body: unknown) => api.post("/api/events", body),
  update: (id: string, body: unknown) => api.patch(`/api/events/${id}`, body),
  remove: (id: string) => api.delete(`/api/events/${id}`),
};
