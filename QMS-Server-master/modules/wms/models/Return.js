const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

/**
 * Return — Возврат продукции (ISO 13485 §8.3, §7.5.5)
 * Workflow: приём → карантин → осмотр → решение → исполнение
 */
const Return = sequelize.define("return", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  number: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  customerId: { type: DataTypes.INTEGER, allowNull: true },
  shipmentId: { type: DataTypes.INTEGER, allowNull: true, comment: "FK → Shipment (исходная отгрузка)" },
  reason: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "RECEIVED",
    validate: {
      isIn: [["RECEIVED", "INSPECTING", "DECIDED", "CLOSED"]],
    },
  },
  complaintId: { type: DataTypes.INTEGER, allowNull: true, comment: "FK → Complaint (если модуль доступен)" },
  notes: { type: DataTypes.TEXT, allowNull: true },
});

/**
 * ReturnItem — Позиция возврата
 * Каждый предмет с описанием состояния и решением по утилизации
 */
const ReturnItem = sequelize.define("return_item", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  returnId: { type: DataTypes.INTEGER, allowNull: false },
  boxId: { type: DataTypes.INTEGER, allowNull: true },
  serialNumber: { type: DataTypes.STRING, allowNull: true },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  condition: { type: DataTypes.TEXT, allowNull: true },
  disposition: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [["RESTOCK", "REWORK", "SCRAP", "DESTROY"]],
    },
  },
});

module.exports = { Return, ReturnItem };
