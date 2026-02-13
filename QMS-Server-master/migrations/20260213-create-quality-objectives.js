"use strict";

/**
 * Миграция: Создание таблицы quality_objectives
 * ISO 13485 §6.2 — Цели в области качества
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable("quality_objectives", {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        number: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true,
          comment: "QO-YYYY-NNN",
        },
        title: {
          type: Sequelize.STRING(500),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        metric: {
          type: Sequelize.STRING(200),
          allowNull: false,
          comment: "Название метрики",
        },
        targetValue: {
          type: Sequelize.FLOAT,
          allowNull: false,
        },
        currentValue: {
          type: Sequelize.FLOAT,
          allowNull: true,
        },
        unit: {
          type: Sequelize.STRING(50),
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM("ACTIVE", "ACHIEVED", "NOT_ACHIEVED", "CANCELLED"),
          defaultValue: "ACTIVE",
        },
        category: {
          type: Sequelize.ENUM("PROCESS", "PRODUCT", "CUSTOMER", "IMPROVEMENT", "COMPLIANCE"),
          allowNull: false,
        },
        responsibleId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
        },
        managementReviewId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "management_reviews", key: "id" },
        },
        isoClause: {
          type: Sequelize.STRING(50),
          allowNull: true,
        },
        progress: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        dueDate: {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
        periodFrom: {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
        periodTo: {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      }, { transaction });

      await queryInterface.addIndex("quality_objectives", ["status"], {
        name: "idx_qo_status",
        transaction,
      });

      await queryInterface.addIndex("quality_objectives", ["responsibleId"], {
        name: "idx_qo_responsible",
        transaction,
      });

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  },

  async down(queryInterface) {
    // Удаляем индексы до удаления таблицы (PostgreSQL делает это автоматически, но для явности)
    await queryInterface.removeIndex("quality_objectives", "idx_qo_status").catch(() => {});
    await queryInterface.removeIndex("quality_objectives", "idx_qo_responsible").catch(() => {});

    await queryInterface.dropTable("quality_objectives");

    // Удаляем ENUM типы, созданные Sequelize для PostgreSQL
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_quality_objectives_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_quality_objectives_category"');
  },
};
