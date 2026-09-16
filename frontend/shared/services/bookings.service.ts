import { api } from "@/shared/lib/axios";

/** Thin HTTP client for the bookings backend module. */
export const bookingsService = {
  list: (params?: Record<string, unknown>) => api.get("/api/bookings", { params }),
  get: (id: string) => api.get(`/api/bookings/${id}`),
  create: (body: unknown) => api.post("/api/bookings", body),
  update: (id: string, body: unknown) => api.patch(`/api/bookings/${id}`, body),
  remove: (id: string) => api.delete(`/api/bookings/${id}`),
};
