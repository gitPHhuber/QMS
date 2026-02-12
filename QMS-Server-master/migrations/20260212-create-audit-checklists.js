"use strict";

/**
 * Миграция: Чек-листы внутренних аудитов по разделам ISO 13485
 *
 * Новые таблицы:
 *   1. audit_checklists       — Шаблоны чек-листов (один на раздел ISO)
 *   2. audit_checklist_items  — Пункты чек-листа (конкретные требования)
 *   3. audit_checklist_responses — Ответы аудитора в рамках конкретного аудита
 *
 * Закрывает разрыв: «Нет чек-листов по разделам ISO 13485» (ТЗ п.4.1.2)
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. audit_checklists — шаблоны
    await queryInterface.createTable("audit_checklists", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      isoClause: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: "Раздел ISO 13485, например 4.2.4",
      },
      title: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: "Название раздела",
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Краткое описание требований раздела",
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: "Версия шаблона чек-листа",
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "Активен ли шаблон для использования",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    await queryInterface.addIndex("audit_checklists", ["isoClause"], {
      name: "idx_audit_checklists_iso_clause",
    });

    // 2. audit_checklist_items — пункты чек-листа
    await queryInterface.createTable("audit_checklist_items", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      checklistId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "audit_checklists", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: "Порядок пункта в чек-листе",
      },
      requirement: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: "Формулировка требования для проверки",
      },
      guidance: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Рекомендации аудитору",
      },
      isoReference: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Точная ссылка на пункт ISO",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    await queryInterface.addIndex("audit_checklist_items", ["checklistId", "order"], {
      name: "idx_audit_checklist_items_checklist_order",
    });

    // 3. audit_checklist_responses — ответы аудитора
    await queryInterface.createTable("audit_checklist_responses", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      auditScheduleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "audit_schedules", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      checklistItemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "audit_checklist_items", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM("CONFORMING", "MINOR_NC", "MAJOR_NC", "NOT_APPLICABLE", "NOT_CHECKED"),
        allowNull: false,
        defaultValue: "NOT_CHECKED",
        comment: "Результат проверки пункта",
      },
      evidence: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Объективные свидетельства",
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Комментарии аудитора",
      },
      auditorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      findingId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "audit_findings", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    await queryInterface.addIndex("audit_checklist_responses", ["auditScheduleId"], {
      name: "idx_audit_checklist_responses_schedule",
    });

    await queryInterface.addIndex("audit_checklist_responses", ["auditScheduleId", "checklistItemId"], {
      name: "idx_audit_checklist_responses_schedule_item",
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("audit_checklist_responses");
    await queryInterface.dropTable("audit_checklist_items");
    await queryInterface.dropTable("audit_checklists");
  },
};
