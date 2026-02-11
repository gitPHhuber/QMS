"use strict";

/**
 * Create missing tables for WMS and Production modules:
 *
 *   - production_outputs  (ProductionOutput model)
 *   - supplies            (Supply model)
 *   - warehouse_boxes     (WarehouseBox model)
 *   - warehouse_movements (WarehouseMovement model)
 *   - warehouse_documents (WarehouseDocument model)
 *   - inventory_limits    (InventoryLimit model)
 *   - production_tasks    (ProductionTask model)
 *   - print_histories     (PrintHistory model)
 *
 * No previous migration covered these tables.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const has = async (name) => {
      const r = await queryInterface.sequelize.query(
        `SELECT to_regclass('public.${name}') AS t`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      return !!r?.[0]?.t;
    };

    // ═══ production_outputs ═══
    if (!(await has("production_outputs"))) {
      await queryInterface.createTable("production_outputs", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        date: { type: Sequelize.DATEONLY, allowNull: false },
        approvedQty: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        status: { type: Sequelize.STRING(50), allowNull: false, defaultValue: "DRAFT" },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
        },
        projectId: { type: Sequelize.INTEGER, allowNull: true },
        comment: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created production_outputs");
    }

    // ═══ supplies ═══
    if (!(await has("supplies"))) {
      await queryInterface.createTable("supplies", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        supplier: { type: Sequelize.STRING(255), allowNull: true },
        docNumber: { type: Sequelize.STRING(255), allowNull: true },
        status: { type: Sequelize.STRING(50), allowNull: false, defaultValue: "NEW" },
        comment: { type: Sequelize.TEXT, allowNull: true },
        expectedDate: { type: Sequelize.DATEONLY, allowNull: true },
        receivedAt: { type: Sequelize.DATE, allowNull: true, defaultValue: Sequelize.fn("NOW") },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created supplies");
    }

    // ═══ warehouse_boxes ═══
    if (!(await has("warehouse_boxes"))) {
      await queryInterface.createTable("warehouse_boxes", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        supplyId: { type: Sequelize.INTEGER, allowNull: true },
        qrCode: { type: Sequelize.STRING(255), allowNull: false, unique: true },
        shortCode: { type: Sequelize.STRING(255), allowNull: true, unique: true },
        label: { type: Sequelize.STRING(255), allowNull: false },
        originType: { type: Sequelize.STRING(255), allowNull: true },
        originId: { type: Sequelize.INTEGER, allowNull: true },
        quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        unit: { type: Sequelize.STRING(50), allowNull: false, defaultValue: "шт" },
        parentBoxId: { type: Sequelize.INTEGER, allowNull: true },
        kitNumber: { type: Sequelize.STRING(255), allowNull: true },
        projectName: { type: Sequelize.STRING(255), allowNull: true },
        batchName: { type: Sequelize.STRING(255), allowNull: true },
        status: { type: Sequelize.STRING(50), allowNull: false, defaultValue: "ON_STOCK" },
        notes: { type: Sequelize.TEXT, allowNull: true },
        currentSectionId: { type: Sequelize.INTEGER, allowNull: true },
        currentTeamId: { type: Sequelize.INTEGER, allowNull: true },
        acceptedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        acceptedById: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created warehouse_boxes");
    }

    // ═══ warehouse_movements ═══
    if (!(await has("warehouse_movements"))) {
      await queryInterface.createTable("warehouse_movements", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        boxId: { type: Sequelize.INTEGER, allowNull: false },
        documentId: { type: Sequelize.INTEGER, allowNull: true },
        fromSectionId: { type: Sequelize.INTEGER, allowNull: true },
        fromTeamId: { type: Sequelize.INTEGER, allowNull: true },
        toSectionId: { type: Sequelize.INTEGER, allowNull: true },
        toTeamId: { type: Sequelize.INTEGER, allowNull: true },
        operation: { type: Sequelize.STRING(255), allowNull: false },
        statusAfter: { type: Sequelize.STRING(50), allowNull: true },
        deltaQty: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
        goodQty: { type: Sequelize.INTEGER, allowNull: true },
        scrapQty: { type: Sequelize.INTEGER, allowNull: true },
        performedById: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
        },
        performedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        comment: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created warehouse_movements");
    }

    // ═══ warehouse_documents ═══
    if (!(await has("warehouse_documents"))) {
      await queryInterface.createTable("warehouse_documents", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        boxId: { type: Sequelize.INTEGER, allowNull: true },
        number: { type: Sequelize.STRING(255), allowNull: false },
        type: { type: Sequelize.STRING(100), allowNull: true },
        date: { type: Sequelize.DATEONLY, allowNull: true },
        fileUrl: { type: Sequelize.STRING(1000), allowNull: true },
        comment: { type: Sequelize.TEXT, allowNull: true },
        createdById: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created warehouse_documents");
    }

    // ═══ inventory_limits ═══
    if (!(await has("inventory_limits"))) {
      await queryInterface.createTable("inventory_limits", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        originType: { type: Sequelize.STRING(255), allowNull: true },
        originId: { type: Sequelize.INTEGER, allowNull: true },
        label: { type: Sequelize.STRING(255), allowNull: true },
        minQuantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created inventory_limits");
    }

    // ═══ production_tasks ═══
    if (!(await has("production_tasks"))) {
      await queryInterface.createTable("production_tasks", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        title: { type: Sequelize.STRING(255), allowNull: false },
        originType: { type: Sequelize.STRING(255), allowNull: true },
        originId: { type: Sequelize.INTEGER, allowNull: true },
        targetQty: { type: Sequelize.INTEGER, allowNull: false },
        unit: { type: Sequelize.STRING(50), allowNull: false, defaultValue: "шт" },
        dueDate: { type: Sequelize.DATEONLY, allowNull: true },
        status: { type: Sequelize.STRING(50), allowNull: false, defaultValue: "NEW" },
        priority: { type: Sequelize.INTEGER, allowNull: true },
        comment: { type: Sequelize.TEXT, allowNull: true },
        createdById: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
        },
        responsibleId: { type: Sequelize.INTEGER, allowNull: true },
        sectionId: { type: Sequelize.INTEGER, allowNull: true },
        projectId: { type: Sequelize.INTEGER, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created production_tasks");
    }

    // ═══ print_histories ═══
    if (!(await has("print_histories"))) {
      await queryInterface.createTable("print_histories", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        template: { type: Sequelize.STRING(255), allowNull: false },
        labelName: { type: Sequelize.STRING(255), allowNull: true },
        startCode: { type: Sequelize.STRING(255), allowNull: true },
        endCode: { type: Sequelize.STRING(255), allowNull: true },
        quantity: { type: Sequelize.INTEGER, allowNull: true },
        params: { type: Sequelize.JSONB, allowNull: true },
        createdById: { type: Sequelize.INTEGER, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created print_histories");
    }

    console.log("✅ [create-warehouse-tables] All warehouse/production tables created");
  },

  async down(queryInterface) {
    const tables = [
      "print_histories",
      "production_tasks",
      "inventory_limits",
      "warehouse_documents",
      "warehouse_movements",
      "warehouse_boxes",
      "supplies",
      "production_outputs",
    ];
    for (const t of tables) {
      await queryInterface.dropTable(t, { cascade: true }).catch(() => {});
    }
  },
};
