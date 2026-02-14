const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Work Order Unit — individual serialized units within a work order
// ═══════════════════════════════════════════════════════════════

const WorkOrderUnit = sequelize.define("work_order_unit", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  workOrderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "FK → production_tasks",
  },

  serialNumber: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
  },

  status: {
    type: DataTypes.ENUM(
      "CREATED",
      "IN_PROGRESS",
      "QC_PENDING",
      "QC_PASSED",
      "QC_FAILED",
      "ON_HOLD",
      "REWORK",
      "SCRAPPED",
      "RELEASED"
    ),
    defaultValue: "CREATED",
  },

  currentStepId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "FK → process_route_steps",
  },

  dhrId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "FK → device_history_records",
  },

  startedAt: { type: DataTypes.DATE, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: true },

  holdReason: { type: DataTypes.TEXT, allowNull: true },

  ncId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "FK → nonconformities",
  },

  notes: { type: DataTypes.TEXT },
});

// ═══════════════════════════════════════════════════════════════
// Work Order Material — material requirements & tracking
// ═══════════════════════════════════════════════════════════════

const WorkOrderMaterial = sequelize.define("work_order_material", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  workOrderId: { type: DataTypes.INTEGER, allowNull: false },

  bomItemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "FK → bom_items",
  },

  requiredQty: { type: DataTypes.FLOAT, allowNull: false },
  allocatedQty: { type: DataTypes.FLOAT, defaultValue: 0 },
  consumedQty: { type: DataTypes.FLOAT, defaultValue: 0 },

  unit: { type: DataTypes.STRING(20), defaultValue: "шт" },

  warehouseBoxId: { type: DataTypes.INTEGER, allowNull: true },
  lotNumber: { type: DataTypes.STRING, allowNull: true },

  status: {
    type: DataTypes.ENUM("PENDING", "ALLOCATED", "ISSUED", "CONSUMED", "RETURNED"),
    defaultValue: "PENDING",
  },

  issuedById: { type: DataTypes.INTEGER, allowNull: true },
  issuedAt: { type: DataTypes.DATE, allowNull: true },
});

// ═══════════════════════════════════════════════════════════════
// Work Order Readiness Check — pre-launch verification records
// ═══════════════════════════════════════════════════════════════

const WorkOrderReadinessCheck = sequelize.define("work_order_readiness_check", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  workOrderId: { type: DataTypes.INTEGER, allowNull: false },

  checkType: {
    type: DataTypes.ENUM("MATERIALS", "EQUIPMENT", "TRAINING", "DOCUMENTS", "FULL"),
    allowNull: false,
  },

  result: {
    type: DataTypes.ENUM("READY", "NOT_READY", "PARTIAL"),
    allowNull: false,
  },

  details: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },

  performedById: { type: DataTypes.INTEGER, allowNull: false },
  performedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

// Associations are set up in index.js → setupAssociations()

module.exports = { WorkOrderUnit, WorkOrderMaterial, WorkOrderReadinessCheck };
