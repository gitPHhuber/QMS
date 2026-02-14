"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const [epicsResult] = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.epics')`
    );

    if (!epicsResult[0].to_regclass) {
      await queryInterface.createTable("epics", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        title: { type: Sequelize.STRING, allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        color: { type: Sequelize.STRING, allowNull: false, defaultValue: "#A06AE8" },
        status: { type: Sequelize.STRING, allowNull: false, defaultValue: "ACTIVE" },
        createdById: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "CASCADE",
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
    }

    // Add epicId column to production_tasks
    const [colCheck] = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'production_tasks' AND column_name = 'epicId'`
    );
    if (colCheck.length === 0) {
      await queryInterface.addColumn("production_tasks", "epicId", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "epics", key: "id" },
        onDelete: "SET NULL",
      });
      await queryInterface.addIndex("production_tasks", ["epicId"], {
        name: "idx_production_tasks_epicId",
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("production_tasks", "epicId");
    await queryInterface.dropTable("epics");
  },
};
