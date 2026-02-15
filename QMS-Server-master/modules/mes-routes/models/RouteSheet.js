const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Operation Record — Route Sheet / Traveler step execution
// ═══════════════════════════════════════════════════════════════

const OperationRecord = sequelize.define("operation_record", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  unitId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "FK → work_order_units",
  },

  routeStepId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "FK → process_route_steps",
  },

  workOrderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "FK → production_tasks (denormalized)",
  },

  stepOrder: { type: DataTypes.INTEGER, allowNull: false },
  stepName: { type: DataTypes.STRING(300), allowNull: false },

  status: {
    type: DataTypes.ENUM(
      "PENDING",
      "IN_PROGRESS",
      "COMPLETED",
      "FAILED",
      "SKIPPED",
      "ON_HOLD"
    ),
    defaultValue: "PENDING",
  },

  result: {
    type: DataTypes.ENUM("PASS", "FAIL", "CONDITIONAL", "N_A"),
    allowNull: true,
  },

  operatorId: { type: DataTypes.INTEGER, allowNull: true },
  inspectorId: { type: DataTypes.INTEGER, allowNull: true },

  startedAt: { type: DataTypes.DATE, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: true },
  durationSeconds: { type: DataTypes.INTEGER, allowNull: true },

  equipmentId: { type: DataTypes.INTEGER, allowNull: true },
  equipmentCalibrationOk: { type: DataTypes.BOOLEAN, allowNull: true },

  operatorSignatureId: { type: DataTypes.INTEGER, allowNull: true },
  inspectorSignatureId: { type: DataTypes.INTEGER, allowNull: true },

  ncId: { type: DataTypes.INTEGER, allowNull: true },
  notes: { type: DataTypes.TEXT },
});

// ═══════════════════════════════════════════════════════════════
// Checklist Response — answers to step checklist items
// ═══════════════════════════════════════════════════════════════

const ChecklistResponse = sequelize.define("checklist_response", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  operationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "FK → operation_records",
  },

  checklistItemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "FK → step_checklists",
  },

  question: { type: DataTypes.STRING(500), allowNull: false },
  responseType: { type: DataTypes.STRING(30), allowNull: false },
  responseValue: { type: DataTypes.STRING(500), allowNull: true },
  numericValue: { type: DataTypes.FLOAT, allowNull: true },
  booleanValue: { type: DataTypes.BOOLEAN, allowNull: true },

  withinTolerance: {
    type: DataTypes.ENUM("GREEN", "YELLOW", "RED"),
    allowNull: true,
  },

  photoUrl: { type: DataTypes.STRING, allowNull: true },

  respondedById: { type: DataTypes.INTEGER, allowNull: false },
  respondedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },

  notes: { type: DataTypes.TEXT },
});

// Associations are set up in index.js → setupAssociations()

module.exports = { OperationRecord, ChecklistResponse };
