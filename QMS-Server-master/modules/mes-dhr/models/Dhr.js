const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Device History Record (DHR) — ISO 13485 §7.5.9
// ═══════════════════════════════════════════════════════════════

const DeviceHistoryRecord = sequelize.define("device_history_record", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  dhrNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: "DHR-YYYY-NNN",
  },

  productId: { type: DataTypes.INTEGER, allowNull: false },
  serialNumber: { type: DataTypes.STRING },
  lotNumber: { type: DataTypes.STRING },
  batchSize: { type: DataTypes.INTEGER },

  productionStartDate: { type: DataTypes.DATEONLY },
  productionEndDate: { type: DataTypes.DATEONLY },

  dmrVersion: { type: DataTypes.STRING },

  status: {
    type: DataTypes.ENUM(
      "IN_PRODUCTION",
      "QC_PENDING",
      "QC_PASSED",
      "QC_FAILED",
      "RELEASED",
      "ON_HOLD",
      "QUARANTINE",
      "RETURNED",
      "RECALLED"
    ),
    defaultValue: "IN_PRODUCTION",
  },

  qcInspectorId: { type: DataTypes.INTEGER },
  qcDate: { type: DataTypes.DATE },
  qcNotes: { type: DataTypes.TEXT },

  releasedById: { type: DataTypes.INTEGER },
  releasedAt: { type: DataTypes.DATE },

  warehouseBoxId: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT },
});

// ═══════════════════════════════════════════════════════════════
// DHR Material Trace — traceability of components & materials
// ═══════════════════════════════════════════════════════════════

const DhrMaterialTrace = sequelize.define("dhr_material_trace", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  dhrId: { type: DataTypes.INTEGER, allowNull: false },

  materialType: {
    type: DataTypes.ENUM("COMPONENT", "RAW_MATERIAL", "SUBASSEMBLY", "PACKAGING"),
    allowNull: false,
  },

  description: { type: DataTypes.STRING(500), allowNull: false },
  partNumber: { type: DataTypes.STRING },
  lotNumber: { type: DataTypes.STRING },
  serialNumber: { type: DataTypes.STRING },

  supplierId: { type: DataTypes.INTEGER },
  supplierName: { type: DataTypes.STRING },

  warehouseBoxId: { type: DataTypes.INTEGER },
  supplyId: { type: DataTypes.INTEGER },

  quantity: { type: DataTypes.FLOAT },
  unit: { type: DataTypes.STRING, defaultValue: "pcs" },

  certificateDocumentId: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT },
});

// ═══════════════════════════════════════════════════════════════
// DHR Process Step — production step records
// ═══════════════════════════════════════════════════════════════

const DhrProcessStep = sequelize.define("dhr_process_step", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  dhrId: { type: DataTypes.INTEGER, allowNull: false },

  stepOrder: { type: DataTypes.INTEGER, allowNull: false },
  stepName: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT },

  operatorId: { type: DataTypes.INTEGER },
  startedAt: { type: DataTypes.DATE },
  completedAt: { type: DataTypes.DATE },

  equipmentId: { type: DataTypes.INTEGER },

  result: {
    type: DataTypes.ENUM("PENDING", "PASS", "FAIL", "REWORK", "N_A"),
    defaultValue: "PENDING",
  },

  measurements: { type: DataTypes.JSONB },

  linkedNcId: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT },
});

// Associations are set up in index.js → setupAssociations()

module.exports = { DeviceHistoryRecord, DhrMaterialTrace, DhrProcessStep };
