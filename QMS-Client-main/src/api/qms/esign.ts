import { $authHost } from "../index";

export const esignApi = {
  sign: (data: { entity: string; entityId: number; action: string; meaning: string; password: string; reason?: string }) =>
    $authHost.post("/api/esign/sign", data).then(r => r.data),

  getRequests: (params?: Record<string, any>) =>
    $authHost.get("/api/esign/requests", { params }).then(r => r.data),
  getRequest: (id: number) =>
    $authHost.get(`/api/esign/requests/${id}`).then(r => r.data),
  createRequest: (data: Record<string, any>) =>
    $authHost.post("/api/esign/requests", data).then(r => r.data),
  declineRequest: (signerId: number, data: { reason: string }) =>
    $authHost.post(`/api/esign/requests/signers/${signerId}/decline`, data).then(r => r.data),

  getSignatures: (entity: string, entityId: number) =>
    $authHost.get(`/api/esign/entity/${entity}/${entityId}`).then(r => r.data),
  verify: (id: number) =>
    $authHost.get(`/api/esign/verify/${id}`).then(r => r.data),
  invalidate: (id: number, data: { reason: string }) =>
    $authHost.post(`/api/esign/invalidate/${id}`, data).then(r => r.data),

  getPolicies: () =>
    $authHost.get("/api/esign/policies").then(r => r.data),
  createPolicy: (data: Record<string, any>) =>
    $authHost.post("/api/esign/policies", data).then(r => r.data),
  updatePolicy: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/esign/policies/${id}`, data).then(r => r.data),
};
