"use strict";

/**
 * MES Module — Work Order Units, Materials & Readiness Checks
 *
 * Tables:
 *   - work_order_units
 *   - work_order_materials
 *   - work_order_readiness_checks
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      const has = async (name) => {
        const r = await queryInterface.sequelize.query(
          `SELECT to_regclass('public.${name}') AS t`,
          { type: Sequelize.QueryTypes.SELECT, transaction: t }
        );
        return !!r?.[0]?.t;
      };

      // ═══ work_order_units ═══
      if (!(await has("work_order_units"))) {
        await queryInterface.createTable(
          "work_order_units",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            workOrderId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "production_tasks", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "CASCADE",
            },
            serialNumber: { type: Sequelize.STRING(100), allowNull: false, unique: true },
            status: {
              type: Sequelize.ENUM("CREATED", "IN_PROGRESS", "QC_PENDING", "QC_PASSED", "QC_FAILED", "ON_HOLD", "REWORK", "SCRAPPED", "RELEASED"),
              allowNull: false,
              defaultValue: "CREATED",
            },
            currentStepId: { type: Sequelize.INTEGER, allowNull: true },
            dhrId: { type: Sequelize.INTEGER, allowNull: true },
            startedAt: { type: Sequelize.DATE, allowNull: true },
            completedAt: { type: Sequelize.DATE, allowNull: true },
            holdReason: { type: Sequelize.TEXT, allowNull: true },
            ncId: { type: Sequelize.INTEGER, allowNull: true },
            notes: { type: Sequelize.TEXT, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
        console.log("  created work_order_units");
      }

      // ═══ work_order_materials ═══
      if (!(await has("work_order_materials"))) {
        await queryInterface.createTable(
          "work_order_materials",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            workOrderId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "production_tasks", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "CASCADE",
            },
            bomItemId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "bom_items", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
            },
            requiredQty: { type: Sequelize.FLOAT, allowNull: false },
            allocatedQty: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
            consumedQty: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
            unit: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "шт" },
            warehouseBoxId: { type: Sequelize.INTEGER, allowNull: true },
            lotNumber: { type: Sequelize.STRING, allowNull: true },
            status: {
              type: Sequelize.ENUM("PENDING", "ALLOCATED", "ISSUED", "CONSUMED", "RETURNED"),
              allowNull: false,
              defaultValue: "PENDING",
            },
            issuedById: { type: Sequelize.INTEGER, allowNull: true },
            issuedAt: { type: Sequelize.DATE, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
        console.log("  created work_order_materials");
      }

      // ═══ work_order_readiness_checks ═══
      if (!(await has("work_order_readiness_checks"))) {
        await queryInterface.createTable(
          "work_order_readiness_checks",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            workOrderId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "production_tasks", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "CASCADE",
            },
            checkType: {
              type: Sequelize.ENUM("MATERIALS", "EQUIPMENT", "TRAINING", "DOCUMENTS", "FULL"),
              allowNull: false,
            },
            result: {
              type: Sequelize.ENUM("READY", "NOT_READY", "PARTIAL"),
              allowNull: false,
            },
            details: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
            performedById: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "users", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
            },
            performedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
        console.log("  created work_order_readiness_checks");
      }

      // ═══ INDEXES ═══
      await queryInterface.addIndex("work_order_units", ["workOrderId"], { name: "idx_wou_work_order_id", transaction: t });
      await queryInterface.addIndex("work_order_units", ["serialNumber"], { name: "idx_wou_serial_number", unique: true, transaction: t });
      await queryInterface.addIndex("work_order_units", ["status"], { name: "idx_wou_status", transaction: t });
      await queryInterface.addIndex("work_order_materials", ["workOrderId"], { name: "idx_wom_work_order_id", transaction: t });

      await t.commit();
      console.log("✅ [MES-ORDERS] Work order tables created");
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("work_order_readiness_checks", { transaction: t, cascade: true }).catch(() => {});
      await queryInterface.dropTable("work_order_materials", { transaction: t, cascade: true }).catch(() => {});
      await queryInterface.dropTable("work_order_units", { transaction: t, cascade: true }).catch(() => {});
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },
};
