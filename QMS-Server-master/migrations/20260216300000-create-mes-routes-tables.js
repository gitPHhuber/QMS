"use strict";

/**
 * MES Module — Operation Records & Checklist Responses
 *
 * Tables:
 *   - operation_records
 *   - checklist_responses
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

      // ═══ operation_records ═══
      if (!(await has("operation_records"))) {
        await queryInterface.createTable(
          "operation_records",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            unitId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "work_order_units", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "CASCADE",
            },
            routeStepId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "process_route_steps", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
            },
            workOrderId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "production_tasks", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "CASCADE",
            },
            stepOrder: { type: Sequelize.INTEGER, allowNull: false },
            stepName: { type: Sequelize.STRING(300), allowNull: false },
            status: {
              type: Sequelize.ENUM("PENDING", "IN_PROGRESS", "COMPLETED", "FAILED", "SKIPPED", "ON_HOLD"),
              allowNull: false,
              defaultValue: "PENDING",
            },
            result: {
              type: Sequelize.ENUM("PASS", "FAIL", "CONDITIONAL", "N_A"),
              allowNull: true,
            },
            operatorId: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: "users", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "SET NULL",
            },
            inspectorId: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: "users", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "SET NULL",
            },
            startedAt: { type: Sequelize.DATE, allowNull: true },
            completedAt: { type: Sequelize.DATE, allowNull: true },
            durationSeconds: { type: Sequelize.INTEGER, allowNull: true },
            equipmentId: { type: Sequelize.INTEGER, allowNull: true },
            equipmentCalibrationOk: { type: Sequelize.BOOLEAN, allowNull: true },
            operatorSignatureId: { type: Sequelize.INTEGER, allowNull: true },
            inspectorSignatureId: { type: Sequelize.INTEGER, allowNull: true },
            ncId: { type: Sequelize.INTEGER, allowNull: true },
            notes: { type: Sequelize.TEXT, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
        console.log("  created operation_records");
      }

      // ═══ checklist_responses ═══
      if (!(await has("checklist_responses"))) {
        await queryInterface.createTable(
          "checklist_responses",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            operationId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "operation_records", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "CASCADE",
            },
            checklistItemId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "step_checklists", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
            },
            question: { type: Sequelize.STRING(500), allowNull: false },
            responseType: { type: Sequelize.STRING(30), allowNull: false },
            responseValue: { type: Sequelize.STRING(500), allowNull: true },
            numericValue: { type: Sequelize.FLOAT, allowNull: true },
            booleanValue: { type: Sequelize.BOOLEAN, allowNull: true },
            withinTolerance: {
              type: Sequelize.ENUM("GREEN", "YELLOW", "RED"),
              allowNull: true,
            },
            photoUrl: { type: Sequelize.STRING, allowNull: true },
            respondedById: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "users", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
            },
            respondedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            notes: { type: Sequelize.TEXT, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
        console.log("  created checklist_responses");
      }

      // ═══ INDEXES ═══
      await queryInterface.addIndex("operation_records", ["unitId"], { name: "idx_op_unit_id", transaction: t });
      await queryInterface.addIndex("operation_records", ["workOrderId"], { name: "idx_op_work_order_id", transaction: t });
      await queryInterface.addIndex("operation_records", ["status"], { name: "idx_op_status", transaction: t });
      await queryInterface.addIndex("checklist_responses", ["operationId"], { name: "idx_cr_operation_id", transaction: t });

      await t.commit();
      console.log("✅ [MES-ROUTES] Operation records & checklist responses created");
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("checklist_responses", { transaction: t, cascade: true }).catch(() => {});
      await queryInterface.dropTable("operation_records", { transaction: t, cascade: true }).catch(() => {});
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },
};
