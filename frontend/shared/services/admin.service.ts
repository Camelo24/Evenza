import { api } from "@/shared/lib/axios";

/** Thin HTTP client for the admin backend module. */
export const adminService = {
  list: (params?: Record<string, unknown>) => api.get("/api/admin", { params }),
  get: (id: string) => api.get(`/api/admin/${id}`),
  create: (body: unknown) => api.post("/api/admin", body),
  update: (id: string, body: unknown) => api.patch(`/api/admin/${id}`, body),
  remove: (id: string) => api.delete(`/api/admin/${id}`),
};
