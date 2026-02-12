const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Рекламации / Обратная связь — ISO 13485 §8.2.2 + §8.2.3
// СТО-8.2.2 (Обращение с жалобами) + СТО-8.2.3 (Vigilance)
// ═══════════════════════════════════════════════════════════════

const Complaint = sequelize.define("complaint", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  complaintNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: "CMP-YYYY-NNN",
  },

  // ─── Классификация типа обращения (СТО-8.2.2 §4.1) ───
  complaintType: {
    type: DataTypes.ENUM("COMPLAINT", "RECLAMATION", "FEEDBACK"),
    allowNull: false,
    defaultValue: "COMPLAINT",
    comment: "Жалоба / Рекламация / Предложение (обратная связь)",
  },

  // ─── Источник ───
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
  reporterOrganization: { type: DataTypes.STRING, comment: "Организация заявителя" },
  reporterAddress: { type: DataTypes.TEXT, comment: "Адрес заявителя" },
  receivedDate: { type: DataTypes.DATEONLY, allowNull: false },
  eventDate: { type: DataTypes.DATEONLY, comment: "Дата события/инцидента" },
  countryOfOccurrence: {
    type: DataTypes.STRING,
    defaultValue: "RU",
    comment: "Страна, где произошёл инцидент (ISO 3166-1 alpha-2)",
  },

  // ─── Продукт (СТО-8.2.2 §4.2) ───
  productName: { type: DataTypes.STRING, comment: "Наименование медизделия" },
  productModel: { type: DataTypes.STRING, comment: "Модель" },
  serialNumber: { type: DataTypes.STRING, comment: "Серийный номер" },
  lotNumber: { type: DataTypes.STRING, comment: "Номер партии" },
  productRegistrationNumber: { type: DataTypes.STRING, comment: "Номер регистрационного удостоверения" },
  manufacturingDate: { type: DataTypes.DATEONLY, comment: "Дата производства" },
  expirationDate: { type: DataTypes.DATEONLY, comment: "Срок годности" },
  quantityAffected: { type: DataTypes.INTEGER, comment: "Количество затронутых единиц" },

  // ─── Описание ───
  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  severity: {
    type: DataTypes.ENUM("CRITICAL", "MAJOR", "MINOR", "INFORMATIONAL"),
    allowNull: false,
  },

  // ─── Классификация по категории (СТО-8.2.2 §4.3) ───
  category: {
    type: DataTypes.ENUM(
      "SAFETY", "PERFORMANCE", "LABELING", "PACKAGING",
      "DOCUMENTATION", "DELIVERY", "SERVICE", "OTHER"
    ),
    allowNull: false,
  },

  // ─── Оценка риска для пациента (СТО-8.2.2 §4.4) ───
  patientInvolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Был ли вовлечён пациент",
  },
  healthHazard: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Угроза здоровью / жизни пациента или пользователя",
  },

  // ─── Regulatory Reporting / Vigilance (СТО-8.2.3) ───
  isReportable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Требует уведомления Росздравнадзора",
  },
  vigilanceReportNumber: {
    type: DataTypes.STRING,
    comment: "Номер отчёта в Росздравнадзор (VR-YYYY-NNN)",
  },
  vigilanceStatus: {
    type: DataTypes.ENUM("NOT_REQUIRED", "PENDING", "SUBMITTED", "ACKNOWLEDGED", "CLOSED"),
    defaultValue: "NOT_REQUIRED",
    comment: "Статус подачи vigilance-уведомления",
  },
  vigilanceDeadline: {
    type: DataTypes.DATEONLY,
    comment: "Крайний срок подачи уведомления (10 дней для серьёзных, 30 дней для прочих)",
  },
  vigilanceSubmittedAt: {
    type: DataTypes.DATE,
    comment: "Дата и время фактической отправки уведомления",
  },
  vigilanceSubmittedById: {
    type: DataTypes.INTEGER,
    comment: "Кто отправил уведомление",
  },
  vigilanceAcknowledgedAt: {
    type: DataTypes.DATE,
    comment: "Дата подтверждения получения от регулятора",
  },
  regulatoryAuthorityRef: {
    type: DataTypes.STRING,
    comment: "Регистрационный номер от Росздравнадзора",
  },
  vigilanceNotes: {
    type: DataTypes.TEXT,
    comment: "Примечания по vigilance reporting",
  },

  // ─── Расследование (СТО-8.2.2 §5) ───
  investigationSummary: { type: DataTypes.TEXT },
  rootCause: { type: DataTypes.TEXT },
  correctiveAction: { type: DataTypes.TEXT, comment: "Принятые корректирующие меры" },
  preventiveAction: { type: DataTypes.TEXT, comment: "Принятые предупреждающие меры" },
  investigationStartedAt: { type: DataTypes.DATE, comment: "Дата начала расследования" },
  investigationCompletedAt: { type: DataTypes.DATE, comment: "Дата завершения расследования" },

  // ─── Связи ───
  linkedNcId: { type: DataTypes.INTEGER, allowNull: true, comment: "Связанное несоответствие" },
  linkedCapaId: { type: DataTypes.INTEGER, allowNull: true, comment: "Связанное CAPA" },
  responsibleId: { type: DataTypes.INTEGER, allowNull: true, comment: "Ответственный за расследование" },
  createdById: { type: DataTypes.INTEGER, allowNull: true, comment: "Кто создал запись" },

  // ─── Статус ───
  status: {
    type: DataTypes.ENUM("RECEIVED", "UNDER_REVIEW", "INVESTIGATING", "RESOLVED", "CLOSED", "REJECTED"),
    defaultValue: "RECEIVED",
  },
  resolution: { type: DataTypes.TEXT },
  closedAt: { type: DataTypes.DATE },
  closedById: { type: DataTypes.INTEGER },

  // ─── Сроки ───
  dueDate: { type: DataTypes.DATEONLY, comment: "Крайний срок расследования (30 дней по умолчанию)" },
});

module.exports = { Complaint };
