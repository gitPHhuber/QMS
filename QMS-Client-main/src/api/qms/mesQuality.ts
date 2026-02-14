import { $authHost } from "../index";

export const mesQualityApi = {
  hold: (unitId: number, data: Record<string, unknown>) =>
    $authHost.post(`/api/mes/quality/hold/${unitId}`, data).then((r) => r.data),

  release: (unitId: number, data?: Record<string, unknown>) =>
    $authHost.post(`/api/mes/quality/release/${unitId}`, data).then((r) => r.data),

  ncFromOperation: (data: Record<string, unknown>) =>
    $authHost.post("/api/mes/quality/nc-from-operation", data).then((r) => r.data),

  getHolds: (params?: Record<string, unknown>) =>
    $authHost.get("/api/mes/quality/holds", { params }).then((r) => r.data),
};
