import { $authHost } from "../index";
import type { NcCapaStats } from "./types";

export const ncApi = {
  getAll: (params: Record<string, any>) =>
    $authHost.get("/api/nc/", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/nc/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/nc/", data).then(r => r.data),

  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/nc/${id}`, data).then(r => r.data),

  close: (id: number, data: { closingComment?: string }) =>
    $authHost.post(`/api/nc/${id}/close`, data).then(r => r.data),

  getStats: (): Promise<NcCapaStats> =>
    $authHost.get("/api/nc/stats").then(r => r.data),

  linkRisk: (ncId: number, data: { riskId: number }) =>
    $authHost.post(`/api/nc/${ncId}/link-risk`, data).then(r => r.data),

  unlinkRisk: (ncId: number, data: { riskId: number }) =>
    $authHost.delete(`/api/nc/${ncId}/link-risk`, { data }).then(r => r.data),

  getOverdueEscalation: () =>
    $authHost.get("/api/nc/escalation/overdue").then(r => r.data),

  checkEscalation: () =>
    $authHost.post("/api/nc/escalation/check").then(r => r.data),
};

export const capaApi = {
  getAll: (params: Record<string, any>) =>
    $authHost.get("/api/nc/capa", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/nc/capa/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/nc/capa", data).then(r => r.data),

  updateStatus: (id: number, data: { status: string; comment?: string }) =>
    $authHost.put(`/api/nc/capa/${id}/status`, data).then(r => r.data),

  addAction: (capaId: number, data: { description: string; assignedToId?: number; dueDate?: string }) =>
    $authHost.post(`/api/nc/capa/${capaId}/actions`, data).then(r => r.data),

  updateAction: (actionId: number, data: Record<string, any>) =>
    $authHost.put(`/api/nc/capa/actions/${actionId}`, data).then(r => r.data),

  verify: (capaId: number, data: { isEffective: boolean; evidence?: string; comment?: string }) =>
    $authHost.post(`/api/nc/capa/${capaId}/verify`, data).then(r => r.data),
};
