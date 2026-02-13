import { $authHost } from "../index";

export const equipmentApi = {
  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/equipment", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/equipment/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/equipment", data).then(r => r.data),

  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/equipment/${id}`, data).then(r => r.data),

  addCalibration: (equipmentId: number, data: Record<string, any>) =>
    $authHost.post(`/api/equipment/${equipmentId}/calibrations`, data).then(r => r.data),

  updateCalibration: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/equipment/calibrations/${id}`, data).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/equipment/stats").then(r => r.data),
};
