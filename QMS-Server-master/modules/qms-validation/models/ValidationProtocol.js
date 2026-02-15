const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// IQ/OQ/PQ Protocol Templates — ISO 13485 §7.5.6
// ═══════════════════════════════════════════════════════════════

const ValidationProtocolTemplate = sequelize.define("validation_protocol_template", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  templateNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: "VPT-NNN",
  },
  title: { type: DataTypes.STRING(500) },
  description: { type: DataTypes.TEXT },
  phase: {
    type: DataTypes.ENUM("IQ", "OQ", "PQ"),
    allowNull: false,
  },
  version: { type: DataTypes.STRING(10), defaultValue: "1.0" },
  status: {
    type: DataTypes.ENUM("DRAFT", "APPROVED", "OBSOLETE"),
    defaultValue: "DRAFT",
  },
  checklistTemplate: { type: DataTypes.JSONB, defaultValue: [] },
  createdById: { type: DataTypes.INTEGER },
  approvedById: { type: DataTypes.INTEGER },
  approvedAt: { type: DataTypes.DATE },
});

// ═══════════════════════════════════════════════════════════════
// Validation Checklist — привязан к конкретной валидации процесса
// ═══════════════════════════════════════════════════════════════

const ValidationChecklist = sequelize.define("validation_checklist", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  processValidationId: { type: DataTypes.INTEGER, allowNull: false },
  templateId: { type: DataTypes.INTEGER },
  phase: {
    type: DataTypes.ENUM("IQ", "OQ", "PQ"),
    allowNull: false,
  },
  title: { type: DataTypes.STRING(500) },
  status: {
    type: DataTypes.ENUM("NOT_STARTED", "IN_PROGRESS", "PASSED", "FAILED"),
    defaultValue: "NOT_STARTED",
  },
  executedById: { type: DataTypes.INTEGER },
  executedAt: { type: DataTypes.DATE },
  reviewedById: { type: DataTypes.INTEGER },
  reviewedAt: { type: DataTypes.DATE },
  notes: { type: DataTypes.TEXT },
});

// ═══════════════════════════════════════════════════════════════
// Validation Checklist Item — отдельный пункт проверки
// ═══════════════════════════════════════════════════════════════

const ValidationChecklistItem = sequelize.define("validation_checklist_item", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  checklistId: { type: DataTypes.INTEGER, allowNull: false },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT },
  acceptanceCriteria: { type: DataTypes.TEXT, allowNull: false },
  isMandatory: { type: DataTypes.BOOLEAN, defaultValue: true },
  result: {
    type: DataTypes.ENUM("PENDING", "PASS", "FAIL", "N_A"),
    defaultValue: "PENDING",
  },
  actualValue: { type: DataTypes.TEXT },
  deviation: { type: DataTypes.TEXT },
  evidenceDocumentId: { type: DataTypes.INTEGER },
  executedById: { type: DataTypes.INTEGER },
  executedAt: { type: DataTypes.DATE },
});

// ═══════════════════════════════════════════════════════════════
// Ассоциации между моделями протоколов
// ═══════════════════════════════════════════════════════════════

ValidationProtocolTemplate.hasMany(ValidationChecklist, { as: "checklists", foreignKey: "templateId" });
ValidationChecklist.belongsTo(ValidationProtocolTemplate, { as: "template", foreignKey: "templateId" });

ValidationChecklist.hasMany(ValidationChecklistItem, { as: "items", foreignKey: "checklistId" });
ValidationChecklistItem.belongsTo(ValidationChecklist, { as: "checklist", foreignKey: "checklistId" });

module.exports = { ValidationProtocolTemplate, ValidationChecklist, ValidationChecklistItem };
