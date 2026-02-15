const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Structured Impact Assessment Items — ISO 13485 §7.3.9
// ═══════════════════════════════════════════════════════════════

const ChangeImpactItem = sequelize.define("change_impact_item", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  changeRequestId: { type: DataTypes.INTEGER, allowNull: false },
  impactArea: {
    type: DataTypes.ENUM(
      "DESIGN",
      "MANUFACTURING",
      "QUALITY",
      "REGULATORY",
      "SUPPLY_CHAIN",
      "LABELING",
      "PACKAGING",
      "DOCUMENTATION",
      "TRAINING",
      "VALIDATION",
      "RISK_MANAGEMENT",
      "POST_MARKET"
    ),
    allowNull: false,
  },
  impactLevel: {
    type: DataTypes.ENUM("NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"),
    defaultValue: "NONE",
  },
  description: { type: DataTypes.TEXT, allowNull: false },
  mitigationPlan: { type: DataTypes.TEXT },
  affectedProductId: { type: DataTypes.INTEGER },
  affectedDocumentId: { type: DataTypes.INTEGER },
  assessedById: { type: DataTypes.INTEGER },
  assessedAt: { type: DataTypes.DATE },
});

module.exports = { ChangeImpactItem };
