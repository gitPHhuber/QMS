import { $authHost } from "../index";

export const complaintsApi = {
  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/complaints", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/complaints/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/complaints", data).then(r => r.data),

  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/complaints/${id}`, data).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/complaints/stats").then(r => r.data),

  submitVigilance: (id: number, data: Record<string, any>) =>
    $authHost.post(`/api/complaints/${id}/vigilance/submit`, data).then(r => r.data),

  acknowledgeVigilance: (id: number, data: Record<string, any>) =>
    $authHost.post(`/api/complaints/${id}/vigilance/acknowledge`, data).then(r => r.data),

  getOverdueVigilance: () =>
    $authHost.get("/api/complaints/vigilance/overdue").then(r => r.data),
};
