import { $authHost } from "../index";

export const mesKpiApi = {
  getDashboard: (params?: Record<string, unknown>) =>
    $authHost.get("/api/mes/kpi/dashboard", { params }).then((r) => r.data),

  getSummary: () =>
    $authHost.get("/api/mes/kpi/summary").then((r) => r.data),

  getOee: (params?: Record<string, unknown>) =>
    $authHost.get("/api/mes/kpi/oee", { params }).then((r) => r.data),

  getFpy: (params?: Record<string, unknown>) =>
    $authHost.get("/api/mes/kpi/fpy", { params }).then((r) => r.data),

  getCycleTime: (params?: Record<string, unknown>) =>
    $authHost.get("/api/mes/kpi/cycle-time", { params }).then((r) => r.data),

  getYield: (params?: Record<string, unknown>) =>
    $authHost.get("/api/mes/kpi/yield", { params }).then((r) => r.data),

  getTargets: () =>
    $authHost.get("/api/mes/kpi/targets").then((r) => r.data),

  createTarget: (data: Record<string, unknown>) =>
    $authHost.post("/api/mes/kpi/targets", data).then((r) => r.data),

  updateTarget: (id: number, data: Record<string, unknown>) =>
    $authHost.put(`/api/mes/kpi/targets/${id}`, data).then((r) => r.data),
};
