import { $authHost } from "../index";

export const changeRequestsApi = {
  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/change-requests", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/change-requests/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/change-requests", data).then(r => r.data),

  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/change-requests/${id}`, data).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/change-requests/stats").then(r => r.data),
};

export const validationsApi = {
  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/process-validations", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/process-validations/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/process-validations", data).then(r => r.data),

  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/process-validations/${id}`, data).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/process-validations/stats").then(r => r.data),
};

export const productsApi = {
  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/products", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/products/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/products", data).then(r => r.data),

  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/products/${id}`, data).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/products/stats").then(r => r.data),
};

export const notificationsApi = {
  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/notifications", { params }).then(r => r.data),

  getCount: () =>
    $authHost.get("/api/notifications/count").then(r => r.data),

  markRead: (id: number) =>
    $authHost.patch(`/api/notifications/${id}/read`).then(r => r.data),

  markAllRead: () =>
    $authHost.post("/api/notifications/mark-all-read").then(r => r.data),
};
