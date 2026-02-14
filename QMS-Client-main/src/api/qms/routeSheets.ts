import { $authHost } from "../index";

export const routeSheetApi = {
  getBySerial: (serialNumber: string) =>
    $authHost.get(`/api/mes/route-sheets/by-serial/${encodeURIComponent(serialNumber)}`).then((r) => r.data),

  getByUnit: (unitId: number) =>
    $authHost.get(`/api/mes/route-sheets/by-unit/${unitId}`).then((r) => r.data),

  getOperation: (id: number) =>
    $authHost.get(`/api/mes/route-sheets/operations/${id}`).then((r) => r.data),

  startOperation: (id: number, data?: Record<string, unknown>) =>
    $authHost.post(`/api/mes/route-sheets/operations/${id}/start`, data).then((r) => r.data),

  respond: (id: number, data: Record<string, unknown>) =>
    $authHost.post(`/api/mes/route-sheets/operations/${id}/respond`, data).then((r) => r.data),

  completeOperation: (id: number, data?: Record<string, unknown>) =>
    $authHost.post(`/api/mes/route-sheets/operations/${id}/complete`, data).then((r) => r.data),

  failOperation: (id: number, data: Record<string, unknown>) =>
    $authHost.post(`/api/mes/route-sheets/operations/${id}/fail`, data).then((r) => r.data),

  holdOperation: (id: number, data: Record<string, unknown>) =>
    $authHost.post(`/api/mes/route-sheets/operations/${id}/hold`, data).then((r) => r.data),

  inspect: (id: number, data?: Record<string, unknown>) =>
    $authHost.post(`/api/mes/route-sheets/operations/${id}/inspect`, data).then((r) => r.data),

  getActive: (params?: Record<string, unknown>) =>
    $authHost.get("/api/mes/route-sheets/active", { params }).then((r) => r.data),

  getWorkstation: (sectionId: number) =>
    $authHost.get(`/api/mes/route-sheets/workstation/${sectionId}`).then((r) => r.data),
};
