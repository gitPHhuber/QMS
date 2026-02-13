/**
 * QualityObjective.js — Цели в области качества (ISO 13485 §6.2)
 *
 * Отдельная сущность для отслеживания измеримых целей качества,
 * ранее хранившихся только как JSON в ManagementReview.outputData.
 */

const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Константы
// ═══════════════════════════════════════════════════════════════

const QO_STATUSES = {
  ACTIVE: "ACTIVE",
  ACHIEVED: "ACHIEVED",
  NOT_ACHIEVED: "NOT_ACHIEVED",
  CANCELLED: "CANCELLED",
};

const QO_CATEGORIES = {
  PROCESS: "PROCESS",
  PRODUCT: "PRODUCT",
  CUSTOMER: "CUSTOMER",
  IMPROVEMENT: "IMPROVEMENT",
  COMPLIANCE: "COMPLIANCE",
};

// ═══════════════════════════════════════════════════════════════
// Модель
// ═══════════════════════════════════════════════════════════════

const QualityObjective = sequelize.define("quality_objective", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: "QO-YYYY-NNN",
  },

  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },

  // Измеримость (ISO 6.2.1)
  metric: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: "Название метрики, напр. 'Уровень брака'",
  },
  targetValue: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: "Целевое значение",
  },
  currentValue: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: "Текущее значение",
  },
  unit: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: "Единица: %, дни, шт.",
  },

  status: {
    type: DataTypes.ENUM(...Object.values(QO_STATUSES)),
    defaultValue: QO_STATUSES.ACTIVE,
  },

  category: {
    type: DataTypes.ENUM(...Object.values(QO_CATEGORIES)),
    allowNull: false,
  },

  responsibleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Ответственный за цель",
  },

  managementReviewId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Из какого Анализа руководства (опционально)",
  },

  isoClause: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: "Пункт ISO, напр. 8.4, 6.2",
  },

  progress: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: { min: 0, max: 100 },
    comment: "Прогресс 0-100%",
  },

  dueDate: { type: DataTypes.DATEONLY, allowNull: true },
  periodFrom: { type: DataTypes.DATEONLY, allowNull: true },
  periodTo: { type: DataTypes.DATEONLY, allowNull: true },
});

// ═══════════════════════════════════════════════════════════════
// Ассоциации
// ═══════════════════════════════════════════════════════════════

function setupQualityObjectiveAssociations(m) {
  if (m.User) {
    QualityObjective.belongsTo(m.User, { foreignKey: "responsibleId", as: "responsible" });
  }
  if (m.ManagementReview) {
    QualityObjective.belongsTo(m.ManagementReview, { foreignKey: "managementReviewId", as: "managementReview" });
    m.ManagementReview.hasMany(QualityObjective, { foreignKey: "managementReviewId", as: "qualityObjectives" });
  }
}

module.exports = {
  QualityObjective,
  setupQualityObjectiveAssociations,
  QO_STATUSES,
  QO_CATEGORIES,
};
