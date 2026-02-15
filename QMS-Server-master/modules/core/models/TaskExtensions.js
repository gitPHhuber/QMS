const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Расширения задач: подзадачи, чеклисты, комментарии, активность
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

const TaskComment = sequelize.define("task_comment", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  taskId: { type: DataTypes.INTEGER, allowNull: false },
  parentId: { type: DataTypes.INTEGER, allowNull: true },
  authorId: { type: DataTypes.INTEGER, allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  mentions: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
});

const TaskActivity = sequelize.define("task_activity", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  taskId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  action: { type: DataTypes.STRING, allowNull: false },
  field: { type: DataTypes.STRING, allowNull: true },
  oldValue: { type: DataTypes.TEXT, allowNull: true },
  newValue: { type: DataTypes.TEXT, allowNull: true },
  metadata: { type: DataTypes.JSONB, allowNull: true },
}, {
  timestamps: true,
  updatedAt: false,
});

module.exports = { TaskSubtask, TaskChecklist, TaskChecklistItem, TaskComment, TaskActivity };
