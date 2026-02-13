"use strict";

/**
 * Миграция: Vigilance / пострыночное наблюдение — ISO 13485 §8.2.2 + СТО 822
 *
 * Таблицы:
 *   vigilance_reports      — Уведомления о неблагоприятных событиях (Росздравнадзор)
 *   complaint_attachments  — Вложения к рекламациям
 *   complaint_follow_ups   — Записи о ходе расследования рекламации
 *
 * Зависимости: complaints, users
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // ═══ 1. VIGILANCE_REPORTS — уведомления регулятору ═══
      await queryInterface.createTable("vigilance_reports", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        reportNumber: {
          type: Sequelize.STRING,
          unique: true,
          allowNull: false,
          comment: "VIG-YYYY-NNN",
        },
        complaintId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "complaints", key: "id" },
          onDelete: "CASCADE",
        },
        // Тип отчёта
        reportType: {
          type: Sequelize.ENUM("INITIAL", "FOLLOW_UP", "FINAL", "COMBINED"),
          allowNull: false,
          defaultValue: "INITIAL",
        },
        // Классификация события
        eventType: {
          type: Sequelize.ENUM(
            "DEATH",
            "SERIOUS_INJURY",
            "SERIOUS_PUBLIC_HEALTH_THREAT",
            "MALFUNCTION_COULD_CAUSE_DEATH",
            "MALFUNCTION_COULD_CAUSE_INJURY",
            "OTHER_REPORTABLE"
          ),
          allowNull: false,
        },
        // Регуляторный орган
        regulatoryBody: {
          type: Sequelize.STRING,
          defaultValue: "Росздравнадзор",
          comment: "Регуляторный орган для уведомления",
        },
        // Сроки
        eventDate: { type: Sequelize.DATEONLY, allowNull: false, comment: "Дата неблагоприятного события" },
        awareDate: { type: Sequelize.DATEONLY, allowNull: false, comment: "Дата, когда производитель узнал" },
        reportDueDate: { type: Sequelize.DATEONLY, comment: "Крайний срок подачи (10/30 дней)" },
        submittedDate: { type: Sequelize.DATEONLY, comment: "Дата фактической подачи" },
        // Содержание
        eventDescription: { type: Sequelize.TEXT, allowNull: false },
        patientOutcome: { type: Sequelize.TEXT, comment: "Последствия для пациента" },
        deviceAction: { type: Sequelize.TEXT, comment: "Действия по устройству (отзыв, коррекция и т.д.)" },
        correctiveAction: { type: Sequelize.TEXT, comment: "Корректирующие действия (FSCA)" },
        // Статус
        status: {
          type: Sequelize.ENUM("DRAFT", "SUBMITTED", "ACKNOWLEDGED", "CLOSED", "WITHDRAWN"),
          defaultValue: "DRAFT",
        },
        // Ответственные
        preparedById: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
        },
        approvedById: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
        },
        approvedAt: { type: Sequelize.DATE },
        // Связи
        linkedNcId: { type: Sequelize.INTEGER, comment: "Связанное NC" },
        linkedCapaId: { type: Sequelize.INTEGER, comment: "Связанное CAPA" },

        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      }, { transaction });

      // ═══ 2. COMPLAINT_ATTACHMENTS — вложения к рекламациям ═══
      await queryInterface.createTable("complaint_attachments", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        complaintId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "complaints", key: "id" },
          onDelete: "CASCADE",
        },
        fileUrl: { type: Sequelize.STRING(1000), allowNull: false },
        fileName: { type: Sequelize.STRING(500), allowNull: false },
        fileSize: { type: Sequelize.INTEGER },
        fileMimeType: { type: Sequelize.STRING(100) },
        description: { type: Sequelize.STRING(500) },
        uploadedById: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      }, { transaction });

      // ═══ 3. COMPLAINT_FOLLOW_UPS — ход расследования ═══
      await queryInterface.createTable("complaint_follow_ups", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        complaintId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "complaints", key: "id" },
          onDelete: "CASCADE",
        },
        note: { type: Sequelize.TEXT, allowNull: false, comment: "Запись о ходе расследования" },
        authorId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      }, { transaction });

      // ═══ Индексы ═══
      await queryInterface.addIndex("vigilance_reports", ["reportNumber"], { unique: true, transaction });
      await queryInterface.addIndex("vigilance_reports", ["complaintId"], { transaction });
      await queryInterface.addIndex("vigilance_reports", ["status"], { transaction });
      await queryInterface.addIndex("vigilance_reports", ["reportDueDate"], { transaction });
      await queryInterface.addIndex("complaint_attachments", ["complaintId"], { transaction });
      await queryInterface.addIndex("complaint_follow_ups", ["complaintId"], { transaction });

      await transaction.commit();
      console.log("✅ [complaint-vigilance-sto822] Миграция выполнена: vigilance_reports, complaint_attachments, complaint_follow_ups");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("complaint_follow_ups", { transaction });
      await queryInterface.dropTable("complaint_attachments", { transaction });
      await queryInterface.dropTable("vigilance_reports", { transaction });
      for (const type of [
        "enum_vigilance_reports_reportType",
        "enum_vigilance_reports_eventType",
        "enum_vigilance_reports_status",
      ]) {
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${type}";`, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
