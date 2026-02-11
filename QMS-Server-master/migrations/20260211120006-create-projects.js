"use strict";

/**
 * Create missing table: projects
 *
 * Model: Project (modules/core/models/Project.js)
 * No previous migration covered this table.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const reg = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.projects') AS t`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (reg?.[0]?.t) {
      console.log("⚠️ [create-projects] Table already exists, skipping");
      return;
    }

    await queryInterface.createTable("projects", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.STRING(50), allowNull: false, defaultValue: "ACTIVE" },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });

    console.log("✅ [create-projects] Table created");
  },

  async down(queryInterface) {
    await queryInterface.dropTable("projects");
  },
};
