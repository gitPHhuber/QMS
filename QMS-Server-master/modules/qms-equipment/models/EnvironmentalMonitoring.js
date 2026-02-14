const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Environmental Monitoring — ISO 13485 §6.4
// ═══════════════════════════════════════════════════════════════

const EnvironmentalMonitoringPoint = sequelize.define("environmental_monitoring_point", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  pointCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: "EMP-NNN",
  },

  name: { type: DataTypes.STRING, allowNull: false },
  location: { type: DataTypes.STRING, allowNull: false },

  roomClassification: {
    type: DataTypes.ENUM("ISO_5", "ISO_6", "ISO_7", "ISO_8", "CONTROLLED", "UNCONTROLLED"),
  },

  monitoredParameters: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },

  monitoringFrequency: {
    type: DataTypes.ENUM("CONTINUOUS", "HOURLY", "DAILY", "WEEKLY", "MONTHLY"),
    defaultValue: "DAILY",
  },

  status: {
    type: DataTypes.ENUM("ACTIVE", "INACTIVE", "MAINTENANCE"),
    defaultValue: "ACTIVE",
  },

  equipmentId: { type: DataTypes.INTEGER },
  responsibleId: { type: DataTypes.INTEGER },
});

// ═══════════════════════════════════════════════════════════════
// Environmental Reading — individual measurement records
// ═══════════════════════════════════════════════════════════════

const EnvironmentalReading = sequelize.define("environmental_reading", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  monitoringPointId: { type: DataTypes.INTEGER, allowNull: false },

  parameter: { type: DataTypes.STRING, allowNull: false },
  value: { type: DataTypes.FLOAT, allowNull: false },
  unit: { type: DataTypes.STRING, allowNull: false },

  withinSpec: { type: DataTypes.BOOLEAN, allowNull: false },

  readingAt: { type: DataTypes.DATE, allowNull: false },

  recordedById: { type: DataTypes.INTEGER },
  linkedNcId: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT },
});

// ═══════════════════════════════════════════════════════════════
// Internal associations
// ═══════════════════════════════════════════════════════════════

EnvironmentalMonitoringPoint.hasMany(EnvironmentalReading, {
  as: "readings",
  foreignKey: "monitoringPointId",
  onDelete: "CASCADE",
});
EnvironmentalReading.belongsTo(EnvironmentalMonitoringPoint, {
  as: "monitoringPoint",
  foreignKey: "monitoringPointId",
});

module.exports = { EnvironmentalMonitoringPoint, EnvironmentalReading };
