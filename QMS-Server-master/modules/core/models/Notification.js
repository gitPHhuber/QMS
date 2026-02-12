const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Центр уведомлений — ISO 13485 (поддержка всех модулей)
// ═══════════════════════════════════════════════════════════════

const Notification = sequelize.define("notification", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  type: {
    type: DataTypes.ENUM(
      "CAPA_OVERDUE", "CAPA_ASSIGNED", "DOCUMENT_PENDING",
      "CALIBRATION_DUE", "AUDIT_UPCOMING", "NC_CREATED",
      "COMPLAINT_RECEIVED", "TRAINING_EXPIRED",
      "CHANGE_REQUEST_PENDING", "REVALIDATION_DUE",
      "REVIEW_SCHEDULED", "GENERAL"
    ),
    allowNull: false,
  },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT },
  severity: {
    type: DataTypes.ENUM("INFO", "WARNING", "CRITICAL"),
    defaultValue: "INFO",
  },
  entityType: { type: DataTypes.STRING, comment: "complaint, nc, capa, document..." },
  entityId: { type: DataTypes.INTEGER },
  link: { type: DataTypes.STRING, comment: "Ссылка на модуль /qms/..." },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  readAt: { type: DataTypes.DATE },
});

module.exports = { Notification };
