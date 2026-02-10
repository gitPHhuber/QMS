const sequelize = require("../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Анализ со стороны руководства — ISO 13485 §5.6
// ═══════════════════════════════════════════════════════════════

const ManagementReview = sequelize.define("management_review", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  
  reviewNumber: { type: DataTypes.STRING, unique: true, allowNull: false, comment: "MR-YYYY-NN" },
  title: { type: DataTypes.STRING, allowNull: false },
  
  reviewDate: { type: DataTypes.DATE, allowNull: false },
  periodFrom: { type: DataTypes.DATE, allowNull: false, comment: "Начало анализируемого периода" },
  periodTo: { type: DataTypes.DATE, allowNull: false, comment: "Конец анализируемого периода" },
  
  chairpersonId: { type: DataTypes.INTEGER, allowNull: true, comment: "Председатель (обычно генеральный директор)" },
  participants: { type: DataTypes.JSON, allowNull: true, comment: "Массив {userId, name, role}" },
  
  status: { type: DataTypes.ENUM("PLANNED", "IN_PROGRESS", "COMPLETED", "APPROVED"), defaultValue: "PLANNED" },
  
  // §5.6.2 Входные данные (автособираемые + ручные)
  inputData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: `{
      auditResults: { total, findings, closed },
      customerFeedback: { complaints, satisfaction },
      processPerformance: { ncStats, capaStats },
      productConformity: { defectRate, yieldRate },
      preventiveActions: { count, effective },
      previousActions: { completed, pending },
      regulatoryChanges: [],
      recommendations: []
    }`
  },
  
  // §5.6.3 Выходные данные
  outputData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: `{
      decisions: [{ description, responsible, deadline }],
      resourceNeeds: [],
      improvementActions: [],
      policyChanges: [],
      qualityObjectives: []
    }`
  },
  
  // Общее заключение
  conclusion: { type: DataTypes.TEXT, comment: "Общее заключение о результативности СМК" },
  qmsEffectiveness: { type: DataTypes.ENUM("EFFECTIVE", "PARTIALLY_EFFECTIVE", "INEFFECTIVE"), allowNull: true },
  
  // Протокол
  minutesUrl: { type: DataTypes.STRING, allowNull: true, comment: "Ссылка на протокол совещания" },
  
  approvedBy: { type: DataTypes.INTEGER, allowNull: true },
  approvedAt: { type: DataTypes.DATE, allowNull: true },
});

// Решения / действия из анализа руководства
const ReviewAction = sequelize.define("review_action", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  managementReviewId: { type: DataTypes.INTEGER, allowNull: false },
  
  description: { type: DataTypes.TEXT, allowNull: false },
  responsibleId: { type: DataTypes.INTEGER, allowNull: true },
  deadline: { type: DataTypes.DATE, allowNull: true },
  
  priority: { type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH"), defaultValue: "MEDIUM" },
  category: {
    type: DataTypes.ENUM("IMPROVEMENT", "RESOURCE", "TRAINING", "PROCESS_CHANGE", "POLICY", "INFRASTRUCTURE"),
    allowNull: true
  },
  
  status: { type: DataTypes.ENUM("OPEN", "IN_PROGRESS", "COMPLETED", "OVERDUE", "CANCELLED"), defaultValue: "OPEN" },
  completedAt: { type: DataTypes.DATE, allowNull: true },
  completionNotes: { type: DataTypes.TEXT, allowNull: true },
  
  // Связь с CAPA если создан
  capaId: { type: DataTypes.INTEGER, allowNull: true },
});

// Ассоциации
ManagementReview.hasMany(ReviewAction, { as: "actions", foreignKey: "managementReviewId" });
ReviewAction.belongsTo(ManagementReview, { foreignKey: "managementReviewId" });

module.exports = { ManagementReview, ReviewAction };
