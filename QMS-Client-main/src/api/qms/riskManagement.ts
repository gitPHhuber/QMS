import { $authHost } from "../index";

export const riskManagementApi = {
  // Plans
  getPlans: (params?: Record<string, any>) =>
    $authHost.get("/api/risk-management/plans", { params }).then(r => r.data),

  getPlan: (id: number) =>
    $authHost.get(`/api/risk-management/plans/${id}`).then(r => r.data),

  createPlan: (data: Record<string, any>) =>
    $authHost.post("/api/risk-management/plans", data).then(r => r.data),

  updatePlan: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/risk-management/plans/${id}`, data).then(r => r.data),

  submitPlanForReview: (id: number) =>
    $authHost.post(`/api/risk-management/plans/${id}/submit-review`).then(r => r.data),

  approvePlan: (id: number) =>
    $authHost.post(`/api/risk-management/plans/${id}/approve`).then(r => r.data),

  // Hazards
  getHazards: (params?: Record<string, any>) =>
    $authHost.get("/api/risk-management/hazards", { params }).then(r => r.data),

  getHazard: (id: number) =>
    $authHost.get(`/api/risk-management/hazards/${id}`).then(r => r.data),

  createHazard: (planId: number, data: Record<string, any>) =>
    $authHost.post(`/api/risk-management/plans/${planId}/hazards`, data).then(r => r.data),

  updateHazard: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/risk-management/hazards/${id}`, data).then(r => r.data),

  updateHazardResidual: (id: number, data: { residualSeverity: number; residualProbability: number }) =>
    $authHost.put(`/api/risk-management/hazards/${id}/residual`, data).then(r => r.data),

  // Benefit-Risk
  getBenefitRisk: (params?: Record<string, any>) =>
    $authHost.get("/api/risk-management/benefit-risk", { params }).then(r => r.data),

  createBenefitRisk: (planId: number, data: Record<string, any>) =>
    $authHost.post(`/api/risk-management/plans/${planId}/benefit-risk`, data).then(r => r.data),

  updateBenefitRisk: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/risk-management/benefit-risk/${id}`, data).then(r => r.data),

  reviewBenefitRisk: (id: number) =>
    $authHost.post(`/api/risk-management/benefit-risk/${id}/review`).then(r => r.data),

  // Traceability
  getTraceability: (params?: Record<string, any>) =>
    $authHost.get("/api/risk-management/traceability", { params }).then(r => r.data),

  createTraceability: (hazardId: number, data: Record<string, any>) =>
    $authHost.post(`/api/risk-management/hazards/${hazardId}/traceability`, data).then(r => r.data),

  updateTraceability: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/risk-management/traceability/${id}`, data).then(r => r.data),

  verifyTraceability: (id: number, data: Record<string, any>) =>
    $authHost.post(`/api/risk-management/traceability/${id}/verify`, data).then(r => r.data),

  // Matrix & Stats
  getTraceabilityMatrix: (planId: number) =>
    $authHost.get(`/api/risk-management/plans/${planId}/matrix`).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/risk-management/stats").then(r => r.data),
};
