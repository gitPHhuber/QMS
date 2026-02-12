const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Рекламации / Обратная связь — ISO 13485 §8.2.2 + §8.5.1
// ═══════════════════════════════════════════════════════════════

const Complaint = sequelize.define("complaint", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  complaintNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: "CMP-YYYY-NNN",
  },
  // Источник
  source: {
    type: DataTypes.ENUM("CUSTOMER", "DISTRIBUTOR", "INTERNAL", "REGULATOR", "FIELD_REPORT"),
    allowNull: false,
  },
  reporterName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "ФИО заявителя / название организации",
  },
  reporterContact: { type: DataTypes.TEXT, comment: "Контакт: email/телефон" },
  receivedDate: { type: DataTypes.DATEONLY, allowNull: false },
  // Продукт
  productName: { type: DataTypes.STRING, comment: "Наименование медизделия" },
  productModel: { type: DataTypes.STRING, comment: "Модель" },
  serialNumber: { type: DataTypes.STRING, comment: "Серийный номер" },
  lotNumber: { type: DataTypes.STRING, comment: "Номер партии" },
  // Описание
  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  severity: {
    type: DataTypes.ENUM("CRITICAL", "MAJOR", "MINOR", "INFORMATIONAL"),
    allowNull: false,
  },
  // Классификация
  category: {
    type: DataTypes.ENUM(
      "SAFETY", "PERFORMANCE", "LABELING", "PACKAGING",
      "DOCUMENTATION", "DELIVERY", "SERVICE", "OTHER"
    ),
    allowNull: false,
  },
  isReportable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Требует уведомления Росздравнадзора",
  },
  // Расследование
  investigationSummary: { type: DataTypes.TEXT },
  rootCause: { type: DataTypes.TEXT },
  // Связи
  linkedNcId: { type: DataTypes.INTEGER, allowNull: true, comment: "Связанное несоответствие" },
  linkedCapaId: { type: DataTypes.INTEGER, allowNull: true, comment: "Связанное CAPA" },
  responsibleId: { type: DataTypes.INTEGER, allowNull: true, comment: "Ответственный за расследование" },
  // Статус
  status: {
    type: DataTypes.ENUM("RECEIVED", "UNDER_REVIEW", "INVESTIGATING", "RESOLVED", "CLOSED", "REJECTED"),
    defaultValue: "RECEIVED",
  },
  resolution: { type: DataTypes.TEXT },
  closedAt: { type: DataTypes.DATE },
  closedById: { type: DataTypes.INTEGER },
  // Сроки
  dueDate: { type: DataTypes.DATEONLY, comment: "Крайний срок расследования (30 дней по умолчанию)" },
});

module.exports = { Complaint };
