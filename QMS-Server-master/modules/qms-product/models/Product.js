const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Реестр изделий — ISO 13485 §7.5.3 (идентификация и прослеживаемость)
// ═══════════════════════════════════════════════════════════════

const Product = sequelize.define("product", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: "PRD-NNN",
  },
  name: { type: DataTypes.STRING, allowNull: false },
  model: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  // Регулятивные данные
  registrationNumber: { type: DataTypes.STRING, comment: "Номер регистрационного удостоверения (РУ)" },
  registrationDate: { type: DataTypes.DATEONLY },
  registrationExpiry: { type: DataTypes.DATEONLY },
  riskClass: {
    type: DataTypes.ENUM("1", "2A", "2B", "3"),
    comment: "Класс потенциального риска по ПП РФ 737",
  },
  // Классификация
  category: {
    type: DataTypes.ENUM("DIAGNOSTIC", "THERAPEUTIC", "MONITORING", "SOFTWARE", "ACCESSORY", "OTHER"),
  },
  productionStatus: {
    type: DataTypes.ENUM("DEVELOPMENT", "PROTOTYPE", "PILOT", "SERIAL", "DISCONTINUED"),
    defaultValue: "DEVELOPMENT",
  },
  // Документация
  technicalFileId: { type: DataTypes.INTEGER, comment: "FK на техническое досье в DMS" },
  iomDocumentId: { type: DataTypes.INTEGER, comment: "FK на инструкцию по эксплуатации" },
  // DMF (Device Master File) — ISO 13485 §4.2.3
  dmfStatus: {
    type: DataTypes.ENUM("NOT_STARTED", "IN_PROGRESS", "COMPLETE", "NEEDS_UPDATE"),
    defaultValue: "NOT_STARTED",
    comment: "Общий статус технического досье",
  },
  intendedUse: { type: DataTypes.TEXT, comment: "Назначение изделия" },
  indicationsForUse: { type: DataTypes.TEXT, comment: "Показания к применению" },
  contraindications: { type: DataTypes.TEXT, comment: "Противопоказания" },
  // Ответственные
  designOwnerId: { type: DataTypes.INTEGER },
  qualityOwnerId: { type: DataTypes.INTEGER },
});

module.exports = { Product };
