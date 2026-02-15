import { $authHost } from "../index";

export const changeRequestsApi = {
  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/change-requests", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/change-requests/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/change-requests", data).then(r => r.data),

  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/change-requests/${id}`, data).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/change-requests/stats").then(r => r.data),

  // Impact items
  getImpactItems: (changeId: number) =>
    $authHost.get(`/api/change-requests/${changeId}/impacts`).then(r => r.data),

  addImpactItem: (changeId: number, data: Record<string, any>) =>
    $authHost.post(`/api/change-requests/${changeId}/impacts`, data).then(r => r.data),

  updateImpactItem: (itemId: number, data: Record<string, any>) =>
    $authHost.put(`/api/change-requests/impacts/${itemId}`, data).then(r => r.data),

  deleteImpactItem: (itemId: number) =>
    $authHost.delete(`/api/change-requests/impacts/${itemId}`).then(r => r.data),

  // Analytics
  getAnalytics: () =>
    $authHost.get("/api/change-requests/analytics").then(r => r.data),
};

export const validationsApi = {
  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/process-validations", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/process-validations/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/process-validations", data).then(r => r.data),

  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/process-validations/${id}`, data).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/process-validations/stats").then(r => r.data),

  // Protocol templates
  getTemplates: (params?: Record<string, any>) =>
    $authHost.get("/api/process-validations/templates", { params }).then(r => r.data),

  getTemplateOne: (id: number) =>
    $authHost.get(`/api/process-validations/templates/${id}`).then(r => r.data),

  createTemplate: (data: Record<string, any>) =>
    $authHost.post("/api/process-validations/templates", data).then(r => r.data),

  updateTemplate: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/process-validations/templates/${id}`, data).then(r => r.data),

  // Checklists
  getChecklists: (validationId: number) =>
    $authHost.get(`/api/process-validations/${validationId}/checklists`).then(r => r.data),

  createChecklistFromTemplate: (validationId: number, data: Record<string, any>) =>
    $authHost.post(`/api/process-validations/${validationId}/checklists/from-template`, data).then(r => r.data),

  updateChecklistItem: (itemId: number, data: Record<string, any>) =>
    $authHost.put(`/api/process-validations/checklists/items/${itemId}`, data).then(r => r.data),

  completeChecklist: (checklistId: number) =>
    $authHost.put(`/api/process-validations/checklists/${checklistId}/complete`).then(r => r.data),
};

export const productsApi = {
  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/products", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/products/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/products", data).then(r => r.data),

  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/products/${id}`, data).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/products/stats").then(r => r.data),

  // DMF sections
  getDmfSections: (productId: number) =>
    $authHost.get(`/api/products/${productId}/dmf`).then(r => r.data),

  getDmfSummary: (productId: number) =>
    $authHost.get(`/api/products/${productId}/dmf/summary`).then(r => r.data),

  createDmfSection: (productId: number, data: Record<string, any>) =>
    $authHost.post(`/api/products/${productId}/dmf`, data).then(r => r.data),

  initDmfSections: (productId: number) =>
    $authHost.post(`/api/products/${productId}/dmf/init`).then(r => r.data),

  updateDmfSection: (sectionId: number, data: Record<string, any>) =>
    $authHost.put(`/api/products/dmf/${sectionId}`, data).then(r => r.data),

  deleteDmfSection: (sectionId: number) =>
    $authHost.delete(`/api/products/dmf/${sectionId}`).then(r => r.data),

  // Customer requirements
  getCustomerRequirements: (params?: Record<string, any>) =>
    $authHost.get("/api/customer-requirements", { params }).then(r => r.data),

  createCustomerRequirement: (data: Record<string, any>) =>
    $authHost.post("/api/customer-requirements", data).then(r => r.data),

  updateCustomerRequirement: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/customer-requirements/${id}`, data).then(r => r.data),

  getCustomerRequirementStats: () =>
    $authHost.get("/api/customer-requirements/stats").then(r => r.data),
};

export const notificationsApi = {
  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/notifications", { params }).then(r => r.data),

  getCount: () =>
    $authHost.get("/api/notifications/count").then(r => r.data),

  markRead: (id: number) =>
    $authHost.patch(`/api/notifications/${id}/read`).then(r => r.data),

  markAllRead: () =>
    $authHost.post("/api/notifications/mark-all-read").then(r => r.data),
};
