const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

/**
 * IncomingInspection — Протокол входного контроля (ISO 13485 §7.4.3, СТО_7_5_3 п.6.10-6.17)
 * Формализованная верификация закупленной продукции
 */
const IncomingInspection = sequelize.define("incoming_inspection", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  supplyId: { type: DataTypes.INTEGER, allowNull: false },
  inspectorId: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "PENDING",
    validate: {
      isIn: [["PENDING", "IN_PROGRESS", "PASSED", "FAILED", "CONDITIONAL"]],
    },
  },
  overallResult: { type: DataTypes.TEXT, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
});

/**
 * InspectionChecklistItem — Пункт чек-листа входного контроля
 * Каждый пункт проверки с результатом (OK/NOK/NA/CONDITIONAL), значением и фотофиксацией
 */
const InspectionChecklistItem = sequelize.define("inspection_checklist_item", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  inspectionId: { type: DataTypes.INTEGER, allowNull: false },
  checkItem: { type: DataTypes.STRING, allowNull: false, comment: "Наименование пункта проверки" },
  result: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [["OK", "NOK", "NA", "CONDITIONAL"]],
    },
  },
  value: { type: DataTypes.STRING, allowNull: true, comment: "Измеренное значение" },
  comment: { type: DataTypes.TEXT, allowNull: true },
  photoUrl: { type: DataTypes.STRING, allowNull: true },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
});

/**
 * InspectionTemplate — Шаблон чек-листа по типу продукции
 * Предустановленные пункты проверки (упаковка, комплектность, документы качества, маркировка и т.д.)
 */
const InspectionTemplate = sequelize.define("inspection_template", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  productType: { type: DataTypes.STRING, allowNull: true },
  items: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: "JSON: [{ checkItem, description, required }]",
  },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
});

module.exports = { IncomingInspection, InspectionChecklistItem, InspectionTemplate };
