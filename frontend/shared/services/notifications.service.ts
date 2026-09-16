import { api } from "@/shared/lib/axios";

/** Thin HTTP client for the notifications backend module. */
export const notificationsService = {
  list: (params?: Record<string, unknown>) => api.get("/api/notifications", { params }),
  get: (id: string) => api.get(`/api/notifications/${id}`),
  create: (body: unknown) => api.post("/api/notifications", body),
  update: (id: string, body: unknown) => api.patch(`/api/notifications/${id}`, body),
  remove: (id: string) => api.delete(`/api/notifications/${id}`),
};
