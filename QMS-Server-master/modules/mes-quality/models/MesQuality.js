const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Acceptance Test Template — reusable test plan definitions
// ═══════════════════════════════════════════════════════════════

const AcceptanceTestTemplate = sequelize.define("acceptance_test_template", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  templateCode: {
    type: DataTypes.STRING(30),
    unique: true,
    allowNull: false,
  },

  name: { type: DataTypes.STRING(300), allowNull: false },
  description: { type: DataTypes.TEXT },

  productId: { type: DataTypes.INTEGER, allowNull: true },
  dmrId: { type: DataTypes.INTEGER, allowNull: true },

  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  version: { type: DataTypes.STRING(20), defaultValue: "1.0" },

  testItems: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: "[{order,name,type,criteria,lowerLimit,upperLimit,unit,isCritical}]",
  },

  createdById: { type: DataTypes.INTEGER, allowNull: false },
});

// ═══════════════════════════════════════════════════════════════
// Acceptance Test (PSI) — product/device acceptance inspection
// ═══════════════════════════════════════════════════════════════

const AcceptanceTest = sequelize.define("acceptance_test", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  testNumber: {
    type: DataTypes.STRING(30),
    unique: true,
    allowNull: false,
    comment: "PSI-YYYY-NNN",
  },

  unitId: { type: DataTypes.INTEGER, allowNull: true },
  workOrderId: { type: DataTypes.INTEGER, allowNull: true },
  dhrId: { type: DataTypes.INTEGER, allowNull: true },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  templateId: { type: DataTypes.INTEGER, allowNull: true },

  serialNumber: { type: DataTypes.STRING, allowNull: true },
  lotNumber: { type: DataTypes.STRING, allowNull: true },
  batchSize: { type: DataTypes.INTEGER, allowNull: true },

  status: {
    type: DataTypes.ENUM("DRAFT", "SUBMITTED", "IN_TESTING", "PASSED", "FAILED", "CONDITIONAL"),
    defaultValue: "DRAFT",
  },

  submittedById: { type: DataTypes.INTEGER, allowNull: true },
  submittedAt: { type: DataTypes.DATE, allowNull: true },

  testerId: { type: DataTypes.INTEGER, allowNull: true },
  startedAt: { type: DataTypes.DATE, allowNull: true },

  completedAt: { type: DataTypes.DATE, allowNull: true },

  decisionById: { type: DataTypes.INTEGER, allowNull: true },
  decisionAt: { type: DataTypes.DATE, allowNull: true },
  decisionNotes: { type: DataTypes.TEXT },

  isRetest: { type: DataTypes.BOOLEAN, defaultValue: false },
  originalTestId: { type: DataTypes.INTEGER, allowNull: true },
  retestReason: { type: DataTypes.TEXT },

  ncId: { type: DataTypes.INTEGER, allowNull: true },

  certificateGeneratedAt: { type: DataTypes.DATE, allowNull: true },

  notes: { type: DataTypes.TEXT },
});

// ═══════════════════════════════════════════════════════════════
// Acceptance Test Item — individual test line items
// ═══════════════════════════════════════════════════════════════

const AcceptanceTestItem = sequelize.define("acceptance_test_item", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  testId: { type: DataTypes.INTEGER, allowNull: false },
  itemOrder: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(300), allowNull: false },

  testType: {
    type: DataTypes.ENUM("VISUAL", "DIMENSIONAL", "FUNCTIONAL", "ELECTRICAL", "SAFETY", "LABELING", "PACKAGING", "OTHER"),
    allowNull: false,
  },

  criteria: { type: DataTypes.TEXT, allowNull: false },

  lowerLimit: { type: DataTypes.FLOAT, allowNull: true },
  upperLimit: { type: DataTypes.FLOAT, allowNull: true },
  nominalValue: { type: DataTypes.FLOAT, allowNull: true },
  unit: { type: DataTypes.STRING(30), allowNull: true },

  actualValue: { type: DataTypes.STRING(200), allowNull: true },
  numericValue: { type: DataTypes.FLOAT, allowNull: true },

  result: {
    type: DataTypes.ENUM("PASS", "FAIL", "N_A", "PENDING"),
    defaultValue: "PENDING",
  },

  isCritical: { type: DataTypes.BOOLEAN, defaultValue: false },

  equipmentId: { type: DataTypes.INTEGER, allowNull: true },
  testedById: { type: DataTypes.INTEGER, allowNull: true },
  testedAt: { type: DataTypes.DATE, allowNull: true },

  notes: { type: DataTypes.TEXT },
});

// Associations are set up in index.js -> setupAssociations()

module.exports = { AcceptanceTestTemplate, AcceptanceTest, AcceptanceTestItem };
