import { $authHost } from "../index";

export const dhrApi = {
  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/dhr", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/dhr/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/dhr", data).then(r => r.data),

  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/dhr/${id}`, data).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/dhr/stats").then(r => r.data),

  // Materials
  addMaterial: (dhrId: number, data: Record<string, any>) =>
    $authHost.post(`/api/dhr/${dhrId}/materials`, data).then(r => r.data),

  updateMaterial: (matId: number, data: Record<string, any>) =>
    $authHost.put(`/api/dhr/materials/${matId}`, data).then(r => r.data),

  // Process steps
  addStep: (dhrId: number, data: Record<string, any>) =>
    $authHost.post(`/api/dhr/${dhrId}/steps`, data).then(r => r.data),

  updateStep: (stepId: number, data: Record<string, any>) =>
    $authHost.put(`/api/dhr/steps/${stepId}`, data).then(r => r.data),

  // Traceability
  getTraceChain: (dhrId: number) =>
    $authHost.get(`/api/dhr/${dhrId}/trace`).then(r => r.data),

  // Environment monitoring
  getMonitoringPoints: (params?: Record<string, any>) =>
    $authHost.get("/api/environment/points", { params }).then(r => r.data),

  createMonitoringPoint: (data: Record<string, any>) =>
    $authHost.post("/api/environment/points", data).then(r => r.data),

  updateMonitoringPoint: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/environment/points/${id}`, data).then(r => r.data),

  getReadings: (params?: Record<string, any>) =>
    $authHost.get("/api/environment/readings", { params }).then(r => r.data),

  addReading: (data: Record<string, any>) =>
    $authHost.post("/api/environment/readings", data).then(r => r.data),

  getEnvironmentStats: () =>
    $authHost.get("/api/environment/stats").then(r => r.data),
};
