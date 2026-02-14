"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const [sprintsResult] = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.sprints')`
    );

    if (!sprintsResult[0].to_regclass) {
      await queryInterface.createTable("sprints", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        projectId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "projects", key: "id" },
          onDelete: "CASCADE",
        },
        title: { type: Sequelize.STRING, allowNull: false },
        goal: { type: Sequelize.TEXT, allowNull: true },
        startDate: { type: Sequelize.DATEONLY, allowNull: true },
        endDate: { type: Sequelize.DATEONLY, allowNull: true },
        status: { type: Sequelize.STRING, allowNull: false, defaultValue: "PLANNING" },
        createdById: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "CASCADE",
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });

      await queryInterface.addIndex("sprints", ["projectId"], {
        name: "idx_sprints_projectId",
      });
    }

    const [burndownResult] = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.sprint_burndown')`
    );

    if (!burndownResult[0].to_regclass) {
      await queryInterface.createTable("sprint_burndown", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        sprintId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "sprints", key: "id" },
          onDelete: "CASCADE",
        },
        date: { type: Sequelize.DATEONLY, allowNull: false },
        totalTasks: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        completedTasks: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        remainingTasks: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        idealRemaining: { type: Sequelize.FLOAT, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });

      await queryInterface.addConstraint("sprint_burndown", {
        fields: ["sprintId", "date"],
        type: "unique",
        name: "uq_sprint_burndown_sprint_date",
      });
    }

    // Add sprintId column to production_tasks
    const [colCheck] = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'production_tasks' AND column_name = 'sprintId'`
    );
    if (colCheck.length === 0) {
      await queryInterface.addColumn("production_tasks", "sprintId", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "sprints", key: "id" },
        onDelete: "SET NULL",
      });
      await queryInterface.addIndex("production_tasks", ["sprintId"], {
        name: "idx_production_tasks_sprintId",
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("production_tasks", "sprintId");
    await queryInterface.dropTable("sprint_burndown");
    await queryInterface.dropTable("sprints");
  },
};
