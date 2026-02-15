import { $authHost } from "../index";

export const trainingApi = {
  getPlans: (params?: Record<string, any>) =>
    $authHost.get("/api/training/plans", { params }).then(r => r.data),

  getPlanOne: (id: number) =>
    $authHost.get(`/api/training/plans/${id}`).then(r => r.data),

  createPlan: (data: Record<string, any>) =>
    $authHost.post("/api/training/plans", data).then(r => r.data),

  updatePlan: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/training/plans/${id}`, data).then(r => r.data),

  getRecords: (params?: Record<string, any>) =>
    $authHost.get("/api/training/records", { params }).then(r => r.data),

  createRecord: (data: Record<string, any>) =>
    $authHost.post("/api/training/records", data).then(r => r.data),

  updateRecord: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/training/records/${id}`, data).then(r => r.data),

  getCompetency: (params?: Record<string, any>) =>
    $authHost.get("/api/training/competency", { params }).then(r => r.data),

  createCompetency: (data: Record<string, any>) =>
    $authHost.post("/api/training/competency", data).then(r => r.data),

  updateCompetency: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/training/competency/${id}`, data).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/training/stats").then(r => r.data),

  // Plan items (annual plan)
  getPlanItems: (params?: Record<string, any>) =>
    $authHost.get("/api/training/plan-items", { params }).then(r => r.data),

  createPlanItem: (data: Record<string, any>) =>
    $authHost.post("/api/training/plan-items", data).then(r => r.data),

  updatePlanItem: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/training/plan-items/${id}`, data).then(r => r.data),

  deletePlanItem: (id: number) =>
    $authHost.delete(`/api/training/plan-items/${id}`).then(r => r.data),

  // Gap analysis
  getGapAnalysis: () =>
    $authHost.get("/api/training/gap-analysis").then(r => r.data),
};
