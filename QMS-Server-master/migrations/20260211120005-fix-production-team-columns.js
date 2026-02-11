"use strict";

/**
 * Fix: production_team table column mismatches
 *
 * Model (Team) expects:
 *   - title (STRING) — migration created as 'name'
 *   - productionSectionId (mapped from sectionId via field option) — migration created as 'sectionId'
 */

module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable("production_team");

    // Rename 'name' → 'title'
    if (table.name && !table.title) {
      await queryInterface.renameColumn("production_team", "name", "title");
      console.log("  renamed production_team.name → title");
    }

    // Rename 'sectionId' → 'productionSectionId' (model field mapping)
    if (table.sectionId && !table.productionSectionId) {
      await queryInterface.renameColumn("production_team", "sectionId", "productionSectionId");
      console.log("  renamed production_team.sectionId → productionSectionId");
    }

    console.log("✅ [fix-production-team] columns fixed");
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("production_team");
    if (table.productionSectionId && !table.sectionId) {
      await queryInterface.renameColumn("production_team", "productionSectionId", "sectionId");
    }
    if (table.title && !table.name) {
      await queryInterface.renameColumn("production_team", "title", "name");
    }
  },
};
