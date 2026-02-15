import { $authHost } from "../index";

export const suppliersApi = {
  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/suppliers", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/suppliers/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/suppliers", data).then(r => r.data),

  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/suppliers/${id}`, data).then(r => r.data),

  remove: (id: number) =>
    $authHost.delete(`/api/suppliers/${id}`).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/suppliers/stats").then(r => r.data),

  addEvaluation: (supplierId: number, data: Record<string, any>) =>
    $authHost.post(`/api/suppliers/${supplierId}/evaluations`, data).then(r => r.data),

  getEvaluations: (supplierId: number) =>
    $authHost.get(`/api/suppliers/${supplierId}/evaluations`).then(r => r.data),

  addAudit: (supplierId: number, data: Record<string, any>) =>
    $authHost.post(`/api/suppliers/${supplierId}/audits`, data).then(r => r.data),
};
