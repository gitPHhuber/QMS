const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");


const Supply = sequelize.define("supply", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  supplier: { type: DataTypes.STRING, allowNull: true },
  docNumber: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: "NEW" },
  comment: { type: DataTypes.TEXT, allowNull: true },
  expectedDate: { type: DataTypes.DATEONLY, allowNull: true },
  receivedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});


const WarehouseBox = sequelize.define("warehouse_box", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  supplyId: { type: DataTypes.INTEGER, allowNull: true },


  qrCode: { type: DataTypes.STRING, unique: true, allowNull: false },
  shortCode: { type: DataTypes.STRING, unique: true, allowNull: true },


  label: { type: DataTypes.STRING, allowNull: false },


  originType: { type: DataTypes.STRING, allowNull: true },
  originId: { type: DataTypes.INTEGER, allowNull: true },


  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  unit: { type: DataTypes.STRING, allowNull: false, defaultValue: "шт" },


  parentBoxId: { type: DataTypes.INTEGER, allowNull: true },


  kitNumber: { type: DataTypes.STRING, allowNull: true },
  projectName: { type: DataTypes.STRING, allowNull: true },
  batchName: { type: DataTypes.STRING, allowNull: true },


  status: { type: DataTypes.STRING, allowNull: false, defaultValue: "ON_STOCK" },
  notes: { type: DataTypes.TEXT, allowNull: true },


  currentSectionId: { type: DataTypes.INTEGER, allowNull: true },
  currentTeamId: { type: DataTypes.INTEGER, allowNull: true },

  acceptedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  acceptedById: { type: DataTypes.INTEGER, allowNull: false },
});


const WarehouseMovement = sequelize.define("warehouse_movement", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  boxId: { type: DataTypes.INTEGER, allowNull: false },
  documentId: { type: DataTypes.INTEGER, allowNull: true },

  fromSectionId: { type: DataTypes.INTEGER, allowNull: true },
  fromTeamId: { type: DataTypes.INTEGER, allowNull: true },
  toSectionId: { type: DataTypes.INTEGER, allowNull: true },
  toTeamId: { type: DataTypes.INTEGER, allowNull: true },

  operation: { type: DataTypes.STRING, allowNull: false },
  statusAfter: { type: DataTypes.STRING, allowNull: true },

  deltaQty: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  goodQty: { type: DataTypes.INTEGER, allowNull: true },
  scrapQty: { type: DataTypes.INTEGER, allowNull: true },

  performedById: { type: DataTypes.INTEGER, allowNull: false },
  performedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  comment: { type: DataTypes.TEXT, allowNull: true },
});


const WarehouseDocument = sequelize.define("warehouse_document", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  boxId: { type: DataTypes.INTEGER, allowNull: true },
  number: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: true },
  date: { type: DataTypes.DATEONLY, allowNull: true },
  fileUrl: { type: DataTypes.STRING, allowNull: true },
  comment: { type: DataTypes.TEXT, allowNull: true },
  createdById: { type: DataTypes.INTEGER, allowNull: false },
});


const InventoryLimit = sequelize.define("inventory_limit", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  originType: { type: DataTypes.STRING, allowNull: true },
  originId: { type: DataTypes.INTEGER, allowNull: true },
  label: { type: DataTypes.STRING, allowNull: true },
  minQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
});


const ProductionTask = sequelize.define("production_task", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  title: { type: DataTypes.STRING, allowNull: false },


  originType: { type: DataTypes.STRING, allowNull: true },
  originId: { type: DataTypes.INTEGER, allowNull: true },

  targetQty: { type: DataTypes.INTEGER, allowNull: false },
  unit: { type: DataTypes.STRING, allowNull: false, defaultValue: "шт" },

  dueDate: { type: DataTypes.DATEONLY, allowNull: true },

  status: { type: DataTypes.STRING, allowNull: false, defaultValue: "NEW" },
  priority: { type: DataTypes.INTEGER, allowNull: true },

  comment: { type: DataTypes.TEXT, allowNull: true },

  createdById: { type: DataTypes.INTEGER, allowNull: false },


  responsibleId: { type: DataTypes.INTEGER, allowNull: true },
  sectionId: { type: DataTypes.INTEGER, allowNull: true },
  projectId: { type: DataTypes.INTEGER, allowNull: true },
  epicId: { type: DataTypes.INTEGER, allowNull: true },
});


const PrintHistory = sequelize.define("print_history", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  template: { type: DataTypes.STRING, allowNull: false },

  labelName: { type: DataTypes.STRING },
  startCode: { type: DataTypes.STRING },
  endCode: { type: DataTypes.STRING },

  quantity: { type: DataTypes.INTEGER },


  params: { type: DataTypes.JSONB },

  createdById: { type: DataTypes.INTEGER, allowNull: true },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = {
  Supply,
  WarehouseBox,
  WarehouseMovement,
  WarehouseDocument,
  InventoryLimit,
  ProductionTask,
  PrintHistory
};
