"use strict";

/**
 * Fix: audit_logs table column mismatches
 *
 * Model expects: description (TEXT), metadata (JSON)
 * Migration 20260209-create-core.js created: message (TEXT) — wrong name, no metadata
 *
 * Legacy column 'message' renamed to 'description'.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("audit_logs");

    // Rename 'message' → 'description' if needed
    if (table.message && !table.description) {
      await queryInterface.renameColumn("audit_logs", "message", "description");
      console.log("  renamed audit_logs.message → audit_logs.description");
    }

    // Add 'metadata' (JSON) if missing
    if (!table.metadata) {
      await queryInterface.addColumn("audit_logs", "metadata", {
        type: Sequelize.JSON,
        allowNull: true,
      });
      console.log("  added audit_logs.metadata");
    }

    console.log("✅ [fix-audit-logs] columns fixed");
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("audit_logs");
    if (table.metadata) await queryInterface.removeColumn("audit_logs", "metadata");
    if (table.description && !table.message) {
      await queryInterface.renameColumn("audit_logs", "description", "message");
    }
  },
};
