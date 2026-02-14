"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const [taskCommentsResult] = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.task_comments')`
    );

    if (!taskCommentsResult[0].to_regclass) {
      await queryInterface.createTable("task_comments", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        taskId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "production_tasks", key: "id" },
          onDelete: "CASCADE",
        },
        parentId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "task_comments", key: "id" },
          onDelete: "CASCADE",
        },
        authorId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "CASCADE",
        },
        body: { type: Sequelize.TEXT, allowNull: false },
        mentions: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });

      await queryInterface.addIndex("task_comments", ["taskId"], {
        name: "idx_task_comments_taskId",
      });
    }

    const [taskActivityResult] = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.task_activity')`
    );

    if (!taskActivityResult[0].to_regclass) {
      await queryInterface.createTable("task_activity", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        taskId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "production_tasks", key: "id" },
          onDelete: "CASCADE",
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "CASCADE",
        },
        action: { type: Sequelize.STRING, allowNull: false },
        field: { type: Sequelize.STRING, allowNull: true },
        oldValue: { type: Sequelize.TEXT, allowNull: true },
        newValue: { type: Sequelize.TEXT, allowNull: true },
        metadata: { type: Sequelize.JSONB, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });

      await queryInterface.addIndex("task_activity", ["taskId", "createdAt"], {
        name: "idx_task_activity_taskId_createdAt",
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("task_activity");
    await queryInterface.dropTable("task_comments");
  },
};
