import { $authHost } from "../index";

export const workOrderApi = {
  getAll: (params?: Record<string, unknown>) =>
    $authHost.get("/api/mes/work-orders", { params }).then((r) => r.data),

  getStats: () =>
    $authHost.get("/api/mes/work-orders/stats").then((r) => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/mes/work-orders/${id}`).then((r) => r.data),

  create: (data: Record<string, unknown>) =>
    $authHost.post("/api/mes/work-orders", data).then((r) => r.data),

  update: (id: number, data: Record<string, unknown>) =>
    $authHost.put(`/api/mes/work-orders/${id}`, data).then((r) => r.data),

  readinessCheck: (id: number) =>
    $authHost.post(`/api/mes/work-orders/${id}/readiness-check`).then((r) => r.data),

  launch: (id: number) =>
    $authHost.post(`/api/mes/work-orders/${id}/launch`).then((r) => r.data),

  issueMaterials: (id: number, data?: Record<string, unknown>) =>
    $authHost.post(`/api/mes/work-orders/${id}/issue-materials`, data).then((r) => r.data),

  getProgress: (id: number) =>
    $authHost.get(`/api/mes/work-orders/${id}/progress`).then((r) => r.data),

  getUnits: (id: number) =>
    $authHost.get(`/api/mes/work-orders/${id}/units`).then((r) => r.data),

  updateUnit: (unitId: number, data: Record<string, unknown>) =>
    $authHost.put(`/api/mes/work-orders/units/${unitId}`, data).then((r) => r.data),

  complete: (id: number) =>
    $authHost.post(`/api/mes/work-orders/${id}/complete`).then((r) => r.data),
};
