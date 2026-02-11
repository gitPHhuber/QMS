"use strict";

/**
 * Fix: pcs table column mismatches
 *
 * Model (PC) expects columns: ip, pc_name, cabinet
 * Migration 20260209-create-core.js created: ip, name (wrong name), no cabinet
 *
 * Note: table stays as 'pcs' — model now has tableName:'pcs' to match.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("pcs");

    // Rename 'name' → 'pc_name' if 'name' exists and 'pc_name' does not
    if (table.name && !table.pc_name) {
      await queryInterface.renameColumn("pcs", "name", "pc_name");
      console.log("  renamed pcs.name → pcs.pc_name");
    }

    // Add 'cabinet' if missing
    if (!table.cabinet) {
      await queryInterface.addColumn("pcs", "cabinet", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
      console.log("  added pcs.cabinet");
    }

    console.log("✅ [fix-pcs] columns fixed");
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("pcs");
    if (table.cabinet) await queryInterface.removeColumn("pcs", "cabinet");
    if (table.pc_name && !table.name) {
      await queryInterface.renameColumn("pcs", "pc_name", "name");
    }
  },
};
