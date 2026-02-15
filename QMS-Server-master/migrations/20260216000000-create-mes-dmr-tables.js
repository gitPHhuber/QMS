"use strict";

/**
 * MES Module — Device Master Records (DMR), BOM, Process Routes
 *
 * Tables:
 *   - device_master_records
 *   - bom_items
 *   - process_routes
 *   - process_route_steps
 *   - step_checklists
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

      // ═══ device_master_records ═══
      if (!(await has("device_master_records"))) {
        await queryInterface.createTable(
          "device_master_records",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            dmrNumber: { type: Sequelize.STRING(30), allowNull: false, unique: true },
            productId: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: "products", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "SET NULL",
            },
            version: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "1.0" },
            title: { type: Sequelize.STRING(500), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            status: {
              type: Sequelize.ENUM("DRAFT", "REVIEW", "APPROVED", "OBSOLETE"),
              allowNull: false,
              defaultValue: "DRAFT",
            },
            previousVersionId: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: "device_master_records", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "SET NULL",
            },
            changeRequestId: { type: Sequelize.INTEGER, allowNull: true },
            approvedById: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: "users", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "SET NULL",
            },
            approvedAt: { type: Sequelize.DATE, allowNull: true },
            effectiveDate: { type: Sequelize.DATEONLY, allowNull: true },
            createdById: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "users", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
            },
            notes: { type: Sequelize.TEXT, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
        console.log("  created device_master_records");
      }

      // ═══ bom_items ═══
      if (!(await has("bom_items"))) {
        await queryInterface.createTable(
          "bom_items",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            dmrId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "device_master_records", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "CASCADE",
            },
            itemNumber: { type: Sequelize.INTEGER, allowNull: false },
            partNumber: { type: Sequelize.STRING, allowNull: false },
            description: { type: Sequelize.STRING(500), allowNull: false },
            category: {
              type: Sequelize.ENUM("COMPONENT", "RAW_MATERIAL", "SUBASSEMBLY", "PACKAGING", "LABEL", "CONSUMABLE"),
              allowNull: false,
            },
            quantityPer: { type: Sequelize.FLOAT, allowNull: false },
            unit: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "шт" },
            requiresLotTracking: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            requiresSerialTracking: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            approvedSupplierId: { type: Sequelize.INTEGER, allowNull: true },
            alternatePartNumbers: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            specifications: { type: Sequelize.TEXT, allowNull: true },
            notes: { type: Sequelize.TEXT, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
        console.log("  created bom_items");
      }

      // ═══ process_routes ═══
      if (!(await has("process_routes"))) {
        await queryInterface.createTable(
          "process_routes",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            dmrId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "device_master_records", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "CASCADE",
            },
            routeCode: { type: Sequelize.STRING(50), allowNull: false },
            name: { type: Sequelize.STRING(200), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            version: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "1.0" },
            isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            estimatedCycleTime: { type: Sequelize.INTEGER, allowNull: true },
            createdById: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "users", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
            },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
        console.log("  created process_routes");
      }

      // ═══ process_route_steps ═══
      if (!(await has("process_route_steps"))) {
        await queryInterface.createTable(
          "process_route_steps",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            routeId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "process_routes", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "CASCADE",
            },
            stepOrder: { type: Sequelize.INTEGER, allowNull: false },
            stepCode: { type: Sequelize.STRING(30), allowNull: false },
            name: { type: Sequelize.STRING(300), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            stepType: {
              type: Sequelize.ENUM("ASSEMBLY", "INSPECTION", "TEST", "PACKAGING", "LABELING", "REWORK", "HOLD_POINT"),
              allowNull: false,
            },
            workInstructions: { type: Sequelize.TEXT, allowNull: true },
            documentIds: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            requiredEquipmentIds: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            requiredTrainingIds: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            estimatedDuration: { type: Sequelize.INTEGER, allowNull: true },
            isInspectionGate: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            requiresDualSignoff: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            isGoNoGo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            isSpecialProcess: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            processValidationId: { type: Sequelize.INTEGER, allowNull: true },
            notes: { type: Sequelize.TEXT, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
        console.log("  created process_route_steps");
      }

      // ═══ step_checklists ═══
      if (!(await has("step_checklists"))) {
        await queryInterface.createTable(
          "step_checklists",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            stepId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "process_route_steps", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "CASCADE",
            },
            itemOrder: { type: Sequelize.INTEGER, allowNull: false },
            question: { type: Sequelize.STRING(500), allowNull: false },
            responseType: {
              type: Sequelize.ENUM("PASS_FAIL", "YES_NO", "NUMERIC", "TEXT", "SELECTION", "PHOTO"),
              allowNull: false,
            },
            nominalValue: { type: Sequelize.FLOAT, allowNull: true },
            lowerLimit: { type: Sequelize.FLOAT, allowNull: true },
            upperLimit: { type: Sequelize.FLOAT, allowNull: true },
            unit: { type: Sequelize.STRING(30), allowNull: true },
            options: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            isMandatory: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            isAutoHold: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            notes: { type: Sequelize.TEXT, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
        console.log("  created step_checklists");
      }

      // ═══ INDEXES ═══
      await queryInterface.addIndex("device_master_records", ["productId"], { name: "idx_dmr_product_id", transaction: t });
      await queryInterface.addIndex("device_master_records", ["status"], { name: "idx_dmr_status", transaction: t });
      await queryInterface.addIndex("bom_items", ["dmrId"], { name: "idx_bom_dmr_id", transaction: t });
      await queryInterface.addIndex("process_routes", ["dmrId"], { name: "idx_route_dmr_id", transaction: t });
      await queryInterface.addIndex("process_route_steps", ["routeId"], { name: "idx_step_route_id", transaction: t });
      await queryInterface.addIndex("step_checklists", ["stepId"], { name: "idx_checklist_step_id", transaction: t });

      await t.commit();
      console.log("✅ [MES-DMR] Device Master Record tables created");
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("step_checklists", { transaction: t, cascade: true }).catch(() => {});
      await queryInterface.dropTable("process_route_steps", { transaction: t, cascade: true }).catch(() => {});
      await queryInterface.dropTable("process_routes", { transaction: t, cascade: true }).catch(() => {});
      await queryInterface.dropTable("bom_items", { transaction: t, cascade: true }).catch(() => {});
      await queryInterface.dropTable("device_master_records", { transaction: t, cascade: true }).catch(() => {});
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },
};
