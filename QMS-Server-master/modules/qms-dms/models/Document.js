/**
 * Document.js — Модели системы управления документами (DMS)
 * 
 * НОВЫЙ ФАЙЛ: models/definitions/Document.js
 * 
 * ISO 13485 §4.2.4: Управление документацией
 * 
 * Модели:
 *   Document             — Реестр документов (основная карточка)
 *   DocumentVersion      — Версии (каждое изменение = новая версия)
 *   DocumentApproval     — Шаги согласования
 *   DocumentDistribution — Рассылка и подтверждение ознакомления
 */

const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════════
// КОНСТАНТЫ
// ═══════════════════════════════════════════════════════════════════

const DOCUMENT_TYPES = {
  POLICY: "POLICY",
  MANUAL: "MANUAL",
  PROCEDURE: "PROCEDURE",
  WORK_INSTRUCTION: "WORK_INSTRUCTION",
  FORM: "FORM",
  RECORD: "RECORD",
  SPECIFICATION: "SPECIFICATION",
  PLAN: "PLAN",
  EXTERNAL: "EXTERNAL",
  OTHER: "OTHER",
};

const DOCUMENT_STATUSES = {
  DRAFT: "DRAFT",
  REVIEW: "REVIEW",
  APPROVED: "APPROVED",
  EFFECTIVE: "EFFECTIVE",
  REVISION: "REVISION",
  OBSOLETE: "OBSOLETE",
  CANCELLED: "CANCELLED",
};

const VERSION_STATUSES = {
  DRAFT: "DRAFT",
  REVIEW: "REVIEW",
  APPROVED: "APPROVED",
  EFFECTIVE: "EFFECTIVE",
  SUPERSEDED: "SUPERSEDED",
  REJECTED: "REJECTED",
};

const APPROVAL_ROLES = {
  REVIEWER: "REVIEWER",
  APPROVER: "APPROVER",
  QUALITY_OFFICER: "QUALITY_OFFICER",
};

const APPROVAL_DECISIONS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  RETURNED: "RETURNED",
};

// Маппинг типов документов на префиксы кодов
const TYPE_CODE_PREFIX = {
  POLICY: "ПК",         // Политика качества
  MANUAL: "РК",         // Руководство по качеству
  PROCEDURE: "СТО",     // Стандарт организации
  WORK_INSTRUCTION: "РИ", // Рабочая инструкция
  FORM: "Ф",            // Форма
  RECORD: "ЗП",         // Запись
  SPECIFICATION: "СП",  // Спецификация
  PLAN: "ПЛ",           // План
  EXTERNAL: "ВН",       // Внешний
  OTHER: "ДОК",         // Документ
};

// ═══════════════════════════════════════════════════════════════════
// МОДЕЛИ
// ═══════════════════════════════════════════════════════════════════

const Document = sequelize.define("document", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 500],
    },
  },
  type: {
    type: DataTypes.ENUM(...Object.values(DOCUMENT_TYPES)),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(DOCUMENT_STATUSES)),
    allowNull: false,
    defaultValue: DOCUMENT_STATUSES.DRAFT,
  },
  currentVersionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reviewCycleMonths: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 12,
  },
  nextReviewDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  effectiveDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  obsoleteDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  replacedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  isoSection: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
  },
});

const DocumentVersion = sequelize.define("document_version", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  documentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  version: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  versionNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(VERSION_STATUSES)),
    allowNull: false,
    defaultValue: VERSION_STATUSES.DRAFT,
  },
  changeDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fileUrl: {
    type: DataTypes.STRING(1000),
    allowNull: true,
  },
  fileName: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fileMimeType: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  fileHash: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  approvedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  effectiveAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  supersededAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

const DocumentApproval = sequelize.define("document_approval", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  versionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  step: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  role: {
    type: DataTypes.ENUM(...Object.values(APPROVAL_ROLES)),
    allowNull: false,
  },
  assignedToId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  decision: {
    type: DataTypes.ENUM(...Object.values(APPROVAL_DECISIONS)),
    allowNull: false,
    defaultValue: APPROVAL_DECISIONS.PENDING,
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  decidedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
});

const DocumentDistribution = sequelize.define("document_distribution", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  versionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  distributedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  acknowledged: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  acknowledgedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

// ═══════════════════════════════════════════════════════════════════
// ASSOCIATIONS (вызывается из models/index.js)
// ═══════════════════════════════════════════════════════════════════

function setupDocumentAssociations({ User }) {
  // Document → Owner
  Document.belongsTo(User, { foreignKey: "ownerId", as: "owner" });
  User.hasMany(Document, { foreignKey: "ownerId", as: "ownedDocuments" });

  // Document → ReplacedBy (self-reference)
  Document.belongsTo(Document, { foreignKey: "replacedById", as: "replacedBy" });
  Document.hasMany(Document, { foreignKey: "replacedById", as: "replacements" });

  // Document → Versions
  Document.hasMany(DocumentVersion, { foreignKey: "documentId", as: "versions", onDelete: "CASCADE" });
  DocumentVersion.belongsTo(Document, { foreignKey: "documentId", as: "document" });

  // Document → Current Version
  Document.belongsTo(DocumentVersion, { foreignKey: "currentVersionId", as: "currentVersion" });

  // Version → CreatedBy
  DocumentVersion.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });
  DocumentVersion.belongsTo(User, { foreignKey: "approvedById", as: "approvedBy" });

  // Version → Approvals
  DocumentVersion.hasMany(DocumentApproval, { foreignKey: "versionId", as: "approvals", onDelete: "CASCADE" });
  DocumentApproval.belongsTo(DocumentVersion, { foreignKey: "versionId", as: "version" });

  // Approval → AssignedTo
  DocumentApproval.belongsTo(User, { foreignKey: "assignedToId", as: "assignedTo" });

  // Version → Distributions
  DocumentVersion.hasMany(DocumentDistribution, { foreignKey: "versionId", as: "distributions", onDelete: "CASCADE" });
  DocumentDistribution.belongsTo(DocumentVersion, { foreignKey: "versionId", as: "version" });

  // Distribution → User
  DocumentDistribution.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(DocumentDistribution, { foreignKey: "userId", as: "documentDistributions" });
}

// ═══════════════════════════════════════════════════════════════════

module.exports = {
  Document,
  DocumentVersion,
  DocumentApproval,
  DocumentDistribution,
  setupDocumentAssociations,

  // Константы
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
  VERSION_STATUSES,
  APPROVAL_ROLES,
  APPROVAL_DECISIONS,
  TYPE_CODE_PREFIX,
};
