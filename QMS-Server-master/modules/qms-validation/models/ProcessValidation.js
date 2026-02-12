const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Валидация процессов — ISO 13485 §7.5.6
// ═══════════════════════════════════════════════════════════════

const ProcessValidation = sequelize.define("process_validation", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  validationNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: "PV-YYYY-NNN",
  },
  processName: { type: DataTypes.STRING, allowNull: false, comment: "Название процесса" },
  processOwner: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  // Протоколы IQ/OQ/PQ
  iqStatus: {
    type: DataTypes.ENUM("NOT_STARTED", "IN_PROGRESS", "PASSED", "FAILED", "N_A"),
    defaultValue: "NOT_STARTED",
    comment: "Installation Qualification",
  },
  iqDate: { type: DataTypes.DATEONLY },
  iqDocumentId: { type: DataTypes.INTEGER, comment: "FK на документ протокола IQ" },
  oqStatus: {
    type: DataTypes.ENUM("NOT_STARTED", "IN_PROGRESS", "PASSED", "FAILED", "N_A"),
    defaultValue: "NOT_STARTED",
    comment: "Operational Qualification",
  },
  oqDate: { type: DataTypes.DATEONLY },
  oqDocumentId: { type: DataTypes.INTEGER },
  pqStatus: {
    type: DataTypes.ENUM("NOT_STARTED", "IN_PROGRESS", "PASSED", "FAILED", "N_A"),
    defaultValue: "NOT_STARTED",
    comment: "Performance Qualification",
  },
  pqDate: { type: DataTypes.DATEONLY },
  pqDocumentId: { type: DataTypes.INTEGER },
  // Общий статус
  status: {
    type: DataTypes.ENUM(
      "PLANNED", "IQ_PHASE", "OQ_PHASE", "PQ_PHASE",
      "VALIDATED", "REVALIDATION_DUE", "EXPIRED", "FAILED"
    ),
    defaultValue: "PLANNED",
  },
  // Ревалидация
  validatedAt: { type: DataTypes.DATE },
  revalidationIntervalMonths: { type: DataTypes.INTEGER, defaultValue: 12 },
  nextRevalidationDate: { type: DataTypes.DATEONLY },
  // Связи
  equipmentIds: { type: DataTypes.TEXT, comment: "JSON массив ID оборудования" },
  responsibleId: { type: DataTypes.INTEGER },
  approvedById: { type: DataTypes.INTEGER },
});

module.exports = { ProcessValidation };
