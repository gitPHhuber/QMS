const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

/**
 * Shipment — Отгрузка (ISO 13485 §7.5.5, СТО_7_5_1 п.10.15)
 * Регулируемый процесс отпуска продукции: формирование → комплектация → проверка → отгрузка
 */
const Shipment = sequelize.define("shipment", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  number: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  customerId: { type: DataTypes.INTEGER, allowNull: true, comment: "Контрагент" },
  contractNumber: { type: DataTypes.STRING, allowNull: true },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "DRAFT",
    validate: {
      isIn: [["DRAFT", "PICKING", "PACKED", "SHIPPED", "DELIVERED"]],
    },
  },
  shippedById: { type: DataTypes.INTEGER, allowNull: true },
  verifiedById: { type: DataTypes.INTEGER, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
});

/**
 * ShipmentItem — Позиция отгрузки
 * Валидация: только коробки из зоны FINISHED_GOODS
 */
const ShipmentItem = sequelize.define("shipment_item", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  shipmentId: { type: DataTypes.INTEGER, allowNull: false },
  boxId: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  packageCondition: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [["OK", "DAMAGED"]],
    },
  },
  verifiedAt: { type: DataTypes.DATE, allowNull: true },
});

module.exports = { Shipment, ShipmentItem };
