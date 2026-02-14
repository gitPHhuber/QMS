const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Расширения задач: подзадачи, чеклисты
// ═══════════════════════════════════════════════════════════════

const TaskSubtask = sequelize.define("task_subtask", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  taskId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(500), allowNull: false },
  isCompleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  createdById: { type: DataTypes.INTEGER, allowNull: true },
});

const TaskChecklist = sequelize.define("task_checklist", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  taskId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "Чеклист" },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  createdById: { type: DataTypes.INTEGER, allowNull: true },
});

const TaskChecklistItem = sequelize.define("task_checklist_item", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  checklistId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(500), allowNull: false },
  isCompleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
});

module.exports = { TaskSubtask, TaskChecklist, TaskChecklistItem };
