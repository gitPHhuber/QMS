"use strict";

/**
 * Adds the missing `code` column to the `roles` table.
 *
 * The column is required by the Sequelize model (General.js) but may be absent
 * if the table was originally created by sequelize.sync() before `code` was
 * added to the model definition. The idempotent create-table migrations
 * (20260209-create-core, 20260210-create-rbac) skip when the table already
 * exists, so the column never gets added on legacy databases.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable("roles");

    if (!columns.code) {
      await queryInterface.addColumn("roles", "code", {
        type: Sequelize.STRING(128),
        allowNull: true, // start nullable so existing rows don't break
      });

      // Back-fill existing rows: use the `name` value as the `code`
      await queryInterface.sequelize.query(
        `UPDATE "roles" SET "code" = "name" WHERE "code" IS NULL;`
      );

      // Now make it NOT NULL + UNIQUE
      await queryInterface.changeColumn("roles", "code", {
        type: Sequelize.STRING(128),
        allowNull: false,
      });

      await queryInterface.addIndex("roles", ["code"], {
        unique: true,
        name: "uq_roles_code",
      });

      console.log("✅ [roles] Added missing 'code' column");
    } else {
      console.log("ℹ️  [roles] 'code' column already exists — skipping");
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable("roles");

    if (columns.code) {
      await queryInterface.removeIndex("roles", "uq_roles_code").catch(() => {});
      await queryInterface.removeColumn("roles", "code");
    }
  },
};
