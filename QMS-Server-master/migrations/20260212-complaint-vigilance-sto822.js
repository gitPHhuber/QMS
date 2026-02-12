"use strict";

/**
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
      // ─── Тип обращения (СТО-8.2.2 §4.1) ───
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_complaints_complaintType" AS ENUM ('COMPLAINT', 'RECLAMATION', 'FEEDBACK')`,
        { transaction }
      );
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
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_complaints_vigilanceStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'SUBMITTED', 'ACKNOWLEDGED', 'CLOSED')`,
        { transaction }
      );
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

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
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

      await queryInterface.removeIndex("complaints", "idx_complaint_vigilance_status", { transaction });
      await queryInterface.removeIndex("complaints", "idx_complaint_vigilance_deadline", { transaction });
      await queryInterface.removeIndex("complaints", "idx_complaint_type", { transaction });
      await queryInterface.removeIndex("complaints", "idx_complaint_reportable", { transaction });

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
