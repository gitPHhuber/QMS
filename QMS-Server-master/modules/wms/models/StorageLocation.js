const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

/**
 * StorageLocation — Адрес хранения (ISO 13485 §7.5.5, §7.5.9)
 * Иерархия: Зона → Стеллаж → Полка → Ячейка
 * Точная локализация продукции: стеллаж/полка/ячейка
 */
const StorageLocation = sequelize.define("storage_location", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  zoneId: { type: DataTypes.INTEGER, allowNull: false },
  rack: { type: DataTypes.STRING, allowNull: false, comment: "Стеллаж, напр. R01" },
  shelf: { type: DataTypes.STRING, allowNull: false, comment: "Полка, напр. S03" },
  cell: { type: DataTypes.STRING, allowNull: true, comment: "Ячейка, напр. C07" },
  barcode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: "Уникальный адрес, напр. R01-S03-C07",
  },
  capacity: { type: DataTypes.INTEGER, allowNull: true },
  isOccupied: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
});

module.exports = { StorageLocation };
