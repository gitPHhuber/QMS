"use strict";

/**
 * Fix: sessions table missing column 'online'
 *
 * Model expects: online (BOOLEAN)
 * Migration 20260209-create-core.js did not include it.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("sessions");

    if (!table.online) {
      await queryInterface.addColumn("sessions", "online", {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      });
    }

    console.log("✅ [fix-sessions] online column ensured");
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("sessions");
    if (table.online) await queryInterface.removeColumn("sessions", "online");
  },
};
