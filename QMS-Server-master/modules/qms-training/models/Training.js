const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Обучение и компетентность — ISO 13485 §6.2
// ═══════════════════════════════════════════════════════════════

const TrainingPlan = sequelize.define("training_plan", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  year: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM("DRAFT", "APPROVED", "IN_PROGRESS", "COMPLETED"), defaultValue: "DRAFT" },
  approvedBy: { type: DataTypes.INTEGER, allowNull: true },
  approvedAt: { type: DataTypes.DATE, allowNull: true },
});

const TrainingRecord = sequelize.define("training_record", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  
  userId: { type: DataTypes.INTEGER, allowNull: false, comment: "Кого обучали" },
  trainerId: { type: DataTypes.INTEGER, allowNull: true, comment: "Кто обучал" },
  trainingPlanId: { type: DataTypes.INTEGER, allowNull: true },
  
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  
  type: {
    type: DataTypes.ENUM(
      "ONBOARDING",      // Вводное обучение
      "PROCEDURE",       // По процедуре СМК
      "EQUIPMENT",       // Работа с оборудованием
      "GMP",             // Надлежащая производственная практика
      "SAFETY",          // Техника безопасности
      "REGULATORY",      // Нормативные требования
      "SOFTWARE",        // Работа с ПО
      "RETRAINING"       // Переобучение
    ),
    allowNull: false
  },
  
  // Связь с документом СМК
  relatedDocumentId: { type: DataTypes.INTEGER, allowNull: true, comment: "Документ, по которому обучали" },
  
  trainingDate: { type: DataTypes.DATE, allowNull: false },
  duration: { type: DataTypes.FLOAT, allowNull: true, comment: "Продолжительность в часах" },
  
  // Оценка
  assessmentMethod: { type: DataTypes.ENUM("TEST", "PRACTICAL", "OBSERVATION", "SELF_STUDY", "NONE"), defaultValue: "NONE" },
  assessmentScore: { type: DataTypes.FLOAT, allowNull: true, comment: "Балл 0-100" },
  passed: { type: DataTypes.BOOLEAN, allowNull: true },
  
  // Подтверждение
  confirmedBy: { type: DataTypes.INTEGER, allowNull: true, comment: "Руководитель, подтвердивший компетентность" },
  confirmedAt: { type: DataTypes.DATE, allowNull: true },
  
  certificateUrl: { type: DataTypes.STRING, allowNull: true },
  
  // Срок действия
  expiryDate: { type: DataTypes.DATE, allowNull: true, comment: "Когда нужно переобучение" },
  
  status: { type: DataTypes.ENUM("PLANNED", "COMPLETED", "FAILED", "EXPIRED"), defaultValue: "PLANNED" },
});

// Матрица компетенций: процесс × сотрудник → уровень
const CompetencyMatrix = sequelize.define("competency_matrix", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  
  userId: { type: DataTypes.INTEGER, allowNull: false },
  processName: { type: DataTypes.STRING, allowNull: false, comment: "Название процесса/операции" },
  
  level: {
    type: DataTypes.ENUM("NONE", "AWARENESS", "TRAINED", "COMPETENT", "EXPERT"),
    defaultValue: "NONE",
    comment: "Уровень компетенции"
  },
  
  requiredLevel: {
    type: DataTypes.ENUM("NONE", "AWARENESS", "TRAINED", "COMPETENT", "EXPERT"),
    defaultValue: "TRAINED",
    comment: "Требуемый уровень для должности"
  },
  
  lastTrainingDate: { type: DataTypes.DATE, allowNull: true },
  nextTrainingDate: { type: DataTypes.DATE, allowNull: true },
  
  notes: { type: DataTypes.TEXT, allowNull: true },
});

// Ассоциации
TrainingPlan.hasMany(TrainingRecord, { as: "records", foreignKey: "trainingPlanId" });
TrainingRecord.belongsTo(TrainingPlan, { foreignKey: "trainingPlanId" });

module.exports = { TrainingPlan, TrainingRecord, CompetencyMatrix };
