import { api } from "@/shared/lib/axios";

/** Thin HTTP client for the reviews backend module. */
export const reviewsService = {
  list: (params?: Record<string, unknown>) => api.get("/api/reviews", { params }),
  get: (id: string) => api.get(`/api/reviews/${id}`),
  create: (body: unknown) => api.post("/api/reviews", body),
  update: (id: string, body: unknown) => api.patch(`/api/reviews/${id}`, body),
  remove: (id: string) => api.delete(`/api/reviews/${id}`),
};
