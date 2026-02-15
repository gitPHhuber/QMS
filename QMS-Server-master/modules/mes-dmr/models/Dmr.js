const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Device Master Record (DMR) — ISO 13485 §4.2.3
// ═══════════════════════════════════════════════════════════════

const DeviceMasterRecord = sequelize.define("device_master_record", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  dmrNumber: {
    type: DataTypes.STRING(30),
    unique: true,
    allowNull: false,
    comment: "DMR-YYYY-NNN",
  },

  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "FK → products",
  },

  version: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: "1.0",
  },

  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT },

  status: {
    type: DataTypes.ENUM("DRAFT", "REVIEW", "APPROVED", "OBSOLETE"),
    defaultValue: "DRAFT",
  },

  previousVersionId: { type: DataTypes.INTEGER, allowNull: true },
  changeRequestId: { type: DataTypes.INTEGER, allowNull: true },

  approvedById: { type: DataTypes.INTEGER, allowNull: true },
  approvedAt: { type: DataTypes.DATE, allowNull: true },
  effectiveDate: { type: DataTypes.DATEONLY, allowNull: true },

  createdById: { type: DataTypes.INTEGER, allowNull: false },
  notes: { type: DataTypes.TEXT },
});

// ═══════════════════════════════════════════════════════════════
// BOM Item — Bill of Materials line items
// ═══════════════════════════════════════════════════════════════

const BOMItem = sequelize.define("bom_item", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  dmrId: { type: DataTypes.INTEGER, allowNull: false },
  itemNumber: { type: DataTypes.INTEGER, allowNull: false },
  partNumber: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING(500), allowNull: false },

  category: {
    type: DataTypes.ENUM(
      "COMPONENT",
      "RAW_MATERIAL",
      "SUBASSEMBLY",
      "PACKAGING",
      "LABEL",
      "CONSUMABLE"
    ),
    allowNull: false,
  },

  quantityPer: { type: DataTypes.FLOAT, allowNull: false },
  unit: { type: DataTypes.STRING(20), defaultValue: "шт" },

  requiresLotTracking: { type: DataTypes.BOOLEAN, defaultValue: false },
  requiresSerialTracking: { type: DataTypes.BOOLEAN, defaultValue: false },

  approvedSupplierId: { type: DataTypes.INTEGER, allowNull: true },
  alternatePartNumbers: { type: DataTypes.JSONB, defaultValue: [] },
  specifications: { type: DataTypes.TEXT },
  notes: { type: DataTypes.TEXT },
});

// ═══════════════════════════════════════════════════════════════
// Process Route — manufacturing route definition
// ═══════════════════════════════════════════════════════════════

const ProcessRoute = sequelize.define("process_route", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  dmrId: { type: DataTypes.INTEGER, allowNull: false },

  routeCode: { type: DataTypes.STRING(50), allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  version: { type: DataTypes.STRING(20), defaultValue: "1.0" },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },

  estimatedCycleTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Minutes",
  },

  createdById: { type: DataTypes.INTEGER, allowNull: false },
});

// ═══════════════════════════════════════════════════════════════
// Process Route Step — individual step within a route
// ═══════════════════════════════════════════════════════════════

const ProcessRouteStep = sequelize.define("process_route_step", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  routeId: { type: DataTypes.INTEGER, allowNull: false },
  stepOrder: { type: DataTypes.INTEGER, allowNull: false },
  stepCode: { type: DataTypes.STRING(30), allowNull: false },
  name: { type: DataTypes.STRING(300), allowNull: false },
  description: { type: DataTypes.TEXT },

  stepType: {
    type: DataTypes.ENUM(
      "ASSEMBLY",
      "INSPECTION",
      "TEST",
      "PACKAGING",
      "LABELING",
      "REWORK",
      "HOLD_POINT"
    ),
    allowNull: false,
  },

  workInstructions: { type: DataTypes.TEXT },
  documentIds: { type: DataTypes.JSONB, defaultValue: [] },
  requiredEquipmentIds: { type: DataTypes.JSONB, defaultValue: [] },
  requiredTrainingIds: { type: DataTypes.JSONB, defaultValue: [] },

  estimatedDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Minutes",
  },

  isInspectionGate: { type: DataTypes.BOOLEAN, defaultValue: false },
  requiresDualSignoff: { type: DataTypes.BOOLEAN, defaultValue: false },
  isGoNoGo: { type: DataTypes.BOOLEAN, defaultValue: false },
  isSpecialProcess: { type: DataTypes.BOOLEAN, defaultValue: false },
  processValidationId: { type: DataTypes.INTEGER, allowNull: true },
  notes: { type: DataTypes.TEXT },
});

// ═══════════════════════════════════════════════════════════════
// Step Checklist — checklist items for a process step
// ═══════════════════════════════════════════════════════════════

const StepChecklist = sequelize.define("step_checklist", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  stepId: { type: DataTypes.INTEGER, allowNull: false },
  itemOrder: { type: DataTypes.INTEGER, allowNull: false },
  question: { type: DataTypes.STRING(500), allowNull: false },

  responseType: {
    type: DataTypes.ENUM(
      "PASS_FAIL",
      "YES_NO",
      "NUMERIC",
      "TEXT",
      "SELECTION",
      "PHOTO"
    ),
    allowNull: false,
  },

  nominalValue: { type: DataTypes.FLOAT, allowNull: true },
  lowerLimit: { type: DataTypes.FLOAT, allowNull: true },
  upperLimit: { type: DataTypes.FLOAT, allowNull: true },
  unit: { type: DataTypes.STRING(30), allowNull: true },
  options: { type: DataTypes.JSONB, defaultValue: [] },

  isMandatory: { type: DataTypes.BOOLEAN, defaultValue: true },
  isAutoHold: { type: DataTypes.BOOLEAN, defaultValue: false },
  notes: { type: DataTypes.TEXT },
});

// Associations are set up in index.js → setupAssociations()

module.exports = { DeviceMasterRecord, BOMItem, ProcessRoute, ProcessRouteStep, StepChecklist };
