import { api } from "@/shared/lib/axios";

/** Thin HTTP client for the disputes backend module. */
export const disputesService = {
  list: (params?: Record<string, unknown>) => api.get("/api/disputes", { params }),
  get: (id: string) => api.get(`/api/disputes/${id}`),
  create: (body: unknown) => api.post("/api/disputes", body),
  update: (id: string, body: unknown) => api.patch(`/api/disputes/${id}`, body),
  remove: (id: string) => api.delete(`/api/disputes/${id}`),
};
