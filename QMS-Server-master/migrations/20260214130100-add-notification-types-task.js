"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_notifications_type" ADD VALUE IF NOT EXISTS 'TASK_MENTION'`
    );
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_notifications_type" ADD VALUE IF NOT EXISTS 'TASK_COMMENT'`
    );
  },

  async down() {
    // Cannot remove enum values in PostgreSQL, no-op
  },
};
