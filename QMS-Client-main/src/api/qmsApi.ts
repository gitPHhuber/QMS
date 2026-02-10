/**
 * qmsApi.ts — API клиенты для QMS модулей
 * 
 * НОВЫЙ ФАЙЛ: src/api/qmsApi.ts
 * 
 * Использует тот же $host/$authHost что и остальные API:
 *   import { $authHost } from "./index";
 */

import { $authHost } from "./index";

// ═══════════════════════════════════════════════════════════════
// ТИПЫ
// ═══════════════════════════════════════════════════════════════

// -- Audit --
export interface AuditVerifyReport {
  valid: boolean;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  unchainedRecords: number;
  firstChainIndex: number | null;
  lastChainIndex: number | null;
  errors: Array<{ chainIndex: number; recordId: number; valid: boolean; errors: string[] }>;
  verifiedAt: string;
  durationMs: number;
}

export interface AuditStats {
  period: { days: number; since: string };
  total: number;
  chainedTotal: number;
  chainCoverage: number;
  bySeverity: Array<{ severity: string; count: string }>;
  byEntity: Array<{ entity: string; count: string }>;
  byAction: Array<{ action: string; count: string }>;
}

export interface AuditInspectionReport {
  system: string;
  standard: string;
  generatedAt: string;
  chainIntegrity: AuditVerifyReport;
  severityDistribution: Array<{ severity: string; count: string }>;
  monthlyActivity: Array<{ month: string; count: string }>;
  conclusion: string;
}

// -- Documents --
export type DocType = "POLICY" | "MANUAL" | "PROCEDURE" | "WORK_INSTRUCTION" | "FORM" | "RECORD" | "SPECIFICATION" | "PLAN" | "EXTERNAL" | "OTHER";
export type DocStatus = "DRAFT" | "REVIEW" | "APPROVED" | "EFFECTIVE" | "REVISION" | "OBSOLETE" | "CANCELLED";

export interface DocumentShort {
  id: number;
  code: string;
  title: string;
  type: DocType;
  status: DocStatus;
  category: string | null;
  effectiveDate: string | null;
  nextReviewDate: string | null;
  owner: { id: number; name: string; surname: string };
  currentVersion: { id: number; version: string; status: string; effectiveAt: string | null } | null;
  updatedAt: string;
}

export interface DocumentApprovalItem {
  id: number;
  step: number;
  role: string;
  decision: string;
  comment: string | null;
  decidedAt: string | null;
  dueDate: string | null;
  assignedTo: { id: number; name: string; surname: string };
  version: {
    id: number;
    version: string;
    document: { id: number; code: string; title: string; type: string };
    createdBy: { id: number; name: string; surname: string };
  };
}

export interface DocumentStats {
  byStatus: Array<{ status: string; count: string }>;
  byType: Array<{ type: string; count: string }>;
  overdueCount: number;
  pendingApprovalsCount: number;
}

// -- NC --
export type NcStatus = "OPEN" | "INVESTIGATING" | "DISPOSITION" | "IMPLEMENTING" | "VERIFICATION" | "CLOSED" | "REOPENED";
export type NcClassification = "CRITICAL" | "MAJOR" | "MINOR";

export interface NcShort {
  id: number;
  number: string;
  title: string;
  source: string;
  classification: NcClassification;
  status: NcStatus;
  detectedAt: string;
  dueDate: string | null;
  reportedBy: { id: number; name: string; surname: string };
  assignedTo: { id: number; name: string; surname: string } | null;
}

// -- CAPA --
export type CapaStatus = "INITIATED" | "INVESTIGATING" | "PLANNING" | "PLAN_APPROVED" | "IMPLEMENTING" | "VERIFYING" | "EFFECTIVE" | "INEFFECTIVE" | "CLOSED";

export interface CapaShort {
  id: number;
  number: string;
  type: "CORRECTIVE" | "PREVENTIVE";
  title: string;
  status: CapaStatus;
  priority: string;
  dueDate: string | null;
  assignedTo: { id: number; name: string; surname: string } | null;
  initiatedBy: { id: number; name: string; surname: string };
  nonconformity: { id: number; number: string; title: string; classification: string } | null;
}

export interface NcCapaStats {
  ncByStatus: Array<{ status: string; count: string }>;
  ncBySource: Array<{ source: string; count: string }>;
  ncByClassification: Array<{ classification: string; count: string }>;
  capaByStatus: Array<{ status: string; count: string }>;
  capaByType: Array<{ type: string; count: string }>;
  overdueNc: number;
  overdueCapa: number;
}

// ═══════════════════════════════════════════════════════════════
// AUDIT API
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// DOCUMENTS API
// ═══════════════════════════════════════════════════════════════

export const documentsApi = {
  getAll: (params: Record<string, any>) =>
    $authHost.get("/api/documents/", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/documents/${id}`).then(r => r.data),

  getStats: (): Promise<DocumentStats> =>
    $authHost.get("/api/documents/stats").then(r => r.data),

  getPending: (): Promise<DocumentApprovalItem[]> =>
    $authHost.get("/api/documents/pending").then(r => r.data),

  getOverdue: () =>
    $authHost.get("/api/documents/overdue").then(r => r.data),

  create: (data: { title: string; type: DocType; category?: string; description?: string; isoSection?: string }) =>
    $authHost.post("/api/documents/", data).then(r => r.data),

  createVersion: (docId: number, data: { changeDescription?: string }) =>
    $authHost.post(`/api/documents/${docId}/versions`, data).then(r => r.data),

  uploadFile: (versionId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return $authHost.post(`/api/documents/versions/${versionId}/upload`, form).then(r => r.data);
  },

  submitForReview: (versionId: number, approvalChain: Array<{ userId: number; role: string; dueDate?: string }>) =>
    $authHost.post(`/api/documents/versions/${versionId}/submit`, { approvalChain }).then(r => r.data),

  decide: (approvalId: number, data: { decision: string; comment?: string }) =>
    $authHost.post(`/api/documents/approvals/${approvalId}/decide`, data).then(r => r.data),

  makeEffective: (versionId: number) =>
    $authHost.post(`/api/documents/versions/${versionId}/effective`).then(r => r.data),

  distribute: (versionId: number, userIds: number[]) =>
    $authHost.post(`/api/documents/versions/${versionId}/distribute`, { userIds }).then(r => r.data),

  acknowledge: (distributionId: number) =>
    $authHost.post(`/api/documents/distributions/${distributionId}/ack`).then(r => r.data),
};

// ═══════════════════════════════════════════════════════════════
// NC API
// ═══════════════════════════════════════════════════════════════

export const ncApi = {
  getAll: (params: Record<string, any>) =>
    $authHost.get("/api/nc/", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/nc/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/nc/", data).then(r => r.data),

  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/nc/${id}`, data).then(r => r.data),

  close: (id: number, data: { closingComment?: string }) =>
    $authHost.post(`/api/nc/${id}/close`, data).then(r => r.data),

  getStats: (): Promise<NcCapaStats> =>
    $authHost.get("/api/nc/stats").then(r => r.data),
};

// ═══════════════════════════════════════════════════════════════
// CAPA API
// ═══════════════════════════════════════════════════════════════

export const capaApi = {
  getAll: (params: Record<string, any>) =>
    $authHost.get("/api/nc/capa", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/nc/capa/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/nc/capa", data).then(r => r.data),

  updateStatus: (id: number, data: { status: string; comment?: string }) =>
    $authHost.put(`/api/nc/capa/${id}/status`, data).then(r => r.data),

  addAction: (capaId: number, data: { description: string; assignedToId?: number; dueDate?: string }) =>
    $authHost.post(`/api/nc/capa/${capaId}/actions`, data).then(r => r.data),

  updateAction: (actionId: number, data: Record<string, any>) =>
    $authHost.put(`/api/nc/capa/actions/${actionId}`, data).then(r => r.data),

  verify: (capaId: number, data: { isEffective: boolean; evidence?: string; comment?: string }) =>
    $authHost.post(`/api/nc/capa/${capaId}/verify`, data).then(r => r.data),
};
