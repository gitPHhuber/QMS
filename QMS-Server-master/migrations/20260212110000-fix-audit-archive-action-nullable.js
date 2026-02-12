"use strict";

/**
 * Fix for already-migrated DBs:
 * ensure audit_logs_archive.action is nullable (legacy audit_logs rows may have NULL action).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const hasArchive = await queryInterface.sequelize.query(
        `SELECT to_regclass('public.audit_logs_archive') AS t`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (!hasArchive?.[0]?.t) {
        await transaction.commit();
        return;
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE audit_logs_archive ALTER COLUMN "action" DROP NOT NULL;`,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const hasArchive = await queryInterface.sequelize.query(
        `SELECT to_regclass('public.audit_logs_archive') AS t`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (!hasArchive?.[0]?.t) {
        await transaction.commit();
        return;
      }

      const hasNulls = await queryInterface.sequelize.query(
        `SELECT EXISTS(SELECT 1 FROM audit_logs_archive WHERE "action" IS NULL) AS has_nulls`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (!hasNulls?.[0]?.has_nulls) {
        await queryInterface.sequelize.query(
          `ALTER TABLE audit_logs_archive ALTER COLUMN "action" SET NOT NULL;`,
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
