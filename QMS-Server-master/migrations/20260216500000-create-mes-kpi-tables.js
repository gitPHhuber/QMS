"use strict";

/**
 * MES Module — Production KPI Targets
 *
 * Tables:
 *   - production_kpi_targets
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

      // ═══ production_kpi_targets ═══
      if (!(await has("production_kpi_targets"))) {
        await queryInterface.createTable(
          "production_kpi_targets",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            productId: { type: Sequelize.INTEGER, allowNull: true },
            kpiCode: { type: Sequelize.STRING(50), allowNull: false },
            targetValue: { type: Sequelize.FLOAT, allowNull: false },
            warningValue: { type: Sequelize.FLOAT, allowNull: true },
            unit: { type: Sequelize.STRING(20), allowNull: true },
            period: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "MONTHLY" },
            isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
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
        console.log("  created production_kpi_targets");
      }

      await t.commit();
      console.log("✅ [MES-KPI] Production KPI targets table created");
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("production_kpi_targets", { transaction: t, cascade: true }).catch(() => {});
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },
};
