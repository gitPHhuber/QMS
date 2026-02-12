/**
 * NcCapa.js — Модели Несоответствий (NC) и CAPA
 * 
 * НОВЫЙ ФАЙЛ: models/definitions/NcCapa.js
 */

const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══ Константы ═══

const NC_SOURCES = {
  INCOMING_INSPECTION: "INCOMING_INSPECTION",
  IN_PROCESS: "IN_PROCESS",
  FINAL_INSPECTION: "FINAL_INSPECTION",
  CUSTOMER_COMPLAINT: "CUSTOMER_COMPLAINT",
  INTERNAL_AUDIT: "INTERNAL_AUDIT",
  EXTERNAL_AUDIT: "EXTERNAL_AUDIT",
  SUPPLIER: "SUPPLIER",
  FIELD_RETURN: "FIELD_RETURN",
  OTHER: "OTHER",
};

const NC_CLASSIFICATIONS = { CRITICAL: "CRITICAL", MAJOR: "MAJOR", MINOR: "MINOR" };

const NC_STATUSES = {
  OPEN: "OPEN", INVESTIGATING: "INVESTIGATING", DISPOSITION: "DISPOSITION",
  IMPLEMENTING: "IMPLEMENTING", VERIFICATION: "VERIFICATION", CLOSED: "CLOSED", REOPENED: "REOPENED",
};

const NC_DISPOSITIONS = {
  USE_AS_IS: "USE_AS_IS", REWORK: "REWORK", REPAIR: "REPAIR", SCRAP: "SCRAP",
  RETURN_TO_SUPPLIER: "RETURN_TO_SUPPLIER", CONCESSION: "CONCESSION", OTHER: "OTHER",
};

const CAPA_TYPES = { CORRECTIVE: "CORRECTIVE", PREVENTIVE: "PREVENTIVE" };
const CAPA_STATUSES = {
  INITIATED: "INITIATED", INVESTIGATING: "INVESTIGATING", PLANNING: "PLANNING",
  PLAN_APPROVED: "PLAN_APPROVED", IMPLEMENTING: "IMPLEMENTING", VERIFYING: "VERIFYING",
  EFFECTIVE: "EFFECTIVE", INEFFECTIVE: "INEFFECTIVE", CLOSED: "CLOSED",
};
const CAPA_PRIORITIES = { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", URGENT: "URGENT" };
const CAPA_ACTION_STATUSES = { PLANNED: "PLANNED", IN_PROGRESS: "IN_PROGRESS", COMPLETED: "COMPLETED", CANCELLED: "CANCELLED" };

// ═══ Модели ═══

const Nonconformity = sequelize.define("nonconformity", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  number: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  source: { type: DataTypes.ENUM(...Object.values(NC_SOURCES)), allowNull: false },
  classification: { type: DataTypes.ENUM(...Object.values(NC_CLASSIFICATIONS)), allowNull: false, defaultValue: "MINOR" },
  status: { type: DataTypes.ENUM(...Object.values(NC_STATUSES)), allowNull: false, defaultValue: "OPEN" },
  disposition: { type: DataTypes.ENUM(...Object.values(NC_DISPOSITIONS)), allowNull: true },
  dispositionJustification: { type: DataTypes.TEXT, allowNull: true },
  productType: { type: DataTypes.STRING(100), allowNull: true },
  productSerialNumber: { type: DataTypes.STRING(100), allowNull: true },
  lotNumber: { type: DataTypes.STRING(100), allowNull: true },
  processName: { type: DataTypes.STRING(200), allowNull: true },
  supplierName: { type: DataTypes.STRING(200), allowNull: true },
  warehouseBoxId: { type: DataTypes.INTEGER, allowNull: true },
  documentId: { type: DataTypes.INTEGER, allowNull: true },
  totalQty: { type: DataTypes.INTEGER, allowNull: true },
  defectQty: { type: DataTypes.INTEGER, allowNull: true },
  rootCause: { type: DataTypes.TEXT, allowNull: true },
  rootCauseMethod: { type: DataTypes.STRING(50), allowNull: true },
  immediateAction: { type: DataTypes.TEXT, allowNull: true },
  reportedById: { type: DataTypes.INTEGER, allowNull: false },
  assignedToId: { type: DataTypes.INTEGER, allowNull: true },
  closedById: { type: DataTypes.INTEGER, allowNull: true },
  detectedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true },
  closedAt: { type: DataTypes.DATE, allowNull: true },
  capaRequired: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  // Связь с реестром рисков (NC↔Risk интеграция, ISO 14971)
  riskRegisterId: { type: DataTypes.INTEGER, allowNull: true },
});

const NcAttachment = sequelize.define("nc_attachment", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nonconformityId: { type: DataTypes.INTEGER, allowNull: false },
  fileUrl: { type: DataTypes.STRING(1000), allowNull: false },
  fileName: { type: DataTypes.STRING(500), allowNull: false },
  fileSize: { type: DataTypes.INTEGER, allowNull: true },
  fileMimeType: { type: DataTypes.STRING(100), allowNull: true },
  description: { type: DataTypes.STRING(500), allowNull: true },
  uploadedById: { type: DataTypes.INTEGER, allowNull: false },
});

const Capa = sequelize.define("capa", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  number: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  type: { type: DataTypes.ENUM(...Object.values(CAPA_TYPES)), allowNull: false },
  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM(...Object.values(CAPA_STATUSES)), allowNull: false, defaultValue: "INITIATED" },
  priority: { type: DataTypes.ENUM(...Object.values(CAPA_PRIORITIES)), allowNull: false, defaultValue: "MEDIUM" },
  nonconformityId: { type: DataTypes.INTEGER, allowNull: true },
  rootCauseAnalysis: { type: DataTypes.TEXT, allowNull: true },
  rootCauseMethod: { type: DataTypes.STRING(50), allowNull: true },
  initiatedById: { type: DataTypes.INTEGER, allowNull: false },
  assignedToId: { type: DataTypes.INTEGER, allowNull: true },
  approvedById: { type: DataTypes.INTEGER, allowNull: true },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true },
  planApprovedAt: { type: DataTypes.DATE, allowNull: true },
  implementedAt: { type: DataTypes.DATE, allowNull: true },
  closedAt: { type: DataTypes.DATE, allowNull: true },
  effectivenessCheckDate: { type: DataTypes.DATEONLY, allowNull: true },
  effectivenessCheckDays: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 90 },
});

const CapaAction = sequelize.define("capa_action", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  capaId: { type: DataTypes.INTEGER, allowNull: false },
  order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  description: { type: DataTypes.TEXT, allowNull: false },
  assignedToId: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM(...Object.values(CAPA_ACTION_STATUSES)), allowNull: false, defaultValue: "PLANNED" },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: true },
  result: { type: DataTypes.TEXT, allowNull: true },
});

const CapaVerification = sequelize.define("capa_verification", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  capaId: { type: DataTypes.INTEGER, allowNull: false },
  verifiedById: { type: DataTypes.INTEGER, allowNull: false },
  isEffective: { type: DataTypes.BOOLEAN, allowNull: false },
  evidence: { type: DataTypes.TEXT, allowNull: true },
  comment: { type: DataTypes.TEXT, allowNull: true },
  verifiedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
});

// ═══ Associations ═══

function setupNcCapaAssociations({ User, Document, RiskRegister }) {
  // NC → Users
  Nonconformity.belongsTo(User, { foreignKey: "reportedById", as: "reportedBy" });
  Nonconformity.belongsTo(User, { foreignKey: "assignedToId", as: "assignedTo" });
  Nonconformity.belongsTo(User, { foreignKey: "closedById", as: "closedBy" });

  // NC ↔ Risk (двусторонняя связь ISO 14971 ↔ ISO 8.3)
  if (RiskRegister) {
    Nonconformity.belongsTo(RiskRegister, { foreignKey: "riskRegisterId", as: "risk" });
    RiskRegister.hasMany(Nonconformity, { foreignKey: "riskRegisterId", as: "nonconformities" });
  }

  // NC → Attachments
  Nonconformity.hasMany(NcAttachment, { foreignKey: "nonconformityId", as: "attachments", onDelete: "CASCADE" });
  NcAttachment.belongsTo(Nonconformity, { foreignKey: "nonconformityId", as: "nonconformity" });
  NcAttachment.belongsTo(User, { foreignKey: "uploadedById", as: "uploadedBy" });

  // NC → CAPA
  Nonconformity.hasMany(Capa, { foreignKey: "nonconformityId", as: "capas" });
  Capa.belongsTo(Nonconformity, { foreignKey: "nonconformityId", as: "nonconformity" });

  // NC → Document (optional)
  if (Document) {
    Nonconformity.belongsTo(Document, { foreignKey: "documentId", as: "document" });
  }

  // CAPA → Users
  Capa.belongsTo(User, { foreignKey: "initiatedById", as: "initiatedBy" });
  Capa.belongsTo(User, { foreignKey: "assignedToId", as: "assignedTo" });
  Capa.belongsTo(User, { foreignKey: "approvedById", as: "approvedBy" });

  // CAPA → Actions
  Capa.hasMany(CapaAction, { foreignKey: "capaId", as: "actions", onDelete: "CASCADE" });
  CapaAction.belongsTo(Capa, { foreignKey: "capaId", as: "capa" });
  CapaAction.belongsTo(User, { foreignKey: "assignedToId", as: "assignedTo" });

  // CAPA → Verifications
  Capa.hasMany(CapaVerification, { foreignKey: "capaId", as: "verifications", onDelete: "CASCADE" });
  CapaVerification.belongsTo(Capa, { foreignKey: "capaId", as: "capa" });
  CapaVerification.belongsTo(User, { foreignKey: "verifiedById", as: "verifiedBy" });
}

module.exports = {
  Nonconformity, NcAttachment, Capa, CapaAction, CapaVerification,
  setupNcCapaAssociations,
  NC_SOURCES, NC_CLASSIFICATIONS, NC_STATUSES, NC_DISPOSITIONS,
  CAPA_TYPES, CAPA_STATUSES, CAPA_PRIORITIES, CAPA_ACTION_STATUSES,
};
