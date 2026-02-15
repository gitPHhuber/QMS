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

 * Миграция: расширение таблицы complaints
 *
 * Добавляет поля для:
 * - Классификация типа обращения (жалоба/рекламация/предложение) — СТО-8.2.2 §4.1
 * - Полные данные заявителя и продукта — СТО-8.2.2 §4.2
 * - Оценка риска для пациента — СТО-8.2.2 §4.4
 * - Vigilance reporting (номер отчёта, дата отправки, контроль сроков, статус) — СТО-8.2.3
 * - Расследование (корректирующие/предупреждающие меры, даты) — СТО-8.2.2 §5

 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tableExists = await queryInterface.sequelize.query(
        `SELECT to_regclass('public.complaints') AS t`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      if (!tableExists?.[0]?.t) {
        await transaction.commit();
        console.log("ℹ️ Таблица complaints не найдена, миграция complaint-vigilance-sto822 пропущена");
        return;
      }


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

      // ─── Тип обращения (СТО-8.2.2 §4.1) ───
      await queryInterface.addColumn("complaints", "complaintType", {
        type: Sequelize.ENUM("COMPLAINT", "RECLAMATION", "FEEDBACK"),
        allowNull: false,
        defaultValue: "COMPLAINT",
      }, { transaction });

      // ─── Дополнительные данные заявителя (СТО-8.2.2 §4.2) ───
      await queryInterface.addColumn("complaints", "reporterOrganization", {
        type: Sequelize.STRING,
      }, { transaction });
      await queryInterface.addColumn("complaints", "reporterAddress", {
        type: Sequelize.TEXT,
      }, { transaction });
      await queryInterface.addColumn("complaints", "eventDate", {
        type: Sequelize.DATEONLY,
      }, { transaction });
      await queryInterface.addColumn("complaints", "countryOfOccurrence", {
        type: Sequelize.STRING,
        defaultValue: "RU",
      }, { transaction });

      // ─── Продукт: дополнительные поля (СТО-8.2.2 §4.2) ───
      await queryInterface.addColumn("complaints", "productRegistrationNumber", {
        type: Sequelize.STRING,
      }, { transaction });
      await queryInterface.addColumn("complaints", "manufacturingDate", {
        type: Sequelize.DATEONLY,
      }, { transaction });
      await queryInterface.addColumn("complaints", "expirationDate", {
        type: Sequelize.DATEONLY,
      }, { transaction });
      await queryInterface.addColumn("complaints", "quantityAffected", {
        type: Sequelize.INTEGER,
      }, { transaction });

      // ─── Оценка риска для пациента (СТО-8.2.2 §4.4) ───
      await queryInterface.addColumn("complaints", "patientInvolved", {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }, { transaction });
      await queryInterface.addColumn("complaints", "healthHazard", {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }, { transaction });

      // ─── Vigilance reporting (СТО-8.2.3) ───
      await queryInterface.addColumn("complaints", "vigilanceReportNumber", {
        type: Sequelize.STRING,
      }, { transaction });
      await queryInterface.addColumn("complaints", "vigilanceStatus", {
        type: Sequelize.ENUM("NOT_REQUIRED", "PENDING", "SUBMITTED", "ACKNOWLEDGED", "CLOSED"),
        defaultValue: "NOT_REQUIRED",
      }, { transaction });
      await queryInterface.addColumn("complaints", "vigilanceDeadline", {
        type: Sequelize.DATEONLY,
      }, { transaction });
      await queryInterface.addColumn("complaints", "vigilanceSubmittedAt", {
        type: Sequelize.DATE,
      }, { transaction });
      await queryInterface.addColumn("complaints", "vigilanceSubmittedById", {
        type: Sequelize.INTEGER,
      }, { transaction });
      await queryInterface.addColumn("complaints", "vigilanceAcknowledgedAt", {
        type: Sequelize.DATE,
      }, { transaction });
      await queryInterface.addColumn("complaints", "regulatoryAuthorityRef", {
        type: Sequelize.STRING,
      }, { transaction });
      await queryInterface.addColumn("complaints", "vigilanceNotes", {
        type: Sequelize.TEXT,
      }, { transaction });

      // ─── Расследование: доп. поля (СТО-8.2.2 §5) ───
      await queryInterface.addColumn("complaints", "correctiveAction", {
        type: Sequelize.TEXT,
      }, { transaction });
      await queryInterface.addColumn("complaints", "preventiveAction", {
        type: Sequelize.TEXT,
      }, { transaction });
      await queryInterface.addColumn("complaints", "investigationStartedAt", {
        type: Sequelize.DATE,
      }, { transaction });
      await queryInterface.addColumn("complaints", "investigationCompletedAt", {
        type: Sequelize.DATE,
      }, { transaction });

      // ─── Кто создал запись ───
      await queryInterface.addColumn("complaints", "createdById", {
        type: Sequelize.INTEGER,
      }, { transaction });

      // ─── Индексы ───
      await queryInterface.addIndex("complaints", ["vigilanceStatus"], {
        name: "idx_complaint_vigilance_status",
        transaction,
      });
      await queryInterface.addIndex("complaints", ["vigilanceDeadline"], {
        name: "idx_complaint_vigilance_deadline",
        transaction,
      });
      await queryInterface.addIndex("complaints", ["complaintType"], {
        name: "idx_complaint_type",
        transaction,
      });
      await queryInterface.addIndex("complaints", ["isReportable"], {
        name: "idx_complaint_reportable",
        transaction,
      });

      await transaction.commit();
      console.log("✅ Миграция complaint-vigilance-sto822: добавлены поля vigilance, классификация, СТО-8.2.2/8.2.3");

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {

      const tableExists = await queryInterface.sequelize.query(
        `SELECT to_regclass('public.complaints') AS t`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );
      if (!tableExists?.[0]?.t) {
        await transaction.commit();
        return;
      }


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

      // Drop indexes BEFORE removing columns to avoid implicit cascade errors
      await queryInterface.removeIndex("complaints", "idx_complaint_vigilance_status", { transaction });
      await queryInterface.removeIndex("complaints", "idx_complaint_vigilance_deadline", { transaction });
      await queryInterface.removeIndex("complaints", "idx_complaint_type", { transaction });
      await queryInterface.removeIndex("complaints", "idx_complaint_reportable", { transaction });

      const columns = [
        "complaintType", "reporterOrganization", "reporterAddress",
        "eventDate", "countryOfOccurrence",
        "productRegistrationNumber", "manufacturingDate", "expirationDate", "quantityAffected",
        "patientInvolved", "healthHazard",
        "vigilanceReportNumber", "vigilanceStatus", "vigilanceDeadline",
        "vigilanceSubmittedAt", "vigilanceSubmittedById",
        "vigilanceAcknowledgedAt", "regulatoryAuthorityRef", "vigilanceNotes",
        "correctiveAction", "preventiveAction",
        "investigationStartedAt", "investigationCompletedAt",
        "createdById",
      ];

      for (const col of columns) {
        await queryInterface.removeColumn("complaints", col, { transaction });
      }

      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS "enum_complaints_complaintType"`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS "enum_complaints_vigilanceStatus"`,
        { transaction }
      );


      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
