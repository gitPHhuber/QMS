import { $authHost } from "../index";

export const acceptanceTestApi = {
  getAll: (params?: Record<string, unknown>) =>
    $authHost.get("/api/mes/acceptance-tests", { params }).then((r) => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/mes/acceptance-tests/${id}`).then((r) => r.data),

  create: (data: Record<string, unknown>) =>
    $authHost.post("/api/mes/acceptance-tests", data).then((r) => r.data),

  update: (id: number, data: Record<string, unknown>) =>
    $authHost.put(`/api/mes/acceptance-tests/${id}`, data).then((r) => r.data),

  submit: (id: number) =>
    $authHost.post(`/api/mes/acceptance-tests/${id}/submit`).then((r) => r.data),

  startTesting: (id: number) =>
    $authHost.post(`/api/mes/acceptance-tests/${id}/start-testing`).then((r) => r.data),

  updateItem: (itemId: number, data: Record<string, unknown>) =>
    $authHost.put(`/api/mes/acceptance-tests/items/${itemId}`, data).then((r) => r.data),

  decide: (id: number, data: Record<string, unknown>) =>
    $authHost.post(`/api/mes/acceptance-tests/${id}/decide`, data).then((r) => r.data),

  getCertificatePdf: (id: number) =>
    $authHost.get(`/api/mes/acceptance-tests/${id}/certificate-pdf`, { responseType: "blob" }).then((r) => r.data),

  getProtocolPdf: (id: number) =>
    $authHost.get(`/api/mes/acceptance-tests/${id}/protocol-pdf`, { responseType: "blob" }).then((r) => r.data),

  getJournal: (params?: Record<string, unknown>) =>
    $authHost.get("/api/mes/acceptance-tests/journal", { params }).then((r) => r.data),

  // Templates
  getTemplates: (params?: Record<string, unknown>) =>
    $authHost.get("/api/mes/acceptance-tests/templates", { params }).then((r) => r.data),

  createTemplate: (data: Record<string, unknown>) =>
    $authHost.post("/api/mes/acceptance-tests/templates", data).then((r) => r.data),

  updateTemplate: (id: number, data: Record<string, unknown>) =>
    $authHost.put(`/api/mes/acceptance-tests/templates/${id}`, data).then((r) => r.data),
};
