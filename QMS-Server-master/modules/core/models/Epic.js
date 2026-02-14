const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

const Epic = sequelize.define("epic", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  color: { type: DataTypes.STRING, allowNull: false, defaultValue: "#A06AE8" },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: "ACTIVE" },
  createdById: { type: DataTypes.INTEGER, allowNull: false },
});

module.exports = { Epic };
