const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

/**
 * EnvironmentReading — Показания условий хранения (ISO 13485 §7.5.5, СТО_7_5_1 п.10.11-10.14)
 * Температура и влажность по зонам. Журнал по форме Приложения 3 к СТО_7_5_1
 */
const EnvironmentReading = sequelize.define("environment_reading", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  zoneId: { type: DataTypes.INTEGER, allowNull: false },
  temperature: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  humidity: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  measuredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  measuredById: { type: DataTypes.INTEGER, allowNull: false },
  equipmentId: { type: DataTypes.INTEGER, allowNull: true, comment: "FK → Equipment (если модуль доступен)" },
  isWithinLimits: { type: DataTypes.BOOLEAN, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
});

/**
 * EnvironmentAlert — Алерт при отклонении условий хранения
 * Автоматическое уведомление при выходе температуры/влажности за допустимые границы
 */
const EnvironmentAlert = sequelize.define("environment_alert", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  zoneId: { type: DataTypes.INTEGER, allowNull: false },
  readingId: { type: DataTypes.INTEGER, allowNull: false },
  alertType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [["TEMP_HIGH", "TEMP_LOW", "HUMIDITY_HIGH", "HUMIDITY_LOW"]],
    },
  },
  acknowledgedById: { type: DataTypes.INTEGER, allowNull: true },
  acknowledgedAt: { type: DataTypes.DATE, allowNull: true },
  actionTaken: { type: DataTypes.TEXT, allowNull: true },
});

module.exports = { EnvironmentReading, EnvironmentAlert };
