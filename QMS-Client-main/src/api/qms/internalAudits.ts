import { $authHost } from "../index";

export const internalAuditsApi = {
  getPlans: (params?: Record<string, any>) =>
    $authHost.get("/api/internal-audits/plans", { params }).then(r => r.data),

  getPlanOne: (id: number) =>
    $authHost.get(`/api/internal-audits/plans/${id}`).then(r => r.data),

  createPlan: (data: Record<string, any>) =>
    $authHost.post("/api/internal-audits/plans", data).then(r => r.data),

  updatePlan: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/internal-audits/plans/${id}`, data).then(r => r.data),

  getSchedules: (params?: Record<string, any>) =>
    $authHost.get("/api/internal-audits/schedules", { params }).then(r => r.data),

  getScheduleOne: (id: number) =>
    $authHost.get(`/api/internal-audits/schedules/${id}`).then(r => r.data),

  createSchedule: (data: Record<string, any>) =>
    $authHost.post("/api/internal-audits/schedules", data).then(r => r.data),

  updateSchedule: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/internal-audits/schedules/${id}`, data).then(r => r.data),

  addFinding: (scheduleId: number, data: Record<string, any>) =>
    $authHost.post(`/api/internal-audits/schedules/${scheduleId}/findings`, data).then(r => r.data),

  updateFinding: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/internal-audits/findings/${id}`, data).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/internal-audits/stats").then(r => r.data),

  getChecklists: (params?: Record<string, any>) =>
    $authHost.get("/api/internal-audits/checklists", { params }).then(r => r.data),

  seedChecklists: () =>
    $authHost.post("/api/internal-audits/checklists/seed").then(r => r.data),

  createChecklist: (data: Record<string, any>) =>
    $authHost.post("/api/internal-audits/checklists", data).then(r => r.data),

  getChecklistByClause: (clause: string) =>
    $authHost.get(`/api/internal-audits/checklists/${clause}`).then(r => r.data),

  getChecklistResponses: (scheduleId: number) =>
    $authHost.get(`/api/internal-audits/schedules/${scheduleId}/checklist-responses`).then(r => r.data),

  initChecklist: (scheduleId: number, data: Record<string, any>) =>
    $authHost.post(`/api/internal-audits/schedules/${scheduleId}/checklist-init`, data).then(r => r.data),

  bulkUpdateResponses: (scheduleId: number, data: Record<string, any>) =>
    $authHost.put(`/api/internal-audits/schedules/${scheduleId}/checklist-responses`, data).then(r => r.data),

  updateResponse: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/internal-audits/checklist-responses/${id}`, data).then(r => r.data),

  createCapaFromFinding: (findingId: number) =>
    $authHost.post(`/api/internal-audits/findings/${findingId}/create-capa`).then(r => r.data),

  distributeReport: (scheduleId: number) =>
    $authHost.post(`/api/internal-audits/schedules/${scheduleId}/distribute-report`).then(r => r.data),
};
