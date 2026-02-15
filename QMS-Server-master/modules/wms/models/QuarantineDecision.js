const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

/**
 * QuarantineDecision — Решение по карантину (ISO 13485 §8.3)
 * Фиксирует решение Quality Manager по заблокированной/карантинной продукции
 */
const QuarantineDecision = sequelize.define("quarantine_decision", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  boxId: { type: DataTypes.INTEGER, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
  decisionType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [["RELEASE", "REWORK", "SCRAP", "RETURN_TO_SUPPLIER"]],
    },
  },
  decidedById: { type: DataTypes.INTEGER, allowNull: false },
  decidedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  ncId: { type: DataTypes.INTEGER, allowNull: true, comment: "FK → NC (если есть)" },
  notes: { type: DataTypes.TEXT, allowNull: true },
});

module.exports = { QuarantineDecision };
