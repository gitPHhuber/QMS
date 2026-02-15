import { $authHost } from "../index";
import type { AuditVerifyReport, AuditInspectionReport, AuditStats } from "./types";

export const auditApi = {
  getLogs: (params: Record<string, any>) =>
    $authHost.get("/api/audit/", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/audit/${id}`).then(r => r.data),

  quickVerify: (count = 100): Promise<AuditVerifyReport> =>
    $authHost.get("/api/audit/verify", { params: { count } }).then(r => r.data),

  fullVerify: (fromIndex?: number, toIndex?: number): Promise<AuditVerifyReport> =>
    $authHost.get("/api/audit/verify/full", { params: { fromIndex, toIndex } }).then(r => r.data),

  getReport: (): Promise<AuditInspectionReport> =>
    $authHost.get("/api/audit/report").then(r => r.data),

  getStats: (days = 30): Promise<AuditStats> =>
    $authHost.get("/api/audit/stats", { params: { days } }).then(r => r.data),
};
