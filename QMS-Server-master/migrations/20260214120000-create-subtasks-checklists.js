"use strict";

/**
 * Create tables: task_subtasks, task_checklists, task_checklist_items
 *
 * Phase 1: Subtasks & Checklists for production tasks.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── task_subtasks ──
    const r1 = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.task_subtasks') AS t`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (!r1?.[0]?.t) {
      await queryInterface.createTable("task_subtasks", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        taskId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "production_tasks", key: "id" },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },
        title: { type: Sequelize.STRING(500), allowNull: false },
        isCompleted: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        createdById: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
          onDelete: "SET NULL",
          onUpdate: "CASCADE",
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      await queryInterface.addIndex("task_subtasks", ["taskId"], { name: "idx_task_subtasks_taskId" });
      console.log("✅ [subtasks-checklists] task_subtasks created");
    } else {
      console.log("⚠️ [subtasks-checklists] task_subtasks already exists, skipping");
    }

    // ── task_checklists ──
    const r2 = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.task_checklists') AS t`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (!r2?.[0]?.t) {
      await queryInterface.createTable("task_checklists", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        taskId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "production_tasks", key: "id" },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },
        title: { type: Sequelize.STRING(255), allowNull: false, defaultValue: "Чеклист" },
        sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        createdById: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
          onDelete: "SET NULL",
          onUpdate: "CASCADE",
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      await queryInterface.addIndex("task_checklists", ["taskId"], { name: "idx_task_checklists_taskId" });
      console.log("✅ [subtasks-checklists] task_checklists created");
    } else {
      console.log("⚠️ [subtasks-checklists] task_checklists already exists, skipping");
    }

    // ── task_checklist_items ──
    const r3 = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.task_checklist_items') AS t`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (!r3?.[0]?.t) {
      await queryInterface.createTable("task_checklist_items", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        checklistId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "task_checklists", key: "id" },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },
        title: { type: Sequelize.STRING(500), allowNull: false },
        isCompleted: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      await queryInterface.addIndex("task_checklist_items", ["checklistId"], { name: "idx_task_checklist_items_checklistId" });
      console.log("✅ [subtasks-checklists] task_checklist_items created");
    } else {
      console.log("⚠️ [subtasks-checklists] task_checklist_items already exists, skipping");
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("task_checklist_items").catch(() => {});
    await queryInterface.dropTable("task_checklists").catch(() => {});
    await queryInterface.dropTable("task_subtasks").catch(() => {});
  },
};
