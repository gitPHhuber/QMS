"use strict";

/**
 * Fix: production_section table column mismatch
 *
 * Model (Section) expects: title (STRING)
 * Migration 20260209-create-core.js created column as 'name'
 */

module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable("production_section");

    if (table.name && !table.title) {
      await queryInterface.renameColumn("production_section", "name", "title");
      console.log("  renamed production_section.name → title");
    }

    console.log("✅ [fix-production-section] columns fixed");
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("production_section");
    if (table.title && !table.name) {
      await queryInterface.renameColumn("production_section", "title", "name");
    }
  },
};
