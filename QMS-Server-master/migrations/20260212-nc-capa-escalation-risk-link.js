"use strict";

/**
 * Миграция: NC/CAPA SLA-эскалация + NC↔Risk интеграция
 *
 * 1. Добавляет riskRegisterId в nonconformities (связь NC↔Risk)
 * 2. Расширяет ENUM notifications.type новыми типами для SLA-эскалации
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Добавляем riskRegisterId в nonconformities (идемпотентно)
    const ncTable = await queryInterface.describeTable("nonconformities");

    if (!ncTable.riskRegisterId) {
      await queryInterface.addColumn("nonconformities", "riskRegisterId", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "risk_registers", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }

    const indexes = await queryInterface.showIndex("nonconformities");
    const hasRiskIdx = indexes.some((idx) => idx.name === "idx_nonconformities_risk_register");
    if (!hasRiskIdx) {
      await queryInterface.addIndex("nonconformities", ["riskRegisterId"], {
        name: "idx_nonconformities_risk_register",
      });
    }

    // 2. Расширяем ENUM для notification types (SLA-эскалация)
    const [enumRows] = await queryInterface.sequelize.query(`
      SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'enum_notifications_type'
        AND n.nspname = current_schema()
      LIMIT 1;
    `);

    if (enumRows.length) {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_notifications_type"
          ADD VALUE IF NOT EXISTS 'NC_OVERDUE';
      `);
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_notifications_type"
          ADD VALUE IF NOT EXISTS 'NC_ESCALATED';
      `);
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_notifications_type"
          ADD VALUE IF NOT EXISTS 'CAPA_ESCALATED';
      `);
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_notifications_type"
          ADD VALUE IF NOT EXISTS 'CAPA_ACTION_OVERDUE';
      `);
    }
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("nonconformities", "idx_nonconformities_risk_register");
    await queryInterface.removeColumn("nonconformities", "riskRegisterId");
    // NOTE: PostgreSQL не позволяет удалять значения из ENUM, это не откатывается
  },
};
