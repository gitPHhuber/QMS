"use strict";

/**
 * Миграция: Рекламации (Complaints) — ISO 13485 §8.2.2 + §8.5.1
 *
 * Таблица complaints — реестр рекламаций / обратной связи
 *
 * Зависимости: users, nonconformities, capas
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable("complaints", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        complaintNumber: {
          type: Sequelize.STRING,
          unique: true,
          allowNull: false,
          comment: "CMP-YYYY-NNN",
        },
        // Источник
        source: {
          type: Sequelize.ENUM("CUSTOMER", "DISTRIBUTOR", "INTERNAL", "REGULATOR", "FIELD_REPORT"),
          allowNull: false,
        },
        reporterName: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: "ФИО заявителя / название организации",
        },
        reporterContact: { type: Sequelize.TEXT, comment: "Контакт: email/телефон" },
        receivedDate: { type: Sequelize.DATEONLY, allowNull: false },
        // Продукт
        productName: { type: Sequelize.STRING, comment: "Наименование медизделия" },
        productModel: { type: Sequelize.STRING, comment: "Модель" },
        serialNumber: { type: Sequelize.STRING, comment: "Серийный номер" },
        lotNumber: { type: Sequelize.STRING, comment: "Номер партии" },
        // Описание
        title: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: false },
        severity: {
          type: Sequelize.ENUM("CRITICAL", "MAJOR", "MINOR", "INFORMATIONAL"),
          allowNull: false,
        },
        // Классификация
        category: {
          type: Sequelize.ENUM(
            "SAFETY", "PERFORMANCE", "LABELING", "PACKAGING",
            "DOCUMENTATION", "DELIVERY", "SERVICE", "OTHER"
          ),
          allowNull: false,
        },
        isReportable: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: "Требует уведомления Росздравнадзора",
        },
        // Расследование
        investigationSummary: { type: Sequelize.TEXT },
        rootCause: { type: Sequelize.TEXT },
        // Связи
        linkedNcId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "nonconformities", key: "id" },
          comment: "Связанное несоответствие",
        },
        linkedCapaId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "capas", key: "id" },
          comment: "Связанное CAPA",
        },
        responsibleId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
          comment: "Ответственный за расследование",
        },
        // Статус
        status: {
          type: Sequelize.ENUM("RECEIVED", "UNDER_REVIEW", "INVESTIGATING", "RESOLVED", "CLOSED", "REJECTED"),
          defaultValue: "RECEIVED",
        },
        resolution: { type: Sequelize.TEXT },
        closedAt: { type: Sequelize.DATE },
        closedById: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
        },
        // Сроки
        dueDate: { type: Sequelize.DATEONLY, comment: "Крайний срок расследования (30 дней по умолчанию)" },

        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      }, { transaction });

      // Индексы
      await queryInterface.addIndex("complaints", ["complaintNumber"], { unique: true, transaction });
      await queryInterface.addIndex("complaints", ["status"], { transaction });
      await queryInterface.addIndex("complaints", ["severity"], { transaction });
      await queryInterface.addIndex("complaints", ["source"], { transaction });
      await queryInterface.addIndex("complaints", ["receivedDate"], { transaction });
      await queryInterface.addIndex("complaints", ["responsibleId"], { transaction });

      await transaction.commit();
      console.log("✅ [create-complaints] Таблица complaints создана");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("complaints", { transaction });
      for (const type of [
        "enum_complaints_source",
        "enum_complaints_severity",
        "enum_complaints_category",
        "enum_complaints_status",
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
