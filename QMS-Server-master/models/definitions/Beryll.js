

const sequelize = require("../../db");
const { DataTypes } = require("sequelize");


const SERVER_STATUSES = {
  NEW: "NEW",
  IN_WORK: "IN_WORK",
  CLARIFYING: "CLARIFYING",
  DEFECT: "DEFECT",
  DONE: "DONE",
  ARCHIVED: "ARCHIVED"
};

const BATCH_STATUSES = {
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
};

const HISTORY_ACTIONS = {
  CREATED: "CREATED",
  TAKEN: "TAKEN",
  RELEASED: "RELEASED",
  STATUS_CHANGED: "STATUS_CHANGED",
  NOTE_ADDED: "NOTE_ADDED",
  CHECKLIST_COMPLETED: "CHECKLIST_COMPLETED",
  BATCH_ASSIGNED: "BATCH_ASSIGNED",
  BATCH_REMOVED: "BATCH_REMOVED",
  DELETED: "DELETED",
  ARCHIVED: "ARCHIVED",
  FILE_UPLOADED: "FILE_UPLOADED",
  SERIAL_ASSIGNED: "SERIAL_ASSIGNED",
  COMPONENTS_FETCHED: "COMPONENTS_FETCHED"
};

const CHECKLIST_GROUPS = {
  PREPARATION: "PREPARATION",
  ASSEMBLY: "ASSEMBLY",
  TESTING: "TESTING",
  BURN_IN: "BURN_IN",
  FINAL: "FINAL"
};


const DEFECT_CATEGORIES = {
  HARDWARE: "HARDWARE",
  SOFTWARE: "SOFTWARE",
  ASSEMBLY: "ASSEMBLY",
  COMPONENT: "COMPONENT",
  OTHER: "OTHER"
};

const DEFECT_PRIORITIES = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL"
};

const DEFECT_STATUSES = {
  NEW: "NEW",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  WONT_FIX: "WONT_FIX"
};


const COMPONENT_TYPES = {
  CPU: "CPU",
  RAM: "RAM",
  HDD: "HDD",
  SSD: "SSD",
  NVME: "NVME",
  MOTHERBOARD: "MOTHERBOARD",
  GPU: "GPU",
  NIC: "NIC",
  RAID: "RAID",
  PSU: "PSU",
  FAN: "FAN",
  MEMORY_MODULE: "MEMORY_MODULE",
  BACKPLANE: "BACKPLANE",
  BMC: "BMC",
  OTHER: "OTHER"
};


const COMPONENT_STATUSES = {
  OK: "OK",
  WARNING: "WARNING",
  CRITICAL: "CRITICAL",
  UNKNOWN: "UNKNOWN",
  NOT_PRESENT: "NOT_PRESENT",
  REPLACED: "REPLACED"
};


const RACK_STATUSES = {
  ACTIVE: "ACTIVE",
  MAINTENANCE: "MAINTENANCE",
  DECOMMISSIONED: "DECOMMISSIONED"
};


const BeryllBatch = sequelize.define("BeryllBatch", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  supplier: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  deliveryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM(...Object.values(BATCH_STATUSES)),
    allowNull: false,
    defaultValue: BATCH_STATUSES.ACTIVE
  },
  expectedCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: "beryll_batches",
  timestamps: true
});


const BeryllServer = sequelize.define("BeryllServer", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },


  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },


  macAddress: {
    type: DataTypes.STRING(17),
    allowNull: true
  },


  hostname: {
    type: DataTypes.STRING(255),
    allowNull: true
  },


  serialNumber: {
    type: DataTypes.STRING(100),
    allowNull: true
  },


  apkSerialNumber: {
    type: DataTypes.STRING(50),
    allowNull: true
  },


  bmcAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },


  status: {
    type: DataTypes.ENUM(...Object.values(SERVER_STATUSES)),
    allowNull: false,
    defaultValue: SERVER_STATUSES.NEW
  },


  batchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "beryll_batches",
      key: "id"
    }
  },


  assignedToId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },


  assignedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },


  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },


  leaseStart: {
    type: DataTypes.DATE,
    allowNull: true
  },


  leaseEnd: {
    type: DataTypes.DATE,
    allowNull: true
  },


  leaseActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },


  lastSyncAt: {
    type: DataTypes.DATE,
    allowNull: true
  },


  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },


  archivedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },


  archivedById: {
    type: DataTypes.INTEGER,
    allowNull: true
  },


  burnInStartAt: {
    type: DataTypes.DATE,
    allowNull: true
  },


  burnInEndAt: {
    type: DataTypes.DATE,
    allowNull: true
  },


  lastPingAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  pingStatus: {
    type: DataTypes.ENUM("ONLINE", "OFFLINE", "UNKNOWN"),
    allowNull: true,
    defaultValue: "UNKNOWN"
  },

  pingLatency: {
    type: DataTypes.FLOAT,
    allowNull: true
  },


  lastComponentsFetchAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: "beryll_servers",
  timestamps: true
});


const BeryllHistory = sequelize.define("BeryllHistory", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  serverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "beryll_servers",
      key: "id"
    }
  },
  serverIp: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  serverHostname: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  action: {
    type: DataTypes.ENUM(...Object.values(HISTORY_ACTIONS)),
    allowNull: false
  },
  fromStatus: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  toStatus: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  checklistItemId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: "beryll_history",
  timestamps: true,
  updatedAt: false
});


const BeryllChecklistTemplate = sequelize.define("BeryllChecklistTemplate", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  groupCode: {
    type: DataTypes.ENUM(...Object.values(CHECKLIST_GROUPS)),
    allowNull: false,
    defaultValue: CHECKLIST_GROUPS.TESTING
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fileCode: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  requiresFile: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  estimatedMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: "beryll_checklist_templates",
  timestamps: true
});


const BeryllServerChecklist = sequelize.define("BeryllServerChecklist", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  serverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "beryll_servers",
      key: "id"
    }
  },
  checklistTemplateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "beryll_checklist_templates",
      key: "id"
    }
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completedById: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "beryll_server_checklists",
  timestamps: true,
  indexes: [
    { unique: true, fields: ["serverId", "checklistTemplateId"] }
  ]
});


const BeryllChecklistFile = sequelize.define("BeryllChecklistFile", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  serverChecklistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "beryll_server_checklists",
      key: "id"
    }
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  uploadedById: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: "beryll_checklist_files",
  timestamps: true
});


const BeryllDefectComment = sequelize.define("BeryllDefectComment", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  serverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "beryll_servers",
      key: "id"
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  defectCategory: {
    type: DataTypes.ENUM(...Object.values(DEFECT_CATEGORIES)),
    allowNull: true,
    defaultValue: DEFECT_CATEGORIES.OTHER
  },
  priority: {
    type: DataTypes.ENUM(...Object.values(DEFECT_PRIORITIES)),
    allowNull: true,
    defaultValue: DEFECT_PRIORITIES.MEDIUM
  },
  status: {
    type: DataTypes.ENUM(...Object.values(DEFECT_STATUSES)),
    allowNull: false,
    defaultValue: DEFECT_STATUSES.NEW
  },
  resolvedById: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolution: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "beryll_defect_comments",
  timestamps: true
});


const BeryllDefectFile = sequelize.define("BeryllDefectFile", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  commentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "beryll_defect_comments",
      key: "id"
    }
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  uploadedById: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: "beryll_defect_files",
  timestamps: true
});


const BeryllServerComponent = sequelize.define("BeryllServerComponent", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },


  serverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "beryll_servers",
      key: "id"
    }
  },


  componentType: {
    type: DataTypes.ENUM(...Object.values(COMPONENT_TYPES)),
    allowNull: false
  },


  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },


  manufacturer: {
    type: DataTypes.STRING(255),
    allowNull: true
  },


  model: {
    type: DataTypes.STRING(255),
    allowNull: true
  },


  serialNumber: {
    type: DataTypes.STRING(100),
    allowNull: true
  },


  serialNumberYadro: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: "Серийный номер в системе Ядро (внутренний)"
  },


  partNumber: {
    type: DataTypes.STRING(100),
    allowNull: true
  },


  firmwareVersion: {
    type: DataTypes.STRING(100),
    allowNull: true
  },


  status: {
    type: DataTypes.ENUM(...Object.values(COMPONENT_STATUSES)),
    allowNull: false,
    defaultValue: COMPONENT_STATUSES.UNKNOWN
  },


  slot: {
    type: DataTypes.STRING(50),
    allowNull: true
  },


  capacity: {
    type: DataTypes.BIGINT,
    allowNull: true
  },


  speed: {
    type: DataTypes.INTEGER,
    allowNull: true
  },


  temperature: {
    type: DataTypes.FLOAT,
    allowNull: true
  },


  healthPercent: {
    type: DataTypes.INTEGER,
    allowNull: true
  },


  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },


  dataSource: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: "MANUAL"
  },


  lastUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },


  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },


  catalogId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },


  inventoryId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },


  installedById: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: "beryll_server_components",
  timestamps: true,
  indexes: [
    { fields: ["serverId"] },
    { fields: ["componentType"] },
    { fields: ["status"] },
    { fields: ["serialNumberYadro"] },
    { fields: ["serverId", "componentType", "slot"], unique: true }
  ]
});


const BeryllRack = sequelize.define("BeryllRack", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  totalUnits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 42
  },
  networkSubnet: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  gateway: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM(...Object.values(RACK_STATUSES)),
    allowNull: false,
    defaultValue: RACK_STATUSES.ACTIVE
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: "beryll_racks",
  timestamps: true
});


const BeryllRackUnit = sequelize.define("BeryllRackUnit", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rackId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "beryll_racks",
      key: "id"
    }
  },
  serverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "beryll_servers",
      key: "id"
    }
  },
  unitNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  hostname: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  mgmtMacAddress: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  mgmtIpAddress: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  dataMacAddress: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dataIpAddress: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  accessLogin: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  accessPassword: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  installedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  installedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "users",
      key: "id"
    }
  },


  placedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "users",
      key: "id"
    }
  },

  placedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },


  dhcpIpAddress: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  dhcpMacAddress: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  dhcpHostname: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  dhcpLeaseActive: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  dhcpLastSync: {
    type: DataTypes.DATE,
    allowNull: true
  }

}, {
  tableName: "beryll_rack_units",
  timestamps: true,
  indexes: [
    { fields: ["rackId", "unitNumber"], unique: true },
    { fields: ["serverId"] },
    { fields: ["installedById"] },
    { fields: ["placedById"] },
    { fields: ["dhcpIpAddress"] },
    { fields: ["dhcpMacAddress"] }
  ]
});


const BeryllExtendedHistory = sequelize.define("BeryllExtendedHistory", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  changes: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: "beryll_extended_history",
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ["entityType", "entityId"] },
    { fields: ["userId"] }
  ]
});


const setupAssociations = (User) => {

  BeryllBatch.belongsTo(User, { as: "createdBy", foreignKey: "createdById" });


  BeryllServer.belongsTo(BeryllBatch, { as: "batch", foreignKey: "batchId" });
  BeryllBatch.hasMany(BeryllServer, { as: "servers", foreignKey: "batchId" });


  BeryllServer.belongsTo(User, { as: "assignedTo", foreignKey: "assignedToId" });


  BeryllServer.belongsTo(User, { as: "archivedBy", foreignKey: "archivedById" });


  BeryllServer.hasMany(BeryllHistory, { as: "history", foreignKey: "serverId" });
  BeryllHistory.belongsTo(BeryllServer, { as: "server", foreignKey: "serverId" });


  BeryllHistory.belongsTo(User, { as: "user", foreignKey: "userId" });


  BeryllServer.hasMany(BeryllServerChecklist, { as: "checklists", foreignKey: "serverId" });
  BeryllServerChecklist.belongsTo(BeryllServer, { as: "server", foreignKey: "serverId" });


  BeryllServerChecklist.belongsTo(BeryllChecklistTemplate, { as: "template", foreignKey: "checklistTemplateId" });
  BeryllChecklistTemplate.hasMany(BeryllServerChecklist, { as: "serverChecklists", foreignKey: "checklistTemplateId" });


  BeryllServerChecklist.belongsTo(User, { as: "completedBy", foreignKey: "completedById" });


  BeryllServerChecklist.hasMany(BeryllChecklistFile, { as: "files", foreignKey: "serverChecklistId" });
  BeryllChecklistFile.belongsTo(BeryllServerChecklist, { as: "checklist", foreignKey: "serverChecklistId" });


  BeryllChecklistFile.belongsTo(User, { as: "uploadedBy", foreignKey: "uploadedById" });


  BeryllDefectComment.belongsTo(BeryllServer, { as: "server", foreignKey: "serverId" });
  BeryllServer.hasMany(BeryllDefectComment, { as: "defectComments", foreignKey: "serverId" });
  BeryllDefectComment.belongsTo(User, { as: "author", foreignKey: "userId" });
  BeryllDefectComment.belongsTo(User, { as: "resolvedBy", foreignKey: "resolvedById" });
  BeryllDefectComment.hasMany(BeryllDefectFile, { as: "files", foreignKey: "commentId", onDelete: "CASCADE" });
  BeryllDefectFile.belongsTo(BeryllDefectComment, { as: "comment", foreignKey: "commentId" });
  BeryllDefectFile.belongsTo(User, { as: "uploadedBy", foreignKey: "uploadedById" });


  BeryllServer.hasMany(BeryllServerComponent, { as: "components", foreignKey: "serverId", onDelete: "CASCADE" });
  BeryllServerComponent.belongsTo(BeryllServer, { as: "server", foreignKey: "serverId" });


  BeryllRack.hasMany(BeryllRackUnit, { as: "units", foreignKey: "rackId", onDelete: "CASCADE" });
  BeryllRackUnit.belongsTo(BeryllRack, { as: "rack", foreignKey: "rackId" });


  BeryllRackUnit.belongsTo(BeryllServer, { as: "server", foreignKey: "serverId" });
  BeryllServer.hasOne(BeryllRackUnit, { as: "rackUnit", foreignKey: "serverId" });


  BeryllRackUnit.belongsTo(User, { as: "installedBy", foreignKey: "installedById" });


  BeryllRackUnit.belongsTo(User, { as: "placedBy", foreignKey: "placedById" });


  BeryllExtendedHistory.belongsTo(User, { as: "user", foreignKey: "userId" });
};


module.exports = {

  BeryllServer,
  BeryllBatch,
  BeryllHistory,
  BeryllChecklistTemplate,
  BeryllServerChecklist,
  BeryllChecklistFile,
  BeryllDefectComment,
  BeryllDefectFile,
  BeryllServerComponent,
  BeryllRack,
  BeryllRackUnit,
  BeryllExtendedHistory,


  SERVER_STATUSES,
  BATCH_STATUSES,
  HISTORY_ACTIONS,
  CHECKLIST_GROUPS,
  RACK_STATUSES,


  DEFECT_CATEGORIES,
  DEFECT_PRIORITIES,
  DEFECT_STATUSES,


  COMPONENT_TYPES,
  COMPONENT_STATUSES,


  setupAssociations
};
