import { $authHost } from "../index";

export const designApi = {
  // Projects
  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/design/", { params }).then(r => r.data),
  getOne: (id: number) =>
    $authHost.get(`/api/design/${id}`).then(r => r.data),
  create: (data: Record<string, any>) =>
    $authHost.post("/api/design/", data).then(r => r.data),
  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/design/${id}`, data).then(r => r.data),
  getStats: () =>
    $authHost.get("/api/design/stats").then(r => r.data),

  // Inputs
  addInput: (projectId: number, data: Record<string, any>) =>
    $authHost.post(`/api/design/${projectId}/inputs`, data).then(r => r.data),
  updateInput: (inputId: number, data: Record<string, any>) =>
    $authHost.put(`/api/design/inputs/${inputId}`, data).then(r => r.data),

  // Outputs
  addOutput: (projectId: number, data: Record<string, any>) =>
    $authHost.post(`/api/design/${projectId}/outputs`, data).then(r => r.data),
  updateOutput: (outputId: number, data: Record<string, any>) =>
    $authHost.put(`/api/design/outputs/${outputId}`, data).then(r => r.data),

  // Reviews
  addReview: (projectId: number, data: Record<string, any>) =>
    $authHost.post(`/api/design/${projectId}/reviews`, data).then(r => r.data),
  completeReview: (reviewId: number, data: Record<string, any>) =>
    $authHost.put(`/api/design/reviews/${reviewId}/complete`, data).then(r => r.data),

  // Verifications
  addVerification: (projectId: number, data: Record<string, any>) =>
    $authHost.post(`/api/design/${projectId}/verifications`, data).then(r => r.data),
  updateVerification: (vId: number, data: Record<string, any>) =>
    $authHost.put(`/api/design/verifications/${vId}`, data).then(r => r.data),

  // Validations
  addValidation: (projectId: number, data: Record<string, any>) =>
    $authHost.post(`/api/design/${projectId}/validations`, data).then(r => r.data),
  updateValidation: (vId: number, data: Record<string, any>) =>
    $authHost.put(`/api/design/validations/${vId}`, data).then(r => r.data),

  // Transfers
  addTransfer: (projectId: number, data: Record<string, any>) =>
    $authHost.post(`/api/design/${projectId}/transfers`, data).then(r => r.data),
  completeTransfer: (tId: number, data: Record<string, any>) =>
    $authHost.put(`/api/design/transfers/${tId}/complete`, data).then(r => r.data),

  // Changes
  createChange: (projectId: number, data: Record<string, any>) =>
    $authHost.post(`/api/design/${projectId}/changes`, data).then(r => r.data),
  updateChangeStatus: (cId: number, data: Record<string, any>) =>
    $authHost.put(`/api/design/changes/${cId}/status`, data).then(r => r.data),
};
