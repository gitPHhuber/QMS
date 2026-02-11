const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Реестр поставщиков — ISO 13485 §7.4
// ═══════════════════════════════════════════════════════════════

const Supplier = sequelize.define("supplier", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  
  // Идентификация
  code: { type: DataTypes.STRING, unique: true, allowNull: false, comment: "Код поставщика: SUP-NNN" },
  name: { type: DataTypes.STRING(500), allowNull: false },
  legalName: { type: DataTypes.STRING(500), allowNull: true, comment: "Полное юридическое название" },
  inn: { type: DataTypes.STRING(12), allowNull: true, comment: "ИНН" },
  
  // Контакты
  address: { type: DataTypes.TEXT },
  contactPerson: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  website: { type: DataTypes.STRING },
  
  // Классификация
  category: {
    type: DataTypes.ENUM(
      "RAW_MATERIAL",    // Сырьё и материалы
      "COMPONENT",       // Комплектующие
      "SERVICE",         // Услуги (калибровка, стерилизация)
      "EQUIPMENT",       // Оборудование
      "PACKAGING",       // Упаковка
      "SOFTWARE",        // ПО
      "SUBCONTRACTOR"    // Субподрядчик
    ),
    allowNull: false
  },
  
  criticality: {
    type: DataTypes.ENUM("CRITICAL", "MAJOR", "MINOR"),
    defaultValue: "MAJOR",
    comment: "Критичность: влияет на частоту переоценки"
  },
  
  // Статус квалификации
  qualificationStatus: {
    type: DataTypes.ENUM("PENDING", "QUALIFIED", "CONDITIONAL", "DISQUALIFIED", "SUSPENDED"),
    defaultValue: "PENDING"
  },
  qualifiedAt: { type: DataTypes.DATE, allowNull: true },
  qualifiedBy: { type: DataTypes.INTEGER, allowNull: true },
  
  nextEvaluationDate: { type: DataTypes.DATE, allowNull: true, comment: "Дата следующей периодической оценки" },
  
  // Сертификаты
  hasCertISO9001: { type: DataTypes.BOOLEAN, defaultValue: false },
  hasCertISO13485: { type: DataTypes.BOOLEAN, defaultValue: false },
  certExpiryDate: { type: DataTypes.DATE, allowNull: true },
  
  // Скоринг
  overallScore: { type: DataTypes.FLOAT, allowNull: true, comment: "Общий балл 0-100" },
  
  notes: { type: DataTypes.TEXT },
});

// ═══════════════════════════════════════════════════════════════
// Оценка поставщика — периодическая
// ═══════════════════════════════════════════════════════════════

const SupplierEvaluation = sequelize.define("supplier_evaluation", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  supplierId: { type: DataTypes.INTEGER, allowNull: false },
  
  evaluationDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  evaluatorId: { type: DataTypes.INTEGER, allowNull: false },
  evaluationType: {
    type: DataTypes.ENUM("INITIAL", "PERIODIC", "POST_INCIDENT", "REQUALIFICATION"),
    defaultValue: "PERIODIC"
  },
  
  // Критерии оценки (баллы 1-10)
  qualityScore: { type: DataTypes.INTEGER, validate: { min: 1, max: 10 }, comment: "Качество продукции/услуг" },
  deliveryScore: { type: DataTypes.INTEGER, validate: { min: 1, max: 10 }, comment: "Соблюдение сроков" },
  documentationScore: { type: DataTypes.INTEGER, validate: { min: 1, max: 10 }, comment: "Полнота документации" },
  communicationScore: { type: DataTypes.INTEGER, validate: { min: 1, max: 10 }, comment: "Коммуникация и отзывчивость" },
  priceScore: { type: DataTypes.INTEGER, validate: { min: 1, max: 10 }, comment: "Соотношение цена/качество" },
  complianceScore: { type: DataTypes.INTEGER, validate: { min: 1, max: 10 }, comment: "Соответствие нормативам" },
  
  totalScore: { type: DataTypes.FLOAT, allowNull: true, comment: "Средневзвешенный балл" },
  
  // Решение
  decision: {
    type: DataTypes.ENUM("APPROVED", "CONDITIONALLY_APPROVED", "REJECTED", "SUSPENDED"),
    allowNull: true
  },
  conditions: { type: DataTypes.TEXT, allowNull: true, comment: "Условия при условном одобрении" },
  comments: { type: DataTypes.TEXT },
  
  // Количественные метрики за период
  totalOrders: { type: DataTypes.INTEGER, defaultValue: 0 },
  defectiveOrders: { type: DataTypes.INTEGER, defaultValue: 0 },
  lateDeliveries: { type: DataTypes.INTEGER, defaultValue: 0 },
  ncCount: { type: DataTypes.INTEGER, defaultValue: 0, comment: "Число NC за период" },
});

// ═══════════════════════════════════════════════════════════════
// Аудит поставщика (on-site)
// ═══════════════════════════════════════════════════════════════

const SupplierAudit = sequelize.define("supplier_audit", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  supplierId: { type: DataTypes.INTEGER, allowNull: false },
  
  auditDate: { type: DataTypes.DATE, allowNull: false },
  auditorId: { type: DataTypes.INTEGER, allowNull: false },
  auditType: { type: DataTypes.ENUM("ON_SITE", "REMOTE", "DOCUMENT"), defaultValue: "ON_SITE" },
  
  scope: { type: DataTypes.TEXT, comment: "Область аудита" },
  findings: { type: DataTypes.TEXT, comment: "Замечания" },
  
  findingsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  majorFindings: { type: DataTypes.INTEGER, defaultValue: 0 },
  minorFindings: { type: DataTypes.INTEGER, defaultValue: 0 },
  
  result: { type: DataTypes.ENUM("PASS", "CONDITIONAL", "FAIL"), allowNull: true },
  nextAuditDate: { type: DataTypes.DATE, allowNull: true },
  
  reportUrl: { type: DataTypes.STRING, allowNull: true },
});

// ═══════════════════════════════════════════════════════════════
// Ассоциации
// ═══════════════════════════════════════════════════════════════

Supplier.hasMany(SupplierEvaluation, { as: "evaluations", foreignKey: "supplierId" });
SupplierEvaluation.belongsTo(Supplier, { foreignKey: "supplierId" });

Supplier.hasMany(SupplierAudit, { as: "audits", foreignKey: "supplierId" });
SupplierAudit.belongsTo(Supplier, { foreignKey: "supplierId" });

module.exports = {
  Supplier,
  SupplierEvaluation,
  SupplierAudit,
};
