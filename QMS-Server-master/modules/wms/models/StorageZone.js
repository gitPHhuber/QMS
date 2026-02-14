const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

/**
 * StorageZone — Складская зона (ISO 13485 §7.5.5)
 * Зонирование GMP-склада: INCOMING, QUARANTINE, MAIN, FINISHED_GOODS, DEFECT, SHIPPING
 */
const StorageZone = sequelize.define("storage_zone", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [["INCOMING", "QUARANTINE", "MAIN", "FINISHED_GOODS", "DEFECT", "SHIPPING"]],
    },
  },
  parentZoneId: { type: DataTypes.INTEGER, allowNull: true },
  conditions: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null,
    comment: "JSON: { temp_min, temp_max, humidity_min, humidity_max }",
  },
  capacity: { type: DataTypes.INTEGER, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
});

/**
 * ZoneTransitionRule — Матрица допустимых переходов между зонами
 * Определяет какие перемещения разрешены, нужно ли одобрение, какая роль требуется
 */
const ZoneTransitionRule = sequelize.define("zone_transition_rule", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fromZoneType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "Тип зоны-источника",
  },
  toZoneType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "Тип зоны-назначения",
  },
  requiresApproval: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  requiredRole: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Код роли (ability), необходимой для данного перехода",
  },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
});

module.exports = { StorageZone, ZoneTransitionRule };
