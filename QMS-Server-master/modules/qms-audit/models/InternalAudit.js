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
});

// Ассоциации
AuditPlan.hasMany(AuditSchedule, { as: "audits", foreignKey: "auditPlanId" });
AuditSchedule.belongsTo(AuditPlan, { foreignKey: "auditPlanId" });

AuditSchedule.hasMany(AuditFinding, { as: "findings", foreignKey: "auditScheduleId" });
AuditFinding.belongsTo(AuditSchedule, { foreignKey: "auditScheduleId" });

module.exports = { AuditPlan, AuditSchedule, AuditFinding };
