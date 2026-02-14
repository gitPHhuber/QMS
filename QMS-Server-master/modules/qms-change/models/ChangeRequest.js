const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Управление изменениями — ISO 13485 §7.3.9
// ═══════════════════════════════════════════════════════════════

const ChangeRequest = sequelize.define("change_request", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  changeNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: "ECR-YYYY-NNN",
  },
  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  justification: { type: DataTypes.TEXT, allowNull: false, comment: "Обоснование изменения" },
  // Классификация
  type: {
    type: DataTypes.ENUM("DESIGN", "PROCESS", "DOCUMENT", "SUPPLIER", "SOFTWARE", "MATERIAL", "OTHER"),
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM("CRITICAL", "HIGH", "MEDIUM", "LOW"),
    defaultValue: "MEDIUM",
  },
  category: {
    type: DataTypes.ENUM("MAJOR", "MINOR"),
    allowNull: false,
    comment: "Major = влияет на безопасность/эффективность, Minor = нет",
  },
  // Оценка влияния
  impactAssessment: { type: DataTypes.TEXT, comment: "Оценка влияния на качество/безопасность" },
  riskAssessment: { type: DataTypes.TEXT, comment: "Оценка рисков изменения" },
  affectedProducts: { type: DataTypes.TEXT, comment: "Какие изделия затронуты" },
  affectedDocuments: { type: DataTypes.TEXT, comment: "Какие документы нужно обновить" },
  affectedProcesses: { type: DataTypes.TEXT, comment: "Какие процессы затронуты" },
  regulatoryImpact: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Требует ли уведомления регулятора",
  },
  // Workflow
  status: {
    type: DataTypes.ENUM(
      "DRAFT", "SUBMITTED", "IMPACT_REVIEW", "APPROVED",
      "IN_PROGRESS", "VERIFICATION", "COMPLETED", "REJECTED", "CANCELLED"
    ),
    defaultValue: "DRAFT",
  },
  initiatorId: { type: DataTypes.INTEGER, allowNull: false },
  reviewerId: { type: DataTypes.INTEGER, allowNull: true, comment: "Кто проводит оценку влияния" },
  approverId: { type: DataTypes.INTEGER, allowNull: true },
  approvedAt: { type: DataTypes.DATE },
  // Верификация
  verificationMethod: { type: DataTypes.TEXT, comment: "Как будет верифицировано внедрение" },
  verificationResult: { type: DataTypes.TEXT },
  verifiedById: { type: DataTypes.INTEGER },
  verifiedAt: { type: DataTypes.DATE },
  // Сроки
  plannedDate: { type: DataTypes.DATEONLY },
  completedDate: { type: DataTypes.DATEONLY },
  // Связи
  linkedNcId: { type: DataTypes.INTEGER },
  linkedCapaId: { type: DataTypes.INTEGER },

  // Structured Impact Fields (Phase 4)
  regulatoryDossierImpact: {
    type: DataTypes.ENUM("NONE", "NOTIFICATION_ONLY", "VARIATION", "NEW_SUBMISSION"),
    defaultValue: "NONE",
    comment: "Impact on regulatory dossier",
  },
  regulatoryDossierNotes: { type: DataTypes.TEXT, comment: "Details on regulatory dossier impact" },
  overallImpactLevel: {
    type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
    allowNull: true,
    comment: "Overall computed impact level",
  },
  affectedProductIds: { type: DataTypes.JSONB, defaultValue: [], comment: "Array of affected product IDs" },
  affectedDocumentIds: { type: DataTypes.JSONB, defaultValue: [], comment: "Array of affected document IDs" },
});

module.exports = { ChangeRequest };
