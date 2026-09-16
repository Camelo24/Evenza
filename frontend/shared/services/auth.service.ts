import { api } from "@/shared/lib/axios";

/** Thin HTTP client for the auth backend module. */
export const authService = {
  list: (params?: Record<string, unknown>) => api.get("/api/auth", { params }),
  get: (id: string) => api.get(`/api/auth/${id}`),
  create: (body: unknown) => api.post("/api/auth", body),
  update: (id: string, body: unknown) => api.patch(`/api/auth/${id}`, body),
  remove: (id: string) => api.delete(`/api/auth/${id}`),
};
