
const { User, PC, Session, AuditLog, Role, Ability, RoleAbility, FeatureFlag } = require("./definitions/General");
const { Section, Team } = require("./definitions/Structure");

const {
  Supply, WarehouseBox, WarehouseMovement,
  WarehouseDocument, InventoryLimit, ProductionTask,
  PrintHistory
} = require("./definitions/Warehouse");

const { Project } = require("./definitions/Project");

const {
  Document,
  DocumentVersion,
  DocumentApproval,
  DocumentDistribution,
  setupDocumentAssociations,
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
  VERSION_STATUSES,
  APPROVAL_ROLES,
  APPROVAL_DECISIONS,
} = require("./definitions/Document");

const {
  Nonconformity,
  NcAttachment,
  Capa,
  CapaAction,
  CapaVerification,
  setupNcCapaAssociations,
  NC_SOURCES,
  NC_CLASSIFICATIONS,
  NC_STATUSES,
  NC_DISPOSITIONS,
  CAPA_TYPES,
  CAPA_STATUSES,
  CAPA_PRIORITIES,
  CAPA_ACTION_STATUSES,
} = require("./definitions/NcCapa");

// ═══ QMS P1: Risk Management (ISO 14971) ═══
const { RiskRegister, RiskAssessment, RiskMitigation } = require("./definitions/Risk");

// ═══ QMS P1: Supplier Management (§7.4) ═══
const { Supplier, SupplierEvaluation, SupplierAudit } = require("./definitions/Supplier");

// ═══ QMS P2: Internal Audits (§8.2.4) ═══
const { AuditPlan, AuditSchedule, AuditFinding } = require("./definitions/InternalAudit");

// ═══ QMS P2: Training & Competency (§6.2) ═══
const { TrainingPlan, TrainingRecord, CompetencyMatrix } = require("./definitions/Training");

// ═══ QMS P2: Equipment & Calibration (§7.6) ═══
const { Equipment, CalibrationRecord } = require("./definitions/Equipment");

// ═══ QMS P2: Management Review (§5.6) ═══
const { ManagementReview, ReviewAction } = require("./definitions/ManagementReview");


// ─────────────────────────────────────────────────────────────
// БАЗОВЫЕ АССОЦИАЦИИ
// ─────────────────────────────────────────────────────────────

User.hasMany(Session);
Session.belongsTo(User);

Session.belongsTo(PC, { foreignKey: "PCId", as: "pc" });
PC.hasMany(Session, { foreignKey: "PCId", as: "sessions" });

AuditLog.belongsTo(User, { foreignKey: "userId", as: "User" });
User.hasMany(AuditLog, { foreignKey: "userId", as: "auditLogs" });

User.belongsTo(Team, { foreignKey: "teamId" });
Team.hasMany(User, { foreignKey: "teamId" });

Team.belongsTo(Section, { foreignKey: "sectionId", as: "section" });
Section.hasMany(Team, { foreignKey: "sectionId", as: "teams" });

Team.belongsTo(User, { foreignKey: "teamLeadId", as: "teamLead" });

Section.belongsTo(User, { foreignKey: "managerId", as: "manager" });
User.hasMany(Section, { foreignKey: "managerId", as: "managedSections" });

Role.belongsToMany(Ability, { through: RoleAbility, foreignKey: "roleId", as: "abilities" });
Ability.belongsToMany(Role, { through: RoleAbility, foreignKey: "abilityId", as: "roles" });
User.belongsTo(Role, { foreignKey: "roleId", as: "userRole" });


// ─────────────────────────────────────────────────────────────
// СКЛАД
// ─────────────────────────────────────────────────────────────

Supply.hasMany(WarehouseBox, { foreignKey: "supplyId", as: "boxes" });
WarehouseBox.belongsTo(Supply, { foreignKey: "supplyId", as: "supply" });

User.hasMany(WarehouseBox, { foreignKey: "acceptedById", as: "acceptedBoxes" });
WarehouseBox.belongsTo(User, { foreignKey: "acceptedById", as: "acceptedBy" });

WarehouseBox.belongsTo(Section, { foreignKey: "currentSectionId", as: "currentSection" });
Section.hasMany(WarehouseBox, { foreignKey: "currentSectionId", as: "boxes" });

WarehouseBox.hasMany(WarehouseMovement, { foreignKey: "boxId", as: "movements" });
WarehouseMovement.belongsTo(WarehouseBox, { foreignKey: "boxId", as: "box" });

WarehouseMovement.belongsTo(User, { foreignKey: "performedById", as: "performedBy" });
WarehouseMovement.belongsTo(Section, { foreignKey: "fromSectionId", as: "fromSection" });
WarehouseMovement.belongsTo(Section, { foreignKey: "toSectionId", as: "toSection" });


// ─────────────────────────────────────────────────────────────
// ЗАДАЧИ / ПРОЕКТЫ
// ─────────────────────────────────────────────────────────────

ProductionTask.belongsTo(User, { foreignKey: "responsibleId", as: "responsible" });
ProductionTask.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });
ProductionTask.belongsTo(Section, { foreignKey: "targetSectionId", as: "targetSection" });
ProductionTask.belongsTo(Project, { foreignKey: "projectId", as: "project" });

Project.belongsTo(User, { foreignKey: "createdById", as: "author" });
User.hasMany(Project, { foreignKey: "createdById", as: "projects" });


// ─────────────────────────────────────────────────────────────
// ═══ QMS Ассоциации ═══
// ─────────────────────────────────────────────────────────────

// Risk → User (владелец)
User.hasMany(RiskRegister, { as: "ownedRisks", foreignKey: "ownerId" });
RiskRegister.belongsTo(User, { as: "owner", foreignKey: "ownerId" });

// Training → User
User.hasMany(TrainingRecord, { as: "trainings", foreignKey: "userId" });
TrainingRecord.belongsTo(User, { as: "trainee", foreignKey: "userId" });

// Equipment → User
User.hasMany(Equipment, { as: "responsibleEquipment", foreignKey: "responsibleId" });
Equipment.belongsTo(User, { as: "responsible", foreignKey: "responsibleId" });

// Document → User
Document.belongsTo(User, { as: "author", foreignKey: "authorId" });
Document.belongsTo(User, { as: "approver", foreignKey: "currentApproverId" });

// Подключаем внутренние ассоциации модулей
if (typeof setupDocumentAssociations === "function") {
  setupDocumentAssociations({ User, Document, DocumentVersion, DocumentApproval, DocumentDistribution });
}
if (typeof setupNcCapaAssociations === "function") {
  setupNcCapaAssociations({ User, Nonconformity, NcAttachment, Capa, CapaAction, CapaVerification });
}


// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

module.exports = {
  User, PC, Session, AuditLog, Role, Ability, RoleAbility, FeatureFlag,

  Section, Team,

  Supply, WarehouseBox, WarehouseMovement,
  WarehouseDocument, InventoryLimit,
  ProductionTask, Project, PrintHistory,

  // ═══ QMS модули ═══
  Document,
  DocumentVersion,
  DocumentApproval,
  DocumentDistribution,
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
  VERSION_STATUSES,
  APPROVAL_ROLES,
  APPROVAL_DECISIONS,

  Nonconformity,
  NcAttachment,
  Capa,
  CapaAction,
  CapaVerification,
  NC_SOURCES,
  NC_CLASSIFICATIONS,
  NC_STATUSES,
  NC_DISPOSITIONS,
  CAPA_TYPES,
  CAPA_STATUSES,
  CAPA_PRIORITIES,
  CAPA_ACTION_STATUSES,

  RiskRegister, RiskAssessment, RiskMitigation,
  Supplier, SupplierEvaluation, SupplierAudit,
  AuditPlan, AuditSchedule, AuditFinding,
  TrainingPlan, TrainingRecord, CompetencyMatrix,
  Equipment, CalibrationRecord,
  ManagementReview, ReviewAction,
};
