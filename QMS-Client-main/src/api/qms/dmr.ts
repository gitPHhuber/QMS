import { $authHost } from "../index";

export const dmrApi = {
  getAll: (params?: Record<string, unknown>) =>
    $authHost.get("/api/mes/dmr", { params }).then((r) => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/mes/dmr/${id}`).then((r) => r.data),

  create: (data: Record<string, unknown>) =>
    $authHost.post("/api/mes/dmr", data).then((r) => r.data),

  update: (id: number, data: Record<string, unknown>) =>
    $authHost.put(`/api/mes/dmr/${id}`, data).then((r) => r.data),

  submitReview: (id: number) =>
    $authHost.post(`/api/mes/dmr/${id}/submit-review`).then((r) => r.data),

  approve: (id: number, data?: Record<string, unknown>) =>
    $authHost.post(`/api/mes/dmr/${id}/approve`, data).then((r) => r.data),

  obsolete: (id: number) =>
    $authHost.post(`/api/mes/dmr/${id}/obsolete`).then((r) => r.data),

  clone: (id: number) =>
    $authHost.post(`/api/mes/dmr/${id}/clone`).then((r) => r.data),

  getVersions: (id: number) =>
    $authHost.get(`/api/mes/dmr/${id}/versions`).then((r) => r.data),

  // BOM
  addBomItem: (dmrId: number, data: Record<string, unknown>) =>
    $authHost.post(`/api/mes/dmr/${dmrId}/bom`, data).then((r) => r.data),

  updateBomItem: (bomId: number, data: Record<string, unknown>) =>
    $authHost.put(`/api/mes/dmr/bom/${bomId}`, data).then((r) => r.data),

  deleteBomItem: (bomId: number) =>
    $authHost.delete(`/api/mes/dmr/bom/${bomId}`).then((r) => r.data),

  // Routes
  addRoute: (dmrId: number, data: Record<string, unknown>) =>
    $authHost.post(`/api/mes/dmr/${dmrId}/routes`, data).then((r) => r.data),

  updateRoute: (routeId: number, data: Record<string, unknown>) =>
    $authHost.put(`/api/mes/dmr/routes/${routeId}`, data).then((r) => r.data),

  // Steps
  addStep: (routeId: number, data: Record<string, unknown>) =>
    $authHost.post(`/api/mes/dmr/routes/${routeId}/steps`, data).then((r) => r.data),

  updateStep: (stepId: number, data: Record<string, unknown>) =>
    $authHost.put(`/api/mes/dmr/steps/${stepId}`, data).then((r) => r.data),

  deleteStep: (stepId: number) =>
    $authHost.delete(`/api/mes/dmr/steps/${stepId}`).then((r) => r.data),

  reorderSteps: (stepId: number, data: Record<string, unknown>) =>
    $authHost.post(`/api/mes/dmr/steps/${stepId}/reorder`, data).then((r) => r.data),

  // Checklist
  addChecklist: (stepId: number, data: Record<string, unknown>) =>
    $authHost.post(`/api/mes/dmr/steps/${stepId}/checklist`, data).then((r) => r.data),

  updateChecklist: (checkId: number, data: Record<string, unknown>) =>
    $authHost.put(`/api/mes/dmr/checklist/${checkId}`, data).then((r) => r.data),

  deleteChecklist: (checkId: number) =>
    $authHost.delete(`/api/mes/dmr/checklist/${checkId}`).then((r) => r.data),
};
