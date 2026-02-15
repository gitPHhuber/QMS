

export interface User {
  id: number
  login: string
  name: string
  surname: string
  role: string
  abilities: string[]
  teamId?: number
  sectionId?: number
  team?: Team
  section?: Section
  img?: string | null
}

export interface Team {
  id: number
  title: string
  leaderId?: number
}

export interface Section {
  id: number
  title: string
}


export interface InventoryBox {
  id: number
  qrCode: string
  label: string
  partNumber?: string
  quantity: number
  unit: string
  status: string
  minQuantity?: number
  sectionId?: number
  section?: Section
  createdAt: string
  updatedAt: string
}

export interface WarehouseMovement {
  id: number
  boxId: number
  userId: number
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT'
  quantity: number
  reason?: string
  createdAt: string
  user?: User
  box?: InventoryBox
}


export interface Product {
  id: number
  serialNumber: string
  productTypeId: number
  productType?: ProductType
  status: string
  currentStepId?: number
  currentStep?: ProductionStep
  assignedUserId?: number
  assignedUser?: User
  createdAt: string
  updatedAt: string
}

export interface ProductType {
  id: number
  code: string
  name: string
  description?: string
  steps?: ProductionStep[]
}

export interface ProductionStep {
  id: number
  productTypeId: number
  title: string
  description?: string
  order: number
  checklistItems?: ChecklistItem[]
}

export interface ChecklistItem {
  id: number
  stepId: number
  title: string
  type: 'checkbox' | 'text' | 'number' | 'select' | 'photo' | 'serial'
  required: boolean
  options?: string[]
  order: number
}

export interface ChecklistResponse {
  id: number
  productId: number
  stepId: number
  itemId: number
  value: string
  userId: number
  createdAt: string
}


export interface Task {
  id: number
  title: string
  description?: string
  status: string
  priority: number
  projectId?: number
  project?: Project
  assigneeId?: number
  assignee?: User
  creatorId: number
  creator?: User
  dueDate?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: number
  title: string
  description?: string
  status: string
}


export interface UserRanking {
  userId: number
  user: User
  rank: number
  score: number
  operations: number
  trend: number
}

export interface TeamRanking {
  teamId: number
  team: Team
  rank: number
  score: number
  operations: number
  memberCount: number
}

export interface UserStats {
  totalOperations: number
  todayOperations: number
  weekOperations: number
  monthOperations: number
  avgPerDay: number
  rank: number
  totalUsers: number
}


// ── DMS (Document Management) ──

export interface QmsDocument {
  id: number
  code: string
  title: string
  type: string
  status: string
  ownerId: number
  owner?: User
  reviewCycleMonths?: number
  nextReviewDate?: string
  effectiveDate?: string
  isoSection?: string
  tags?: string[]
  currentVersion?: DocumentVersion
  versions?: DocumentVersion[]
  createdAt: string
  updatedAt: string
}

export interface DocumentVersion {
  id: number
  documentId: number
  version: string
  versionNumber: number
  status: string
  changeDescription?: string
  fileUrl?: string
  fileSize?: number
  fileMimeType?: string
  createdById: number
  createdBy?: User
  approvedById?: number
  approvedBy?: User
  approvedAt?: string
  effectiveAt?: string
  approvals?: DocumentApproval[]
  createdAt: string
}

export interface DocumentApproval {
  id: number
  versionId: number
  step: number
  role: string
  assignedToId: number
  assignedTo?: User
  decision: string
  comment?: string
  dueDate?: string
  decidedAt?: string
}

export interface DocumentDistribution {
  id: number
  versionId: number
  userId: number
  user?: User
  distributedAt: string
  acknowledged: boolean
  acknowledgedAt?: string
}

// ── NC / CAPA ──

export interface Nonconformity {
  id: number
  number: string
  title: string
  description: string
  source: string
  classification: string
  status: string
  disposition?: string
  productType?: string
  productSerialNumber?: string
  lotNumber?: string
  processName?: string
  supplierName?: string
  rootCause?: string
  rootCauseMethod?: string
  immediateAction?: string
  reportedById: number
  reportedBy?: User
  assignedToId?: number
  assignedTo?: User
  capaRequired: boolean
  riskRegisterId?: number
  capas?: Capa[]
  attachments?: NcAttachment[]
  createdAt: string
  updatedAt: string
}

export interface NcAttachment {
  id: number
  nonconformityId: number
  fileUrl: string
  fileSize: number
  uploadedById: number
}

export interface Capa {
  id: number
  number: string
  type: string
  title: string
  description: string
  status: string
  priority: string
  nonconformityId?: number
  nonconformity?: Nonconformity
  rootCauseAnalysis?: string
  rootCauseMethod?: string
  initiatedById: number
  initiatedBy?: User
  assignedToId?: number
  assignedTo?: User
  approvedById?: number
  dueDate?: string
  effectivenessCheckDate?: string
  effectivenessCheckDays?: number
  actions?: CapaAction[]
  verifications?: CapaVerification[]
  createdAt: string
  updatedAt: string
}

export interface CapaAction {
  id: number
  capaId: number
  order: number
  description: string
  assignedToId?: number
  assignedTo?: User
  status: string
  dueDate?: string
  completedAt?: string
  result?: string
}

export interface CapaVerification {
  id: number
  capaId: number
  verifiedById: number
  verifiedBy?: User
  isEffective: boolean
  evidence?: string
  verifiedAt: string
}

// ── Change Management ──

export interface ChangeRequest {
  id: number
  changeNumber: string
  title: string
  description: string
  justification?: string
  type: string
  priority: string
  category: string
  status: string
  impactAssessment?: string
  riskAssessment?: string
  regulatoryImpact?: boolean
  regulatoryDossierImpact?: string
  initiatorId: number
  initiator?: User
  reviewerId?: number
  reviewer?: User
  approverId?: number
  plannedDate?: string
  completedDate?: string
  linkedNcId?: number
  linkedCapaId?: number
  impactItems?: ChangeImpactItem[]
  createdAt: string
  updatedAt: string
}

export interface ChangeImpactItem {
  id: number
  changeRequestId: number
  impactArea: string
  description: string
  severity?: number
  likelihood?: number
  detectability?: number
  assessedById?: number
  assessedBy?: User
  assessedAt?: string
}

// ── Complaints ──

export interface Complaint {
  id: number
  complaintNumber: string
  complaintType: string
  source: string
  reporterName?: string
  reporterContact?: string
  reporterOrganization?: string
  receivedDate: string
  eventDate?: string
  countryOfOccurrence?: string
  productName?: string
  productModel?: string
  serialNumber?: string
  lotNumber?: string
  quantityAffected?: number
  title: string
  description: string
  severity: string
  category: string
  patientInvolved?: boolean
  healthHazard?: boolean
  isReportable?: boolean
  vigilanceReportNumber?: string
  vigilanceStatus?: string
  vigilanceDeadline?: string
  investigationSummary?: string
  rootCause?: string
  correctiveAction?: string
  preventiveAction?: string
  status: string
  linkedNcId?: number
  linkedCapaId?: number
  responsibleId?: number
  responsible?: User
  dueDate?: string
  createdAt: string
  updatedAt: string
}

// ── Risk Management ──

export interface RiskRegister {
  id: number
  number: string
  title: string
  description: string
  source?: string
  classification?: string
  initialProbability?: number
  initialSeverity?: number
  initialRiskLevel?: string
  residualProbability?: number
  residualSeverity?: number
  residualRiskLevel?: string
  status: string
  ownerId?: number
  owner?: User
  mitigations?: RiskMitigation[]
  createdAt: string
  updatedAt: string
}

export interface RiskMitigation {
  id: number
  riskRegisterId: number
  description: string
  targetProbability?: number
  targetSeverity?: number
  status: string
  capaId?: number
  responsibleId?: number
  responsible?: User
  completedAt?: string
  verifiedAt?: string
}

export interface RiskManagementPlan {
  id: number
  title: string
  status: string
  version?: string
  responsiblePersonId?: number
  responsiblePerson?: User
  completionPercentage?: number
  reviewDate?: string
  createdAt: string
  updatedAt: string
}

// ── Supplier Management ──

export interface Supplier {
  id: number
  name: string
  code: string
  type: string
  address?: string
  country?: string
  contactPerson?: string
  email?: string
  phone?: string
  status: string
  evaluationScore?: number
  lastAuditDate?: string
  lastEvaluationDate?: string
  riskLevel?: string
  certifications?: string[]
  evaluations?: SupplierEvaluation[]
  audits?: SupplierAuditRecord[]
  createdAt: string
  updatedAt: string
}

export interface SupplierEvaluation {
  id: number
  supplierId: number
  evaluationDate: string
  score: number
  qualityRating?: number
  deliveryRating?: number
  responsiveness?: number
  comments?: string
  evaluatedById: number
  evaluatedBy?: User
}

export interface SupplierAuditRecord {
  id: number
  supplierId: number
  auditDate: string
  auditType: string
  status: string
  auditedById?: number
  auditedBy?: User
  findings?: string
}

// ── Equipment Management ──

export interface Equipment {
  id: number
  code: string
  name: string
  type: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  location?: string
  status: string
  purchaseDate?: string
  lastCalibrationDate?: string
  nextCalibrationDate?: string
  calibrationFrequency?: number
  calibrations?: Calibration[]
  createdAt: string
  updatedAt: string
}

export interface Calibration {
  id: number
  equipmentId: number
  calibrationDate: string
  dueDate?: string
  calibrationMethod?: string
  certificateNumber?: string
  calibratedById?: number
  calibratedBy?: User
  status: string
  result?: string
  comments?: string
}

export interface MonitoringPoint {
  id: number
  name: string
  type: string
  location?: string
  unit: string
  minLimit?: number
  maxLimit?: number
  criticality?: string
  status: string
  createdAt: string
}

export interface EnvironmentalReading {
  id: number
  monitoringPointId: number
  monitoringPoint?: MonitoringPoint
  value: number
  timestamp: string
  isWithinLimit: boolean
  recordedById?: number
  recordedBy?: User
  excursionTriggered?: boolean
}

// ── Training ──

export interface TrainingRecord {
  id: number
  userId: number
  user?: User
  title: string
  description?: string
  type: string
  trainingDate: string
  duration?: number
  provider?: string
  certificateNumber?: string
  status: string
  competency?: string
  expiryDate?: string
  trainerId?: number
  trainer?: User
  createdAt: string
  updatedAt: string
}

export interface TrainingPlan {
  id: number
  year: number
  status: string
  approvedById?: number
  approvedBy?: User
  approvalDate?: string
  items?: TrainingPlanItem[]
  createdAt: string
}

export interface TrainingPlanItem {
  id: number
  trainingPlanId: number
  trainingTitle: string
  targetAudience?: string
  schedule?: string
  status: string
  trainerId?: number
  responsibleId?: number
  plannedDate?: string
  actualDate?: string
  completedParticipants?: number
}

export interface CompetencyMatrix {
  id: number
  userId: number
  user?: User
  role?: string
  position?: string
  requiredCompetencies?: string[]
  assessmentDate?: string
  isCompetent: boolean
  assessedById?: number
  assessedBy?: User
}

// ── Internal Audit ──

export interface InternalAuditPlan {
  id: number
  year: number
  scope?: string
  objectives?: string
  approvedById?: number
  approvedBy?: User
  status: string
  schedules?: AuditSchedule[]
  createdAt: string
}

export interface AuditSchedule {
  id: number
  auditPlanId: number
  auditType: string
  scheduledDate: string
  actualDate?: string
  auditors?: string[]
  area?: string
  department?: string
  findingsCount?: number
  status: string
  findings?: AuditFinding[]
  createdAt: string
}

export interface AuditFinding {
  id: number
  scheduleId: number
  findingType: string
  description: string
  severity: string
  rootCause?: string
  correctionAction?: string
  status: string
  capaId?: number
  createdAt: string
}

export interface AuditChecklist {
  id: number
  clause: string
  title: string
  items?: AuditChecklistItem[]
}

export interface AuditChecklistItem {
  id: number
  checklistId: number
  question: string
  guidance?: string
}

export interface AuditChecklistResponse {
  id: number
  scheduleId: number
  checklistId: number
  itemId: number
  response: string
  evidence?: string
  comment?: string
  respondedAt?: string
}

// ── Design Control ──

export interface DesignProject {
  id: number
  code: string
  title: string
  description?: string
  deviceType?: string
  status: string
  initiatorId?: number
  initiator?: User
  startDate?: string
  plannedCompletionDate?: string
  completionDate?: string
  inputs?: DesignInput[]
  outputs?: DesignOutput[]
  reviews?: DesignReview[]
  verifications?: DesignVerificationRecord[]
  validations?: DesignValidationRecord[]
  transfers?: DesignTransfer[]
  changes?: DesignChange[]
  createdAt: string
  updatedAt: string
}

export interface DesignInput {
  id: number
  projectId: number
  inputDescription: string
  source?: string
  criticality?: string
  status: string
}

export interface DesignOutput {
  id: number
  projectId: number
  outputDescription: string
  specification?: string
  verificationMethod?: string
  status: string
}

export interface DesignReview {
  id: number
  projectId: number
  reviewDate: string
  reviewPhase: string
  participants?: string[]
  findings?: string
  conclusions?: string
  approvedAt?: string
}

export interface DesignVerificationRecord {
  id: number
  projectId: number
  verificationMethod: string
  result?: string
  evidence?: string
  status: string
}

export interface DesignValidationRecord {
  id: number
  projectId: number
  validationMethod: string
  result?: string
  status: string
}

export interface DesignTransfer {
  id: number
  projectId: number
  transferDate?: string
  transferProcess?: string
  status: string
}

export interface DesignChange {
  id: number
  projectId: number
  changeDescription: string
  changeNumber?: string
  reason?: string
  status: string
}

// ── Process Validation ──

export interface ProcessValidation {
  id: number
  processName: string
  scope?: string
  status: string
  responsibleId?: number
  responsible?: User
  startDate?: string
  completionDate?: string
  validationType: string
  checklists?: ValidationChecklist[]
  createdAt: string
  updatedAt: string
}

export interface ValidationProtocolTemplate {
  id: number
  name: string
  description?: string
  version?: string
  createdById?: number
  approvedById?: number
  status: string
}

export interface ValidationChecklist {
  id: number
  processValidationId: number
  templateId?: number
  executedById?: number
  executedBy?: User
  reviewedById?: number
  startDate?: string
  completedDate?: string
  status: string
  items?: ValidationChecklistItem[]
}

export interface ValidationChecklistItem {
  id: number
  checklistId: number
  itemDescription: string
  expectedCriteria?: string
  result?: string
  executedById?: number
  evidence?: string
  executedAt?: string
}

// ── Dashboard / Quality Objectives ──

export interface QualityObjective {
  id: number
  title: string
  description?: string
  targetValue?: number
  actualValue?: number
  status: string
  owner?: string
  startDate?: string
  targetDate?: string
  reviewDate?: string
  relatedProcesses?: string[]
  createdAt: string
  updatedAt: string
}

export interface DashboardSummary {
  openNc: number
  activeCapa: number
  overdueDocuments: number
  pendingCalibrations: number
  openComplaints: number
  openRisks: number
  upcomingAudits: number
  trainingDue: number
}

export interface DashboardTrend {
  month: string
  nc: number
  capa: number
  complaints: number
  changes: number
}

// ── Electronic Signatures ──

export interface ESignature {
  id: number
  signedById: number
  signedBy?: User
  entityType: string
  entityId: number
  signatureData?: string
  timestamp: string
  status: string
  certificateInfo?: string
}

export interface SignatureRequest {
  id: number
  requestedByUserId: number
  requestedBy?: User
  entityType: string
  entityId: number
  status: string
  dueDate?: string
  signers?: SignatureRequestSigner[]
  createdAt: string
}

export interface SignatureRequestSigner {
  id: number
  requestId: number
  userId: number
  user?: User
  status: string
  signedAt?: string
  declinedAt?: string
  declineReason?: string
}

export interface SignaturePolicy {
  id: number
  name: string
  description?: string
  requireTwoFactor?: boolean
  retentionPeriod?: number
  createdAt: string
}

// ── Generic types ──

export interface PaginatedResponse<T> {
  rows: T[]
  count: number
  page?: number
  limit?: number
}

export interface ApiError {
  message: string
  error?: string
  statusCode?: number
}


export interface ScanResult {
  product: Product
  currentStep?: ProductionStep
  nextStep?: ProductionStep
  canProceed: boolean
  message?: string
}
