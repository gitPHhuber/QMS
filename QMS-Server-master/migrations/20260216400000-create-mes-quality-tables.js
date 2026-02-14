"use strict";

/**
 * MES Module — Acceptance Testing (PSI/Acceptance)
 *
 * Tables:
 *   - acceptance_test_templates
 *   - acceptance_tests
 *   - acceptance_test_items
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

      // ═══ acceptance_test_templates ═══
      if (!(await has("acceptance_test_templates"))) {
        await queryInterface.createTable(
          "acceptance_test_templates",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            templateCode: { type: Sequelize.STRING(30), allowNull: false, unique: true },
            name: { type: Sequelize.STRING(300), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            productId: { type: Sequelize.INTEGER, allowNull: true },
            dmrId: { type: Sequelize.INTEGER, allowNull: true },
            isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            version: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "1.0" },
            testItems: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
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
        console.log("  created acceptance_test_templates");
      }

      // ═══ acceptance_tests ═══
      if (!(await has("acceptance_tests"))) {
        await queryInterface.createTable(
          "acceptance_tests",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            testNumber: { type: Sequelize.STRING(30), allowNull: false, unique: true },
            unitId: { type: Sequelize.INTEGER, allowNull: true },
            workOrderId: { type: Sequelize.INTEGER, allowNull: true },
            dhrId: { type: Sequelize.INTEGER, allowNull: true },
            productId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "products", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
            },
            templateId: { type: Sequelize.INTEGER, allowNull: true },
            serialNumber: { type: Sequelize.STRING, allowNull: true },
            lotNumber: { type: Sequelize.STRING, allowNull: true },
            batchSize: { type: Sequelize.INTEGER, allowNull: true },
            status: {
              type: Sequelize.ENUM("DRAFT", "SUBMITTED", "IN_TESTING", "PASSED", "FAILED", "CONDITIONAL"),
              allowNull: false,
              defaultValue: "DRAFT",
            },
            submittedById: { type: Sequelize.INTEGER, allowNull: true },
            submittedAt: { type: Sequelize.DATE, allowNull: true },
            testerId: { type: Sequelize.INTEGER, allowNull: true },
            startedAt: { type: Sequelize.DATE, allowNull: true },
            completedAt: { type: Sequelize.DATE, allowNull: true },
            decisionById: { type: Sequelize.INTEGER, allowNull: true },
            decisionAt: { type: Sequelize.DATE, allowNull: true },
            decisionNotes: { type: Sequelize.TEXT, allowNull: true },
            isRetest: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            originalTestId: { type: Sequelize.INTEGER, allowNull: true },
            retestReason: { type: Sequelize.TEXT, allowNull: true },
            ncId: { type: Sequelize.INTEGER, allowNull: true },
            certificateGeneratedAt: { type: Sequelize.DATE, allowNull: true },
            notes: { type: Sequelize.TEXT, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
        console.log("  created acceptance_tests");
      }

      // ═══ acceptance_test_items ═══
      if (!(await has("acceptance_test_items"))) {
        await queryInterface.createTable(
          "acceptance_test_items",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            testId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "acceptance_tests", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "CASCADE",
            },
            itemOrder: { type: Sequelize.INTEGER, allowNull: false },
            name: { type: Sequelize.STRING(300), allowNull: false },
            testType: {
              type: Sequelize.ENUM("VISUAL", "DIMENSIONAL", "FUNCTIONAL", "ELECTRICAL", "SAFETY", "LABELING", "PACKAGING", "OTHER"),
              allowNull: false,
            },
            criteria: { type: Sequelize.TEXT, allowNull: false },
            lowerLimit: { type: Sequelize.FLOAT, allowNull: true },
            upperLimit: { type: Sequelize.FLOAT, allowNull: true },
            nominalValue: { type: Sequelize.FLOAT, allowNull: true },
            unit: { type: Sequelize.STRING(30), allowNull: true },
            actualValue: { type: Sequelize.STRING(200), allowNull: true },
            numericValue: { type: Sequelize.FLOAT, allowNull: true },
            result: {
              type: Sequelize.ENUM("PASS", "FAIL", "N_A", "PENDING"),
              allowNull: false,
              defaultValue: "PENDING",
            },
            isCritical: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            equipmentId: { type: Sequelize.INTEGER, allowNull: true },
            testedById: { type: Sequelize.INTEGER, allowNull: true },
            testedAt: { type: Sequelize.DATE, allowNull: true },
            notes: { type: Sequelize.TEXT, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
        console.log("  created acceptance_test_items");
      }

      // ═══ INDEXES ═══
      await queryInterface.addIndex("acceptance_tests", ["status"], { name: "idx_at_status", transaction: t });
      await queryInterface.addIndex("acceptance_tests", ["productId"], { name: "idx_at_product_id", transaction: t });
      await queryInterface.addIndex("acceptance_tests", ["unitId"], { name: "idx_at_unit_id", transaction: t });
      await queryInterface.addIndex("acceptance_test_items", ["testId"], { name: "idx_ati_test_id", transaction: t });

      await t.commit();
      console.log("✅ [MES-QUALITY] Acceptance test tables created");
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("acceptance_test_items", { transaction: t, cascade: true }).catch(() => {});
      await queryInterface.dropTable("acceptance_tests", { transaction: t, cascade: true }).catch(() => {});
      await queryInterface.dropTable("acceptance_test_templates", { transaction: t, cascade: true }).catch(() => {});
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },
};
