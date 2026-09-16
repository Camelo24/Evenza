import { api } from "@/shared/lib/axios";

/** Thin HTTP client for the escrow backend module. */
export const escrowService = {
  list: (params?: Record<string, unknown>) => api.get("/api/escrow", { params }),
  get: (id: string) => api.get(`/api/escrow/${id}`),
  create: (body: unknown) => api.post("/api/escrow", body),
  update: (id: string, body: unknown) => api.patch(`/api/escrow/${id}`, body),
  remove: (id: string) => api.delete(`/api/escrow/${id}`),
};
