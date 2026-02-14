const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Production KPI Target — target values for manufacturing KPIs
// ═══════════════════════════════════════════════════════════════

const ProductionKpiTarget = sequelize.define("production_kpi_target", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  productId: { type: DataTypes.INTEGER, allowNull: true },

  kpiCode: { type: DataTypes.STRING(50), allowNull: false },

  targetValue: { type: DataTypes.FLOAT, allowNull: false },
  warningValue: { type: DataTypes.FLOAT, allowNull: true },

  unit: { type: DataTypes.STRING(20), allowNull: true },

  period: { type: DataTypes.STRING(20), defaultValue: "MONTHLY" },

  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },

  createdById: { type: DataTypes.INTEGER, allowNull: false },
});

// Associations are set up in index.js -> setupAssociations()

module.exports = { ProductionKpiTarget };
