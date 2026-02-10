const sequelize = require("../db");
const { DataTypes } = require("sequelize");

/**
 * Минимальная модель для чтения из таблицы production_output.
 * Поля можно добавить позже по образцу из scripts/import_production_outputs.js
 */
const OUTPUT_STATUSES = {}; // если где-то ожидаются статусы — заполни позже

const ProductionOutput = sequelize.define(
  "ProductionOutput",
  {},
  {
    tableName: "production_output",
    timestamps: false,
    underscored: true,
  }
);

module.exports = { ProductionOutput, OUTPUT_STATUSES };
