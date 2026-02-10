"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      const r = await queryInterface.sequelize.query(
        `SELECT to_regclass('public.sla_config') AS t`,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      if (r?.[0]?.t) {
        console.log("⚠️ [SLA] sla_config already exists — skip");
        await t.commit();
        return;
      }

      await queryInterface.createTable(
        "sla_config",
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },

          // то, что сидер 100% вставляет
          name: { type: Sequelize.STRING(255), allowNull: false },

          defectType: { type: Sequelize.STRING(64), allowNull: true }, // MOTHERBOARD/RAM/...
          priority: { type: Sequelize.STRING(32), allowNull: true },   // CRITICAL/HIGH/MEDIUM/LOW

          maxDiagnosisHours: { type: Sequelize.INTEGER, allowNull: true },
          maxRepairHours: { type: Sequelize.INTEGER, allowNull: true },
          maxTotalHours: { type: Sequelize.INTEGER, allowNull: true },
          escalationAfterHours: { type: Sequelize.INTEGER, allowNull: true },

          isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },

          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        },
        { transaction: t }
      );

      // индексы, чтобы выборки по типу/приоритету были быстрыми
      await queryInterface.addIndex("sla_config", ["defectType"], { name: "idx_sla_defect_type", transaction: t });
      await queryInterface.addIndex("sla_config", ["priority"], { name: "idx_sla_priority", transaction: t });
      await queryInterface.addIndex("sla_config", ["isActive"], { name: "idx_sla_is_active", transaction: t });

      // уникальность (defectType, priority) — логичная для SLA-матрицы.
      // т.к. сидер имеет варианты null/null и тип/null и тип/priority — в PG уникальный индекс
      // с NULL допускает дубликаты, что нам как раз не мешает.
      await queryInterface.addIndex(
        "sla_config",
        ["defectType", "priority"],
        { unique: true, name: "uq_sla_defect_priority", transaction: t }
      );

      await t.commit();
      console.log("✅ [SLA] sla_config created (matches seeder)");
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("sla_config", { transaction: t }).catch(() => {});
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },
};
