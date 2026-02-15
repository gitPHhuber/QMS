const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

const Sprint = sequelize.define("sprint", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  goal: { type: DataTypes.TEXT, allowNull: true },
  startDate: { type: DataTypes.DATEONLY, allowNull: true },
  endDate: { type: DataTypes.DATEONLY, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: "PLANNING" },
  createdById: { type: DataTypes.INTEGER, allowNull: false },
});

const SprintBurndown = sequelize.define("sprint_burndown", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sprintId: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  totalTasks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  completedTasks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  remainingTasks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  idealRemaining: { type: DataTypes.FLOAT, allowNull: true },
}, {
  timestamps: true,
  updatedAt: false,
});

module.exports = { Sprint, SprintBurndown };
