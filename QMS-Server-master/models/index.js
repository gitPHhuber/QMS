
const { User, PC, Session, AuditLog, Role, Ability, RoleAbility } = require("./definitions/General");
const { Section, Team } = require("./definitions/Structure");

const {
  FC, CategoryDefect,
  ELRS915, CategoryDefect915,
  ELRS2_4, CategoryDefect2_4,
  CoralB, CategoryDefect_CoralB,
  AssemblyRoute, AssemblyRouteStep
} = require("./definitions/Production");

const {
  Supply, WarehouseBox, WarehouseMovement,
  WarehouseDocument, InventoryLimit, ProductionTask,
  PrintHistory
} = require("./definitions/Warehouse");

const { Project } = require("./definitions/Project");
const { AssemblyRecipe, RecipeStep, AssemblyProcess } = require("./definitions/Assembly");

const {
  ProductionOutput,
  OperationType,
  OUTPUT_STATUSES
} = require("./ProductionOutput");

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

const {
  DefectCategory,
  BoardDefect,
  RepairAction,
  setupDefectAssociations,
  BOARD_TYPES,
  DEFECT_STATUSES: BOARD_DEFECT_STATUSES,
  ACTION_TYPES
} = require("./definitions/Defect");

const {
  BeryllServer,
  BeryllBatch,
  BeryllHistory,
  BeryllChecklistTemplate,
  BeryllServerChecklist,
  BeryllDefectComment,
  BeryllDefectFile,
  BeryllServerComponent,
  DEFECT_CATEGORIES,
  DEFECT_PRIORITIES,
  DEFECT_STATUSES,
  COMPONENT_TYPES: BERYLL_COMPONENT_TYPES,
  COMPONENT_STATUSES,
  setupAssociations: setupBeryllAssociations
} = require("./definitions/Beryll");

const {
  BeryllRack,
  BeryllRackUnit,
  BeryllShipment,
  BeryllCluster,
  BeryllClusterServer,
  BeryllDefectRecord,
  BeryllDefectRecordFile,
  BeryllExtendedHistory,
  RACK_STATUSES,
  SHIPMENT_STATUSES,
  CLUSTER_STATUSES,
  SERVER_ROLES,
  DEFECT_RECORD_STATUSES,
  REPAIR_PART_TYPES,
  setupAssociations: setupExtendedAssociations
} = require("./definitions/BeryllExtended");

const {
  ComponentCatalog,
  ComponentInventory,
  ComponentHistory,
  setupComponentAssociations,
  COMPONENT_TYPES,
  INVENTORY_STATUSES,
  COMPONENT_CONDITIONS,
  HISTORY_ACTIONS
} = require("./definitions/ComponentModels");

const {
  YadroTicketLog,
  SubstituteServerPool,
  SlaConfig,
  UserAlias,
  BeryllClusterRack,
  YADRO_REQUEST_TYPES,
  YADRO_LOG_STATUSES,
  SUBSTITUTE_STATUSES
} = require("./definitions/YadroIntegration");

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

// ВАЖНО: не делаем 2 belongsTo с одним и тем же foreignKey на одну и ту же модель
Team.belongsTo(Section, { foreignKey: "sectionId", as: "section" });
Section.hasMany(Team, { foreignKey: "sectionId", as: "teams" });

Team.belongsTo(User, { foreignKey: "teamLeadId", as: "teamLead" });

Section.belongsTo(User, { foreignKey: "managerId", as: "manager" });
User.hasMany(Section, { foreignKey: "managerId", as: "managedSections" });

Role.belongsToMany(Ability, { through: RoleAbility, foreignKey: "roleId", as: "abilities" });
Ability.belongsToMany(Role, { through: RoleAbility, foreignKey: "abilityId", as: "roles" });
User.belongsTo(Role, { foreignKey: "roleId", as: "userRole" });


// ─────────────────────────────────────────────────────────────
// ПРОИЗВОДСТВО / ДЕФЕКТЫ (FC/ELRS/CoralB)
// ─────────────────────────────────────────────────────────────

Session.hasMany(FC); FC.belongsTo(Session);
CategoryDefect.hasMany(FC); FC.belongsTo(CategoryDefect);

Session.hasMany(ELRS915); ELRS915.belongsTo(Session);
CategoryDefect915.hasMany(ELRS915); ELRS915.belongsTo(CategoryDefect915);

Session.hasMany(ELRS2_4); ELRS2_4.belongsTo(Session);
CategoryDefect2_4.hasMany(ELRS2_4); ELRS2_4.belongsTo(CategoryDefect2_4);

Session.hasMany(CoralB); CoralB.belongsTo(Session);
CategoryDefect_CoralB.hasMany(CoralB); CoralB.belongsTo(CategoryDefect_CoralB);


// ─────────────────────────────────────────────────────────────
// Маршруты сборки
// ─────────────────────────────────────────────────────────────

AssemblyRoute.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });
User.hasMany(AssemblyRoute, { foreignKey: "createdById", as: "assemblyRoutes" });

AssemblyRoute.hasMany(AssemblyRouteStep, { foreignKey: "routeId", as: "steps", onDelete: "CASCADE" });
AssemblyRouteStep.belongsTo(AssemblyRoute, { foreignKey: "routeId", as: "route" });

AssemblyRouteStep.belongsTo(Section, { foreignKey: "sectionId", as: "section" });
AssemblyRouteStep.belongsTo(Team, { foreignKey: "teamId", as: "team" });


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
// ЗАДАЧИ / ПРОЕКТЫ / РЕЦЕПТЫ
// ─────────────────────────────────────────────────────────────

ProductionTask.belongsTo(User, { foreignKey: "responsibleId", as: "responsible" });
ProductionTask.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });
ProductionTask.belongsTo(Section, { foreignKey: "targetSectionId", as: "targetSection" });
ProductionTask.belongsTo(Project, { foreignKey: "projectId", as: "project" });

AssemblyRecipe.hasMany(RecipeStep, { foreignKey: "recipeId", as: "steps" });
RecipeStep.belongsTo(AssemblyRecipe, { foreignKey: "recipeId", as: "recipe" });

AssemblyProcess.belongsTo(AssemblyRecipe, { foreignKey: "recipeId", as: "recipe" });
AssemblyProcess.belongsTo(User, { foreignKey: "userId", as: "operator" });

Project.belongsTo(User, { foreignKey: "createdById", as: "author" });
User.hasMany(Project, { foreignKey: "createdById", as: "projects" });


// ─────────────────────────────────────────────────────────────
// BERYLL / ДЕФЕКТЫ / КОМПОНЕНТЫ
// ─────────────────────────────────────────────────────────────

setupBeryllAssociations(User);
setupDefectAssociations({ User });
setupExtendedAssociations({ User, BeryllServer });

setupComponentAssociations({
  User,
  BeryllServer,
  BeryllDefectRecord,
  BeryllServerComponent
});


// ─────────────────────────────────────────────────────────────
// Интеграции Ядро
// ─────────────────────────────────────────────────────────────

YadroTicketLog.belongsTo(BeryllServer, { foreignKey: "serverId", as: "server" });
YadroTicketLog.belongsTo(BeryllDefectRecord, { foreignKey: "defectRecordId", as: "defectRecord" });
YadroTicketLog.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });

BeryllServer.hasMany(YadroTicketLog, { foreignKey: "serverId", as: "yadroLogs" });
BeryllDefectRecord.hasMany(YadroTicketLog, { foreignKey: "defectRecordId", as: "yadroLogs" });

SubstituteServerPool.belongsTo(BeryllServer, { foreignKey: "serverId", as: "server" });
SubstituteServerPool.belongsTo(BeryllDefectRecord, { foreignKey: "currentDefectId", as: "currentDefect" });
SubstituteServerPool.belongsTo(User, { foreignKey: "issuedToUserId", as: "issuedTo" });

BeryllServer.hasOne(SubstituteServerPool, { foreignKey: "serverId", as: "substitutePoolEntry" });

UserAlias.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(UserAlias, { foreignKey: "userId", as: "aliases" });

BeryllClusterRack.belongsTo(BeryllCluster, { foreignKey: "clusterId", as: "cluster" });
BeryllClusterRack.belongsTo(BeryllRack, { foreignKey: "rackId", as: "rack" });
BeryllCluster.hasMany(BeryllClusterRack, { foreignKey: "clusterId", as: "rackAssignments" });
BeryllRack.hasMany(BeryllClusterRack, { foreignKey: "rackId", as: "clusterAssignments" });

BeryllDefectRecord.belongsTo(BeryllServerComponent, {
  foreignKey: "defectComponentId",
  as: "defectComponent"
});
BeryllDefectRecord.belongsTo(BeryllServerComponent, {
  foreignKey: "replacementComponentId",
  as: "replacementComponent"
});

BeryllDefectRecord.belongsTo(ComponentInventory, {
  foreignKey: "defectInventoryId",
  as: "defectInventoryItem"
});
BeryllDefectRecord.belongsTo(ComponentInventory, {
  foreignKey: "replacementInventoryId",
  as: "replacementInventoryItem"
});

BeryllDefectRecord.belongsTo(BeryllServer, {
  foreignKey: "substituteServerId",
  as: "substituteServer"
});
BeryllServer.hasMany(BeryllDefectRecord, {
  foreignKey: "substituteServerId",
  as: "substituteForDefects"
});


// ─────────────────────────────────────────────────────────────
// ProductionOutput
// ─────────────────────────────────────────────────────────────

ProductionOutput.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(ProductionOutput, { foreignKey: "userId", as: "productionOutputs" });

ProductionOutput.belongsTo(User, { foreignKey: "approvedById", as: "approvedBy" });
ProductionOutput.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });

ProductionOutput.belongsTo(Team, { foreignKey: "teamId", as: "production_team" });
Team.hasMany(ProductionOutput, { foreignKey: "teamId", as: "outputs" });

ProductionOutput.belongsTo(Section, { foreignKey: "sectionId", as: "production_section" });
Section.hasMany(ProductionOutput, { foreignKey: "sectionId", as: "outputs" });

ProductionOutput.belongsTo(Project, { foreignKey: "projectId", as: "project" });
Project.hasMany(ProductionOutput, { foreignKey: "projectId", as: "outputs" });

ProductionOutput.belongsTo(ProductionTask, { foreignKey: "taskId", as: "task" });
ProductionTask.hasMany(ProductionOutput, { foreignKey: "taskId", as: "outputs" });

ProductionOutput.belongsTo(OperationType, { foreignKey: "operationTypeId", as: "operationType" });
OperationType.hasMany(ProductionOutput, { foreignKey: "operationTypeId", as: "outputs" });


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

// Document → User (исправлено: Document вместо QMSDocument)
Document.belongsTo(User, { as: "author", foreignKey: "authorId" });
Document.belongsTo(User, { as: "approver", foreignKey: "currentApproverId" });

// Подключаем внутренние ассоциации модулей (если предусмотрены)
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
  User, PC, Session, AuditLog, Role, Ability, RoleAbility,

  Section, Team,

  FC, CategoryDefect,
  ELRS915, CategoryDefect915,
  ELRS2_4, CategoryDefect2_4,
  CoralB, CategoryDefect_CoralB,

  Supply, WarehouseBox, WarehouseMovement,
  WarehouseDocument, InventoryLimit,
  ProductionTask, Project, PrintHistory,

  AssemblyRoute, AssemblyRouteStep,
  AssemblyRecipe, RecipeStep, AssemblyProcess,

  BeryllServer,
  BeryllBatch,
  BeryllHistory,
  BeryllChecklistTemplate,
  BeryllServerChecklist,
  BeryllDefectComment,
  BeryllDefectFile,
  BeryllServerComponent,

  DEFECT_CATEGORIES,
  DEFECT_PRIORITIES,
  DEFECT_STATUSES,
  BERYLL_COMPONENT_TYPES,
  COMPONENT_STATUSES,

  DefectCategory,
  BoardDefect,
  RepairAction,
  BOARD_TYPES,
  BOARD_DEFECT_STATUSES,
  ACTION_TYPES,

  BeryllRack,
  BeryllRackUnit,
  BeryllShipment,
  BeryllCluster,
  BeryllClusterServer,
  BeryllDefectRecord,
  BeryllDefectRecordFile,
  BeryllExtendedHistory,

  RACK_STATUSES,
  SHIPMENT_STATUSES,
  CLUSTER_STATUSES,
  SERVER_ROLES,
  DEFECT_RECORD_STATUSES,
  REPAIR_PART_TYPES,

  ComponentCatalog,
  ComponentInventory,
  ComponentHistory,
  COMPONENT_TYPES,
  INVENTORY_STATUSES,
  COMPONENT_CONDITIONS,
  HISTORY_ACTIONS,

  YadroTicketLog,
  SubstituteServerPool,
  SlaConfig,
  UserAlias,
  BeryllClusterRack,
  YADRO_REQUEST_TYPES,
  YADRO_LOG_STATUSES,
  SUBSTITUTE_STATUSES,

  ProductionOutput,
  OperationType,
  OUTPUT_STATUSES, // <-- критично: запятая стоит, синтаксис валиден

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
