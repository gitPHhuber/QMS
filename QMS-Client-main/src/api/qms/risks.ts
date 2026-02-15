import { $authHost } from "../index";

export const risksApi = {
  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/risks", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/risks/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/risks", data).then(r => r.data),

  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/risks/${id}`, data).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/risks/stats").then(r => r.data),

  getMatrix: () =>
    $authHost.get("/api/risks/matrix").then(r => r.data),

  addAssessment: (riskId: number, data: Record<string, any>) =>
    $authHost.post(`/api/risks/${riskId}/assess`, data).then(r => r.data),

  addMitigation: (riskId: number, data: Record<string, any>) =>
    $authHost.post(`/api/risks/${riskId}/mitigation`, data).then(r => r.data),

  acceptRisk: (riskId: number, data: { decision: string; justification?: string }) =>
    $authHost.post(`/api/risks/${riskId}/accept`, data).then(r => r.data),

  completeMitigation: (mitigationId: number) =>
    $authHost.put(`/api/risks/mitigation/${mitigationId}/complete`).then(r => r.data),

  verifyMitigation: (mitigationId: number, data: Record<string, any>) =>
    $authHost.put(`/api/risks/mitigation/${mitigationId}/verify`, data).then(r => r.data),

  getLinkedNCs: (riskId: number) =>
    $authHost.get(`/api/risks/${riskId}/nonconformities`).then(r => r.data),
};
