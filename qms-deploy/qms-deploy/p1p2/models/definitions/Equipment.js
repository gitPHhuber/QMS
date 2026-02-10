const sequelize = require("../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Метрология и калибровка — ISO 13485 §7.6
// ═══════════════════════════════════════════════════════════════

const Equipment = sequelize.define("equipment", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  
  inventoryNumber: { type: DataTypes.STRING, unique: true, allowNull: false, comment: "Инвентарный номер" },
  name: { type: DataTypes.STRING, allowNull: false },
  manufacturer: { type: DataTypes.STRING },
  model: { type: DataTypes.STRING },
  serialNumber: { type: DataTypes.STRING, allowNull: true },
  
  type: {
    type: DataTypes.ENUM(
      "MEASURING",       // Средство измерения
      "TEST",            // Испытательное оборудование
      "PRODUCTION",      // Производственное оборудование
      "MONITORING",      // Оборудование мониторинга
      "IT"               // ИТ-оборудование (валидируемое)
    ),
    allowNull: false
  },
  
  // Расположение
  location: { type: DataTypes.STRING, comment: "Участок/цех/помещение" },
  responsibleId: { type: DataTypes.INTEGER, allowNull: true },
  
  // Характеристики СИ
  measuringRange: { type: DataTypes.STRING, allowNull: true, comment: "Диапазон измерений" },
  accuracy: { type: DataTypes.STRING, allowNull: true, comment: "Точность/погрешность" },
  resolution: { type: DataTypes.STRING, allowNull: true },
  
  // Поверка/калибровка
  calibrationType: { type: DataTypes.ENUM("VERIFICATION", "CALIBRATION", "VALIDATION", "NONE"), defaultValue: "NONE" },
  calibrationInterval: { type: DataTypes.INTEGER, allowNull: true, comment: "Интервал в месяцах" },
  lastCalibrationDate: { type: DataTypes.DATE, allowNull: true },
  nextCalibrationDate: { type: DataTypes.DATE, allowNull: true },
  
  // Статус
  status: {
    type: DataTypes.ENUM("IN_SERVICE", "OUT_OF_SERVICE", "IN_CALIBRATION", "OVERDUE", "DECOMMISSIONED"),
    defaultValue: "IN_SERVICE"
  },
  
  commissionedDate: { type: DataTypes.DATE, allowNull: true },
  decommissionedDate: { type: DataTypes.DATE, allowNull: true },
  decommissionReason: { type: DataTypes.TEXT, allowNull: true },
  
  certificateUrl: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT },
});

const CalibrationRecord = sequelize.define("calibration_record", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  equipmentId: { type: DataTypes.INTEGER, allowNull: false },
  
  calibrationDate: { type: DataTypes.DATE, allowNull: false },
  performedBy: { type: DataTypes.STRING, comment: "Организация-исполнитель или сотрудник" },
  performedById: { type: DataTypes.INTEGER, allowNull: true },
  
  type: { type: DataTypes.ENUM("VERIFICATION", "CALIBRATION", "ADJUSTMENT"), allowNull: false },
  
  // Результаты
  result: { type: DataTypes.ENUM("PASS", "FAIL", "ADJUSTED", "OUT_OF_TOLERANCE"), allowNull: false },
  
  measuredValues: { type: DataTypes.JSON, allowNull: true, comment: "Измеренные значения: [{reference, measured, deviation}]" },
  
  certificateNumber: { type: DataTypes.STRING, allowNull: true },
  certificateUrl: { type: DataTypes.STRING, allowNull: true },
  
  nextCalibrationDate: { type: DataTypes.DATE, allowNull: true },
  
  // Если не прошло — что делать с продукцией
  impactAssessment: { type: DataTypes.TEXT, allowNull: true, comment: "Оценка влияния на ранее произведённую продукцию" },
  ncCreated: { type: DataTypes.BOOLEAN, defaultValue: false, comment: "Создано ли NC при провале" },
  nonconformityId: { type: DataTypes.INTEGER, allowNull: true },
  
  notes: { type: DataTypes.TEXT },
});

// Ассоциации
Equipment.hasMany(CalibrationRecord, { as: "calibrations", foreignKey: "equipmentId" });
CalibrationRecord.belongsTo(Equipment, { foreignKey: "equipmentId" });

module.exports = { Equipment, CalibrationRecord };
