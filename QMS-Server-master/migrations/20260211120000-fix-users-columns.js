"use strict";

/**
 * Fix: users table missing columns
 *
 * Model expects: name, surname, img
 * Migration 20260209-create-core.js created users WITHOUT these columns.
 * Legacy column 'email' exists in table but not in model — kept as-is.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("users");

    if (!table.name) {
      await queryInterface.addColumn("users", "name", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!table.surname) {
      await queryInterface.addColumn("users", "surname", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!table.img) {
      await queryInterface.addColumn("users", "img", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    console.log("✅ [fix-users] name, surname, img columns ensured");
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("users");
    if (table.img) await queryInterface.removeColumn("users", "img");
    if (table.surname) await queryInterface.removeColumn("users", "surname");
    if (table.name) await queryInterface.removeColumn("users", "name");
  },
};
