import { api } from "@/shared/lib/axios";

/** Thin HTTP client for the tickets backend module. */
export const ticketsService = {
  list: (params?: Record<string, unknown>) => api.get("/api/tickets", { params }),
  get: (id: string) => api.get(`/api/tickets/${id}`),
  create: (body: unknown) => api.post("/api/tickets", body),
  update: (id: string, body: unknown) => api.patch(`/api/tickets/${id}`, body),
  remove: (id: string) => api.delete(`/api/tickets/${id}`),
};
