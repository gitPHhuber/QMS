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

  linkRisk: (ncId: number, data: { riskId: number }) =>
    $authHost.post(`/api/nc/${ncId}/link-risk`, data).then(r => r.data),

  unlinkRisk: (ncId: number, data: { riskId: number }) =>
    $authHost.delete(`/api/nc/${ncId}/link-risk`, { data }).then(r => r.data),

  getOverdueEscalation: () =>
    $authHost.get("/api/nc/escalation/overdue").then(r => r.data),

  checkEscalation: () =>
    $authHost.post("/api/nc/escalation/check").then(r => r.data),
};

// ═══════════════════════════════════════════════════════════════
// CAPA API
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// RISKS API
// ═══════════════════════════════════════════════════════════════

export const risksApi = {
  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/risks", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/risks/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/risks", data).then(r => r.data),

  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/risks/${id}`, data).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/risks/stats").then(r => r.data),

  getMatrix: () =>
    $authHost.get("/api/risks/matrix").then(r => r.data),

  addAssessment: (riskId: number, data: Record<string, any>) =>
    $authHost.post(`/api/risks/${riskId}/assess`, data).then(r => r.data),

  addMitigation: (riskId: number, data: Record<string, any>) =>
    $authHost.post(`/api/risks/${riskId}/mitigation`, data).then(r => r.data),

  acceptRisk: (riskId: number, data: { decision: string }) =>
    $authHost.post(`/api/risks/${riskId}/accept`, data).then(r => r.data),

  completeMitigation: (mitigationId: number) =>
    $authHost.put(`/api/risks/mitigation/${mitigationId}/complete`).then(r => r.data),

  verifyMitigation: (mitigationId: number, data: Record<string, any>) =>
    $authHost.put(`/api/risks/mitigation/${mitigationId}/verify`, data).then(r => r.data),

  getLinkedNCs: (riskId: number) =>
    $authHost.get(`/api/risks/${riskId}/nonconformities`).then(r => r.data),
};

// ═══════════════════════════════════════════════════════════════
// RISK MANAGEMENT (ISO 14971) API
// ═══════════════════════════════════════════════════════════════

export type RmpStatus = "DRAFT" | "REVIEW" | "APPROVED" | "EFFECTIVE" | "REVISION" | "ARCHIVED";
export type LifecyclePhase = "CONCEPT" | "DESIGN" | "VERIFICATION" | "VALIDATION" | "PRODUCTION" | "POST_MARKET";
export type HazardCategory =
  | "ENERGY" | "BIOLOGICAL" | "CHEMICAL" | "OPERATIONAL"
  | "INFORMATION" | "ENVIRONMENTAL" | "ELECTROMAGNETIC"
  | "MECHANICAL" | "THERMAL" | "RADIATION" | "SOFTWARE" | "USE_ERROR";
export type HazardStatus = "IDENTIFIED" | "ANALYZED" | "CONTROLLED" | "VERIFIED" | "ACCEPTED" | "MONITORING";
export type RiskClass = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ControlType = "INHERENT_SAFETY" | "PROTECTIVE" | "INFORMATION";
export type ImplStatus = "PLANNED" | "IN_PROGRESS" | "IMPLEMENTED" | "VERIFIED" | "INEFFECTIVE";
export type VerificationResult = "PENDING" | "PASS" | "FAIL" | "PARTIAL";

export interface RiskManagementPlanShort {
  id: number;
  planNumber: string;
  title: string;
  version: string;
  productName: string;
  lifecyclePhase: LifecyclePhase;
  status: RmpStatus;
  responsiblePerson: { id: number; name: string; surname: string } | null;
  hazards: { id: number }[];
  updatedAt: string;
}

export interface HazardShort {
  id: number;
  hazardNumber: string;
  hazardCategory: HazardCategory;
  hazardDescription: string;
  harm: string;
  severityOfHarm: number;
  probabilityOfOccurrence: number;
  riskLevel: number;
  riskClass: RiskClass;
  residualRiskClass: RiskClass | null;
  status: HazardStatus;
}

export interface TraceabilityMatrixRow {
  hazardId: number;
  hazardNumber: string;
  hazardDescription: string;
  hazardousSituation: string;
  harm: string;
  initialRisk: { severity: number; probability: number; level: number; class: RiskClass };
  controlMeasures: Array<{
    id: number;
    traceNumber: string;
    description: string;
    type: ControlType;
    status: ImplStatus;
    verificationResult: VerificationResult;
    residualRiskAcceptable: boolean | null;
    newHazardsIntroduced: boolean;
  }>;
  residualRisk: { severity: number | null; probability: number | null; level: number | null; class: RiskClass | null };
  benefitRiskAnalysis: { id: number; benefitOutweighsRisk: boolean; conclusion: string } | null;
  hazardStatus: HazardStatus;
}

export const riskManagementApi = {
  // Plans
  getPlans: (params?: Record<string, any>) =>
    $authHost.get("/api/risk-management/plans", { params }).then(r => r.data),

  getPlan: (id: number) =>
    $authHost.get(`/api/risk-management/plans/${id}`).then(r => r.data),

  createPlan: (data: Record<string, any>) =>
    $authHost.post("/api/risk-management/plans", data).then(r => r.data),

  updatePlan: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/risk-management/plans/${id}`, data).then(r => r.data),

  submitPlanForReview: (id: number) =>
    $authHost.post(`/api/risk-management/plans/${id}/submit-review`).then(r => r.data),

  approvePlan: (id: number) =>
    $authHost.post(`/api/risk-management/plans/${id}/approve`).then(r => r.data),

  // Hazards
  getHazards: (params?: Record<string, any>) =>
    $authHost.get("/api/risk-management/hazards", { params }).then(r => r.data),

  getHazard: (id: number) =>
    $authHost.get(`/api/risk-management/hazards/${id}`).then(r => r.data),

  createHazard: (planId: number, data: Record<string, any>) =>
    $authHost.post(`/api/risk-management/plans/${planId}/hazards`, data).then(r => r.data),

  updateHazard: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/risk-management/hazards/${id}`, data).then(r => r.data),

  updateHazardResidual: (id: number, data: { residualSeverity: number; residualProbability: number }) =>
    $authHost.put(`/api/risk-management/hazards/${id}/residual`, data).then(r => r.data),

  // Benefit-Risk
  getBenefitRisk: (params?: Record<string, any>) =>
    $authHost.get("/api/risk-management/benefit-risk", { params }).then(r => r.data),

  createBenefitRisk: (planId: number, data: Record<string, any>) =>
    $authHost.post(`/api/risk-management/plans/${planId}/benefit-risk`, data).then(r => r.data),

  updateBenefitRisk: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/risk-management/benefit-risk/${id}`, data).then(r => r.data),

  reviewBenefitRisk: (id: number) =>
    $authHost.post(`/api/risk-management/benefit-risk/${id}/review`).then(r => r.data),

  // Traceability
  getTraceability: (params?: Record<string, any>) =>
    $authHost.get("/api/risk-management/traceability", { params }).then(r => r.data),

  createTraceability: (hazardId: number, data: Record<string, any>) =>
    $authHost.post(`/api/risk-management/hazards/${hazardId}/traceability`, data).then(r => r.data),

  updateTraceability: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/risk-management/traceability/${id}`, data).then(r => r.data),

  verifyTraceability: (id: number, data: Record<string, any>) =>
    $authHost.post(`/api/risk-management/traceability/${id}/verify`, data).then(r => r.data),

  // Matrix & Stats
  getTraceabilityMatrix: (planId: number) =>
    $authHost.get(`/api/risk-management/plans/${planId}/matrix`).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/risk-management/stats").then(r => r.data),
};

// ═══════════════════════════════════════════════════════════════
// SUPPLIERS API
// ═══════════════════════════════════════════════════════════════

export const suppliersApi = {
  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/suppliers", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/suppliers/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/suppliers", data).then(r => r.data),

  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/suppliers/${id}`, data).then(r => r.data),

  remove: (id: number) =>
    $authHost.delete(`/api/suppliers/${id}`).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/suppliers/stats").then(r => r.data),

  addEvaluation: (supplierId: number, data: Record<string, any>) =>
    $authHost.post(`/api/suppliers/${supplierId}/evaluations`, data).then(r => r.data),

  getEvaluations: (supplierId: number) =>
    $authHost.get(`/api/suppliers/${supplierId}/evaluations`).then(r => r.data),

  addAudit: (supplierId: number, data: Record<string, any>) =>
    $authHost.post(`/api/suppliers/${supplierId}/audits`, data).then(r => r.data),
};

// ═══════════════════════════════════════════════════════════════
// INTERNAL AUDITS API
// ═══════════════════════════════════════════════════════════════

export const internalAuditsApi = {
  getPlans: (params?: Record<string, any>) =>
    $authHost.get("/api/internal-audits/plans", { params }).then(r => r.data),

  getPlanOne: (id: number) =>
    $authHost.get(`/api/internal-audits/plans/${id}`).then(r => r.data),

  createPlan: (data: Record<string, any>) =>
    $authHost.post("/api/internal-audits/plans", data).then(r => r.data),

  updatePlan: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/internal-audits/plans/${id}`, data).then(r => r.data),

  getSchedules: (params?: Record<string, any>) =>
    $authHost.get("/api/internal-audits/schedules", { params }).then(r => r.data),

  getScheduleOne: (id: number) =>
    $authHost.get(`/api/internal-audits/schedules/${id}`).then(r => r.data),

  createSchedule: (data: Record<string, any>) =>
    $authHost.post("/api/internal-audits/schedules", data).then(r => r.data),

  updateSchedule: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/internal-audits/schedules/${id}`, data).then(r => r.data),

  addFinding: (scheduleId: number, data: Record<string, any>) =>
    $authHost.post(`/api/internal-audits/schedules/${scheduleId}/findings`, data).then(r => r.data),

  updateFinding: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/internal-audits/findings/${id}`, data).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/internal-audits/stats").then(r => r.data),

  getChecklists: (params?: Record<string, any>) =>
    $authHost.get("/api/internal-audits/checklists", { params }).then(r => r.data),

  seedChecklists: () =>
    $authHost.post("/api/internal-audits/checklists/seed").then(r => r.data),

  createChecklist: (data: Record<string, any>) =>
    $authHost.post("/api/internal-audits/checklists", data).then(r => r.data),

  getChecklistByClause: (clause: string) =>
    $authHost.get(`/api/internal-audits/checklists/${clause}`).then(r => r.data),

  getChecklistResponses: (scheduleId: number) =>
    $authHost.get(`/api/internal-audits/schedules/${scheduleId}/checklist-responses`).then(r => r.data),

  initChecklist: (scheduleId: number, data: Record<string, any>) =>
    $authHost.post(`/api/internal-audits/schedules/${scheduleId}/checklist-init`, data).then(r => r.data),

  bulkUpdateResponses: (scheduleId: number, data: Record<string, any>) =>
    $authHost.put(`/api/internal-audits/schedules/${scheduleId}/checklist-responses`, data).then(r => r.data),

  updateResponse: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/internal-audits/checklist-responses/${id}`, data).then(r => r.data),

  createCapaFromFinding: (findingId: number) =>
    $authHost.post(`/api/internal-audits/findings/${findingId}/create-capa`).then(r => r.data),

  distributeReport: (scheduleId: number) =>
    $authHost.post(`/api/internal-audits/schedules/${scheduleId}/distribute-report`).then(r => r.data),
};

// ═══════════════════════════════════════════════════════════════
// TRAINING API
// ═══════════════════════════════════════════════════════════════

export const trainingApi = {
  getPlans: (params?: Record<string, any>) =>
    $authHost.get("/api/training/plans", { params }).then(r => r.data),

  getPlanOne: (id: number) =>
    $authHost.get(`/api/training/plans/${id}`).then(r => r.data),

  createPlan: (data: Record<string, any>) =>
    $authHost.post("/api/training/plans", data).then(r => r.data),

  updatePlan: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/training/plans/${id}`, data).then(r => r.data),

  getRecords: (params?: Record<string, any>) =>
    $authHost.get("/api/training/records", { params }).then(r => r.data),

  createRecord: (data: Record<string, any>) =>
    $authHost.post("/api/training/records", data).then(r => r.data),

  updateRecord: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/training/records/${id}`, data).then(r => r.data),

  getCompetency: (params?: Record<string, any>) =>
    $authHost.get("/api/training/competency", { params }).then(r => r.data),

  createCompetency: (data: Record<string, any>) =>
    $authHost.post("/api/training/competency", data).then(r => r.data),

  updateCompetency: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/training/competency/${id}`, data).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/training/stats").then(r => r.data),
};

// ═══════════════════════════════════════════════════════════════
// EQUIPMENT API
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// MANAGEMENT REVIEW API
// ═══════════════════════════════════════════════════════════════

export const reviewsApi = {
  list: (params?: Record<string, any>) =>
    $authHost.get("/api/reviews", { params }).then(r => r.data),

  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/reviews", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/reviews/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/reviews", data).then(r => r.data),

  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/reviews/${id}`, data).then(r => r.data),

  addAction: (reviewId: number, data: Record<string, any>) =>
    $authHost.post(`/api/reviews/${reviewId}/actions`, data).then(r => r.data),

  updateAction: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/reviews/actions/${id}`, data).then(r => r.data),

  stats: () =>
    $authHost.get("/api/reviews/stats").then(r => r.data),

  getStats: () =>
    $authHost.get("/api/reviews/stats").then(r => r.data),
};

// ═══════════════════════════════════════════════════════════════
// CAPA API
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// COMPLAINTS API
// ═══════════════════════════════════════════════════════════════

export const complaintsApi = {
  getAll: (params?: Record<string, any>) =>
    $authHost.get("/api/complaints", { params }).then(r => r.data),

  getOne: (id: number) =>
    $authHost.get(`/api/complaints/${id}`).then(r => r.data),

  create: (data: Record<string, any>) =>
    $authHost.post("/api/complaints", data).then(r => r.data),

  update: (id: number, data: Record<string, any>) =>
    $authHost.put(`/api/complaints/${id}`, data).then(r => r.data),

  getStats: () =>
    $authHost.get("/api/complaints/stats").then(r => r.data),

  submitVigilance: (id: number, data: Record<string, any>) =>
    $authHost.post(`/api/complaints/${id}/vigilance/submit`, data).then(r => r.data),

  acknowledgeVigilance: (id: number, data: Record<string, any>) =>
    $authHost.post(`/api/complaints/${id}/vigilance/acknowledge`, data).then(r => r.data),

  getOverdueVigilance: () =>
    $authHost.get("/api/complaints/vigilance/overdue").then(r => r.data),
};

// ═══════════════════════════════════════════════════════════════
// CHANGE CONTROL API
// ═══════════════════════════════════════════════════════════════

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
};

// ═══════════════════════════════════════════════════════════════
// PROCESS VALIDATION API
// ═══════════════════════════════════════════════════════════════

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
};

// ═══════════════════════════════════════════════════════════════
// PRODUCT REGISTRY API
// ═══════════════════════════════════════════════════════════════

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
};

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS API
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// DASHBOARD API (ISO 8.4)
// ═══════════════════════════════════════════════════════════════

export interface QualityObjectiveItem {
  id: number;
  number: string;
  title: string;
  description: string | null;
  metric: string;
  targetValue: number;
  currentValue: number | null;
  unit: string | null;
  status: "ACTIVE" | "ACHIEVED" | "NOT_ACHIEVED" | "CANCELLED";
  category: "PROCESS" | "PRODUCT" | "CUSTOMER" | "IMPROVEMENT" | "COMPLIANCE";
  progress: number;
  dueDate: string | null;
  isoClause: string | null;
  responsible?: { id: number; name: string; surname: string } | null;
}

export interface DashboardNcSummary {
  openCount: number;
  overdueCount: number;
  byClassification: Record<string, number>;
}

export interface DashboardCapaSummary {
  activeCount: number;
  overdueCount: number;
  effectivenessRate: number;
  avgCloseDays: number;
  overdueItems: Array<{ id: number; number: string; title: string; dueDate: string; overdueDays: number }>;
}

export interface DashboardRiskSummary {
  cellCounts: Record<string, number>;
  byClass: Record<string, number>;
}

export interface DashboardComplaintsSummary {
  open: number;
  investigating: number;
  closedThisMonth: number;
  avgResponseDays: number;
}

export interface DashboardTimelineEvent {
  date: string;
  code: string;
  text: string;
  category: "nc" | "capa" | "audit" | "risk" | "doc" | "equipment";
}

export interface DashboardSummary {
  nc: DashboardNcSummary | null;
  capa: DashboardCapaSummary | null;
  risks: DashboardRiskSummary | null;
  complaints: DashboardComplaintsSummary | null;
  documents: { awaitingReview: number; overdue: number; pendingDocs: any[] } | null;
  audits: { next: any | null; openFindings: number } | null;
  equipment: { upcomingCalibrations: Array<{ id: number; inventoryNumber: string; name: string; nextCalibrationDate: string; daysUntil: number }> } | null;
  training: { completed: number; planned: number; expired: number; totalRecords: number } | null;
  suppliers: { byStatus: Record<string, number>; total: number; approvedPct: number } | null;
  review: { next: any | null; daysUntil: number | null; readinessPercent: number } | null;
  qualityObjectives: QualityObjectiveItem[] | null;
  timeline: DashboardTimelineEvent[] | null;
  generatedAt: string;
}

export interface TrendDataPoint {
  month: string;
  count: number;
}

export interface DashboardTrends {
  nc: TrendDataPoint[];
  capa: TrendDataPoint[];
  complaints: TrendDataPoint[];
}

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
