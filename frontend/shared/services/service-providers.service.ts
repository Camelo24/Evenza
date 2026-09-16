import { api } from "@/shared/lib/axios";

/** Thin HTTP client for the service providers backend module. */
export const serviceProvidersService = {
  list: (params?: Record<string, unknown>) => api.get("/api/vendors", { params }),
  get: (id: string) => api.get(`/api/vendors/${id}`),
  create: (body: unknown) => api.post("/api/vendors", body),
  update: (id: string, body: unknown) => api.patch(`/api/vendors/${id}`, body),
  remove: (id: string) => api.delete(`/api/vendors/${id}`),
};
