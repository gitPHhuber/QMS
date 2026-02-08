

const { DataTypes } = require("sequelize");
const sequelize = require("../db");


const OUTPUT_STATUSES = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    ADJUSTED: 'adjusted'
};


const OperationType = sequelize.define("operation_type", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },

    code: {
        type: DataTypes.STRING(50),
        allowNull: true
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'шт'
    },


    normMinutes: {
        type: DataTypes.FLOAT,
        allowNull: true
    },


    sectionId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },

    sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: "operation_types",
    timestamps: true,
    indexes: [
        { unique: true, fields: ["code"], where: { code: { [require("sequelize").Op.ne]: null } } }
    ]
});


const ProductionOutput = sequelize.define("production_output", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },


    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },


    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },


    teamId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    sectionId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },


    projectId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    taskId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    operationTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },


    claimedQty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },

    approvedQty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },

    rejectedQty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },


    status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: OUTPUT_STATUSES.PENDING
    },


    approvedById: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    approvedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },


    createdById: {
        type: DataTypes.INTEGER,
        allowNull: true
    },


    comment: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    rejectReason: {
        type: DataTypes.TEXT,
        allowNull: true
    }

}, {
    tableName: "production_outputs",
    timestamps: true,
    indexes: [
        { fields: ["userId", "date"] },
        { fields: ["date"] },
        { fields: ["status"] },
        { fields: ["projectId"] },
        { fields: ["taskId"] },
        { fields: ["teamId"] },
        { fields: ["sectionId"] },
        { fields: ["operationTypeId"] }
    ]
});

module.exports = {
    ProductionOutput,
    OperationType,
    OUTPUT_STATUSES
};
