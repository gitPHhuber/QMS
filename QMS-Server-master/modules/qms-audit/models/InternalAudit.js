const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Внутренние аудиты — ISO 13485 §8.2.4
// ═══════════════════════════════════════════════════════════════

const AuditPlan = sequelize.define("audit_plan", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  year: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false, comment: "Например: Годовой план внутренних аудитов 2026" },
  approvedBy: { type: DataTypes.INTEGER, allowNull: true },
  approvedAt: { type: DataTypes.DATE, allowNull: true },
  status: { type: DataTypes.ENUM("DRAFT", "APPROVED", "IN_PROGRESS", "COMPLETED"), defaultValue: "DRAFT" },
});

const AuditSchedule = sequelize.define("audit_schedule", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  auditPlanId: { type: DataTypes.INTEGER, allowNull: false },
  
  auditNumber: { type: DataTypes.STRING, unique: true, allowNull: false, comment: "IA-YYYY-NNN" },
  title: { type: DataTypes.STRING, allowNull: false },
  scope: { type: DataTypes.TEXT, comment: "Область аудита: процесс, подразделение, пункты ISO" },
  isoClause: { type: DataTypes.STRING, comment: "Проверяемые пункты ISO 13485" },
  
  plannedDate: { type: DataTypes.DATE, allowNull: false },
  actualDate: { type: DataTypes.DATE, allowNull: true },
  
  leadAuditorId: { type: DataTypes.INTEGER, allowNull: true },
  auditeeId: { type: DataTypes.INTEGER, allowNull: true, comment: "Ответственный за проверяемый процесс" },
  
  status: {
    type: DataTypes.ENUM("PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "OVERDUE"),
    defaultValue: "PLANNED"
  },
  
  criteria: { type: DataTypes.TEXT, comment: "Критерии аудита" },
  conclusion: { type: DataTypes.TEXT, comment: "Общее заключение" },
  reportUrl: { type: DataTypes.STRING, allowNull: true },
});

const AuditFinding = sequelize.define("audit_finding", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  auditScheduleId: { type: DataTypes.INTEGER, allowNull: false },
  
  findingNumber: { type: DataTypes.STRING, allowNull: false, comment: "AF-YYYY-NNN" },
  
  type: {
    type: DataTypes.ENUM("MAJOR_NC", "MINOR_NC", "OBSERVATION", "OPPORTUNITY", "POSITIVE"),
    allowNull: false,
    comment: "MAJOR_NC=критическое, MINOR_NC=незначительное, OBSERVATION=наблюдение"
  },
  
  isoClause: { type: DataTypes.STRING, comment: "Нарушенный пункт ISO" },
  description: { type: DataTypes.TEXT, allowNull: false },
  evidence: { type: DataTypes.TEXT, comment: "Объективные свидетельства" },
  
  // Связь с NC/CAPA
  nonconformityId: { type: DataTypes.INTEGER, allowNull: true, comment: "Связь с NC если создан" },
  capaId: { type: DataTypes.INTEGER, allowNull: true, comment: "Связь с CAPA если создан" },
  
  responsibleId: { type: DataTypes.INTEGER, allowNull: true },
  dueDate: { type: DataTypes.DATE, allowNull: true },
  
  status: {
    type: DataTypes.ENUM("OPEN", "ACTION_REQUIRED", "CORRECTED", "VERIFIED", "CLOSED"),
    defaultValue: "OPEN"
  },
  
  closedBy: { type: DataTypes.INTEGER, allowNull: true },
  closedAt: { type: DataTypes.DATE, allowNull: true },
  closureNotes: { type: DataTypes.TEXT, allowNull: true },

  // Follow-up fields (Module 16)
  correctiveAction: { type: DataTypes.TEXT, comment: "Описание корректирующего действия" },
  verificationNotes: { type: DataTypes.TEXT, comment: "Заметки по верификации" },
  followUpStatus: {
    type: DataTypes.ENUM("OPEN", "IN_PROGRESS", "CLOSED", "OVERDUE", "ESCALATED"),
    defaultValue: "OPEN",
    comment: "Статус follow-up",
  },
});

// ═══════════════════════════════════════════════════════════════
// Чек-листы внутренних аудитов — ISO 13485 §8.2.4
// ═══════════════════════════════════════════════════════════════

const CHECKLIST_ITEM_STATUSES = {
  CONFORMING: "CONFORMING",
  MINOR_NC: "MINOR_NC",
  MAJOR_NC: "MAJOR_NC",
  NOT_APPLICABLE: "NOT_APPLICABLE",
  NOT_CHECKED: "NOT_CHECKED",
};

/**
 * Шаблон чек-листа для раздела ISO 13485.
 * Один шаблон = один раздел (например, 4.2.4 Управление документацией).
 */
const AuditChecklist = sequelize.define("audit_checklist", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  isoClause: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: "Раздел ISO 13485, например 4.2.4",
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: "Название раздела: Управление документацией",
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Краткое описание требований раздела",
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: "Версия шаблона чек-листа",
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: "Активен ли шаблон для использования",
  },
});

/**
 * Пункт чек-листа — конкретное требование для проверки.
 */
const AuditChecklistItem = sequelize.define("audit_checklist_item", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  checklistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "FK → audit_checklist",
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: "Порядок пункта в чек-листе",
  },
  requirement: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: "Формулировка требования для проверки",
  },
  guidance: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Рекомендации аудитору: что проверять, какие доказательства искать",
  },
  isoReference: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: "Точная ссылка на пункт ISO, например 4.2.4 (a)",
  },
});

/**
 * Ответ аудитора на пункт чек-листа в рамках конкретного аудита.
 */
const AuditChecklistResponse = sequelize.define("audit_checklist_response", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  auditScheduleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "FK → audit_schedule (конкретный аудит)",
  },
  checklistItemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "FK → audit_checklist_item (пункт чек-листа)",
  },
  status: {
    type: DataTypes.ENUM(...Object.values(CHECKLIST_ITEM_STATUSES)),
    allowNull: false,
    defaultValue: CHECKLIST_ITEM_STATUSES.NOT_CHECKED,
    comment: "Результат проверки пункта",
  },
  evidence: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Объективные свидетельства соответствия/несоответствия",
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Комментарии аудитора",
  },
  auditorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "FK → User (аудитор, заполнивший пункт)",
  },
  findingId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "FK → audit_finding (если по пункту создан finding)",
  },
});

// ═══════════════════════════════════════════════════════════════
// Ассоциации
// ═══════════════════════════════════════════════════════════════

AuditPlan.hasMany(AuditSchedule, { as: "audits", foreignKey: "auditPlanId" });
AuditSchedule.belongsTo(AuditPlan, { as: "auditPlan", foreignKey: "auditPlanId" });

AuditSchedule.hasMany(AuditFinding, { as: "findings", foreignKey: "auditScheduleId" });
AuditFinding.belongsTo(AuditSchedule, { foreignKey: "auditScheduleId" });

// Checklist associations
AuditChecklist.hasMany(AuditChecklistItem, { as: "items", foreignKey: "checklistId", onDelete: "CASCADE" });
AuditChecklistItem.belongsTo(AuditChecklist, { as: "checklist", foreignKey: "checklistId" });

AuditSchedule.hasMany(AuditChecklistResponse, { as: "checklistResponses", foreignKey: "auditScheduleId", onDelete: "CASCADE" });
AuditChecklistResponse.belongsTo(AuditSchedule, { foreignKey: "auditScheduleId" });

AuditChecklistItem.hasMany(AuditChecklistResponse, { as: "responses", foreignKey: "checklistItemId" });
AuditChecklistResponse.belongsTo(AuditChecklistItem, { as: "checklistItem", foreignKey: "checklistItemId" });

AuditChecklistResponse.belongsTo(AuditFinding, { as: "finding", foreignKey: "findingId" });

module.exports = {
  AuditPlan,
  AuditSchedule,
  AuditFinding,
  AuditChecklist,
  AuditChecklistItem,
  AuditChecklistResponse,
  CHECKLIST_ITEM_STATUSES,
};
