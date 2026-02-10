const sequelize = require("../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Реестр рисков — ISO 14971 / ISO 13485 §7.1
// Каждый риск привязан к процессу/продукту, оценивается по матрице 5×5
// ═══════════════════════════════════════════════════════════════

const RiskRegister = sequelize.define("risk_register", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  
  // Идентификация
  riskNumber: { 
    type: DataTypes.STRING, 
    unique: true, 
    allowNull: false,
    comment: "Автогенерируемый номер: RISK-YYYY-NNN"
  },
  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT },
  
  // Категория и привязка
  category: { 
    type: DataTypes.ENUM(
      "PRODUCT",        // Риск продукции
      "PROCESS",        // Риск процесса
      "SUPPLIER",       // Риск поставщика
      "REGULATORY",     // Регуляторный риск
      "INFRASTRUCTURE", // Инфраструктурный
      "HUMAN",          // Человеческий фактор
      "CYBER"           // Информационная безопасность
    ),
    allowNull: false 
  },
  
  // Привязка к сущности (полиморфная)
  relatedEntity: { type: DataTypes.STRING, allowNull: true, comment: "Тип: product, process, supplier, document" },
  relatedEntityId: { type: DataTypes.INTEGER, allowNull: true },
  
  // Оценка до мер
  initialProbability: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 }, comment: "1=Невероятно, 5=Частое" },
  initialSeverity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 }, comment: "1=Незначительное, 5=Катастрофическое" },
  initialRiskLevel: { type: DataTypes.INTEGER, allowNull: true, comment: "probability × severity (авторасчёт)" },
  initialRiskClass: { type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"), allowNull: true },
  
  // Оценка после мер (residual risk)
  residualProbability: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 5 } },
  residualSeverity: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 5 } },
  residualRiskLevel: { type: DataTypes.INTEGER, allowNull: true },
  residualRiskClass: { type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"), allowNull: true },
  
  // Статус и принятие
  status: {
    type: DataTypes.ENUM("IDENTIFIED", "ASSESSED", "MITIGATED", "ACCEPTED", "CLOSED", "MONITORING"),
    defaultValue: "IDENTIFIED"
  },
  acceptanceDecision: { type: DataTypes.TEXT, allowNull: true, comment: "Обоснование принятия остаточного риска" },
  acceptedBy: { type: DataTypes.INTEGER, allowNull: true },
  acceptedAt: { type: DataTypes.DATE, allowNull: true },
  
  // Ответственный
  ownerId: { type: DataTypes.INTEGER, allowNull: true, comment: "Владелец риска" },
  reviewDate: { type: DataTypes.DATE, allowNull: true, comment: "Дата следующего пересмотра" },
  
  // Связи
  isoClause: { type: DataTypes.STRING, allowNull: true, comment: "Пункт ISO 13485/14971" },
});

// ═══════════════════════════════════════════════════════════════
// Оценка риска — история пересмотров
// ═══════════════════════════════════════════════════════════════

const RiskAssessment = sequelize.define("risk_assessment", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  riskRegisterId: { type: DataTypes.INTEGER, allowNull: false },
  
  assessmentDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  assessorId: { type: DataTypes.INTEGER, allowNull: false, comment: "Кто проводил оценку" },
  
  probability: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  severity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  detectability: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 5 }, comment: "Обнаруживаемость (опционально, для FMEA)" },
  riskLevel: { type: DataTypes.INTEGER, allowNull: true },
  riskClass: { type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"), allowNull: true },
  
  rationale: { type: DataTypes.TEXT, comment: "Обоснование оценки" },
  assessmentType: { type: DataTypes.ENUM("INITIAL", "PERIODIC", "POST_MITIGATION", "POST_INCIDENT"), defaultValue: "INITIAL" },
});

// ═══════════════════════════════════════════════════════════════
// Меры по снижению риска
// ═══════════════════════════════════════════════════════════════

const RiskMitigation = sequelize.define("risk_mitigation", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  riskRegisterId: { type: DataTypes.INTEGER, allowNull: false },
  
  mitigationType: {
    type: DataTypes.ENUM(
      "DESIGN",          // Конструктивное решение
      "PROTECTIVE",      // Защитные меры
      "INFORMATION",     // Информирование
      "PROCESS_CONTROL", // Контроль процесса
      "TRAINING",        // Обучение
      "MONITORING"       // Мониторинг
    ),
    allowNull: false
  },
  
  description: { type: DataTypes.TEXT, allowNull: false },
  responsibleId: { type: DataTypes.INTEGER, allowNull: true },
  
  plannedDate: { type: DataTypes.DATE, allowNull: true },
  completedDate: { type: DataTypes.DATE, allowNull: true },
  
  status: {
    type: DataTypes.ENUM("PLANNED", "IN_PROGRESS", "COMPLETED", "VERIFIED", "INEFFECTIVE"),
    defaultValue: "PLANNED"
  },
  
  verifiedBy: { type: DataTypes.INTEGER, allowNull: true },
  verifiedAt: { type: DataTypes.DATE, allowNull: true },
  verificationNotes: { type: DataTypes.TEXT, allowNull: true },
  
  // Связь с CAPA (если мера порождена из CAPA)
  capaId: { type: DataTypes.INTEGER, allowNull: true },
});

// ═══════════════════════════════════════════════════════════════
// Ассоциации
// ═══════════════════════════════════════════════════════════════

RiskRegister.hasMany(RiskAssessment, { as: "assessments", foreignKey: "riskRegisterId" });
RiskAssessment.belongsTo(RiskRegister, { foreignKey: "riskRegisterId" });

RiskRegister.hasMany(RiskMitigation, { as: "mitigations", foreignKey: "riskRegisterId" });
RiskMitigation.belongsTo(RiskRegister, { foreignKey: "riskRegisterId" });

module.exports = {
  RiskRegister,
  RiskAssessment,
  RiskMitigation,
};
