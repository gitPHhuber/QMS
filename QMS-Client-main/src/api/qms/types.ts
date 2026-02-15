/**
 * QMS API — общие типы и интерфейсы
 */

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

// -- Risk Management (ISO 14971) --
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

// -- Dashboard (ISO 8.4) --
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
