const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Customer Requirements — ISO 13485 §7.2
// ═══════════════════════════════════════════════════════════════

const CustomerRequirement = sequelize.define("customer_requirement", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  requirementNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: "CRQ-YYYY-NNN",
  },

  productId: { type: DataTypes.INTEGER },

  source: {
    type: DataTypes.ENUM(
      "CONTRACT",
      "TENDER",
      "REGULATORY",
      "MARKET_RESEARCH",
      "CUSTOMER_FEEDBACK",
      "STANDARDS"
    ),
    allowNull: false,
  },

  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT },
  customerName: { type: DataTypes.STRING },

  priority: {
    type: DataTypes.ENUM("MUST", "SHOULD", "COULD", "WONT"),
    defaultValue: "MUST",
  },

  status: {
    type: DataTypes.ENUM("CAPTURED", "REVIEWED", "ACCEPTED", "REJECTED", "IMPLEMENTED", "VERIFIED"),
    defaultValue: "CAPTURED",
  },

  reviewedById: { type: DataTypes.INTEGER },
  reviewedAt: { type: DataTypes.DATE },
  reviewNotes: { type: DataTypes.TEXT },

  linkedDesignInputId: { type: DataTypes.INTEGER },
  responsibleId: { type: DataTypes.INTEGER },
  dueDate: { type: DataTypes.DATEONLY },
});

module.exports = { CustomerRequirement };
