import { $authHost } from "../index";
import type { DashboardSummary, DashboardTrends, QualityObjectiveItem } from "./types";

export const dashboardApi = {
  getSummary: (): Promise<DashboardSummary> =>
    $authHost.get("/api/dashboard/summary").then(r => r.data),

  getTrends: (): Promise<DashboardTrends> =>
    $authHost.get("/api/dashboard/trends").then(r => r.data),

  // Quality Objectives CRUD
  getObjectives: (params?: Record<string, any>) =>
    $authHost.get("/api/dashboard/quality-objectives", { params }).then(r => r.data),

  getObjective: (id: number): Promise<QualityObjectiveItem> =>
    $authHost.get(`/api/dashboard/quality-objectives/${id}`).then(r => r.data),

  createObjective: (data: Record<string, any>): Promise<QualityObjectiveItem> =>
    $authHost.post("/api/dashboard/quality-objectives", data).then(r => r.data),

  updateObjective: (id: number, data: Record<string, any>): Promise<QualityObjectiveItem> =>
    $authHost.put(`/api/dashboard/quality-objectives/${id}`, data).then(r => r.data),

  deleteObjective: (id: number) =>
    $authHost.delete(`/api/dashboard/quality-objectives/${id}`).then(r => r.data),
};
