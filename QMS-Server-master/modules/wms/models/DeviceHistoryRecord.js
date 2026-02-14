const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

/**
 * DeviceHistoryRecord — Запись истории устройства (ISO 13485 §7.5.9, §7.5.3)
 * Полная цепочка: поставщик → входной контроль → производство → серийный номер → отгрузка
 */
const DeviceHistoryRecord = sequelize.define("device_history_record", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productId: { type: DataTypes.INTEGER, allowNull: true, comment: "FK → Product (если модуль доступен)" },
  serialNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  batchNumber: { type: DataTypes.STRING, allowNull: true },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "IN_PRODUCTION",
    validate: {
      isIn: [["IN_PRODUCTION", "QC_PASSED", "QC_FAILED", "RELEASED", "SHIPPED", "RETURNED"]],
    },
  },
  manufacturingDate: { type: DataTypes.DATEONLY, allowNull: true },
  releaseDate: { type: DataTypes.DATEONLY, allowNull: true },
});

/**
 * DHRComponent — Комплектующее в составе устройства
 * Связь: серийный номер устройства → комплектующее (складская коробка) → поставщик → сертификат
 */
const DHRComponent = sequelize.define("dhr_component", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  dhrId: { type: DataTypes.INTEGER, allowNull: false },
  boxId: { type: DataTypes.INTEGER, allowNull: true, comment: "FK → WarehouseBox" },
  componentName: { type: DataTypes.STRING, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  supplierLot: { type: DataTypes.STRING, allowNull: true },
  certificateRef: { type: DataTypes.STRING, allowNull: true },
});

/**
 * DHRRecord — Запись в истории устройства
 * Каждое событие жизненного цикла: входной контроль, производственный шаг, QC, калибровка и т.д.
 */
const DHRRecord = sequelize.define("dhr_record", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  dhrId: { type: DataTypes.INTEGER, allowNull: false },
  recordType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [["INCOMING_INSPECTION", "PRODUCTION_STEP", "QC_CHECK", "CALIBRATION", "ENVIRONMENT", "MOVEMENT", "SHIPMENT"]],
    },
  },
  referenceId: { type: DataTypes.INTEGER, allowNull: true, comment: "FK к соответствующей сущности" },
  description: { type: DataTypes.TEXT, allowNull: true },
  recordedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  recordedById: { type: DataTypes.INTEGER, allowNull: true },
});

module.exports = { DeviceHistoryRecord, DHRComponent, DHRRecord };
