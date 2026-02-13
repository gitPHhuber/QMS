import { $authHost } from "../index";

export const reviewsApi = {
  list: (params?: Record<string, any>) =>
    $authHost.get("/api/reviews", { params }).then(r => r.data),

  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/reviews", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/reviews/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/reviews", data).then(r => r.data),

  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/reviews/${id}`, data).then(r => r.data),

  addAction: (reviewId: number, data: Record<string, any>) =>
    $authHost.post(`/api/reviews/${reviewId}/actions`, data).then(r => r.data),

  updateAction: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/reviews/actions/${id}`, data).then(r => r.data),

  stats: () =>
    $authHost.get("/api/reviews/stats").then(r => r.data),

  getStats: () =>
    $authHost.get("/api/reviews/stats").then(r => r.data),

  getDashboard: () =>
    $authHost.get("/api/reviews/dashboard").then(r => r.data),
};
