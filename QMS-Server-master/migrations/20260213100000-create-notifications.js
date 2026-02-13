"use strict";

/**
 * Миграция: создание таблицы notifications
 *
 * Центр уведомлений — ISO 13485 (поддержка всех модулей).
 * Таблица ссылается на users(id) через userId.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      // Проверяем, не существует ли таблица уже
      const [result] = await queryInterface.sequelize.query(
        `SELECT to_regclass('public.notifications') AS t`,
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      if (!result?.t) {
        await queryInterface.createTable(
          "notifications",
          {
            id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true,
              allowNull: false,
            },
            userId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "users", key: "id" },
              onDelete: "CASCADE",
              onUpdate: "CASCADE",
            },
            type: {
              type: Sequelize.ENUM(
                "CAPA_OVERDUE",
                "CAPA_ASSIGNED",
                "DOCUMENT_PENDING",
                "CALIBRATION_DUE",
                "AUDIT_UPCOMING",
                "NC_CREATED",
                "COMPLAINT_RECEIVED",
                "TRAINING_EXPIRED",
                "CHANGE_REQUEST_PENDING",
                "REVALIDATION_DUE",
                "REVIEW_SCHEDULED",
                "GENERAL",
                "NC_OVERDUE",
                "NC_ESCALATED",
                "CAPA_ESCALATED",
                "CAPA_ACTION_OVERDUE"
              ),
              allowNull: false,
            },
            title: {
              type: Sequelize.STRING,
              allowNull: false,
            },
            message: {
              type: Sequelize.TEXT,
              allowNull: true,
            },
            severity: {
              type: Sequelize.ENUM("INFO", "WARNING", "CRITICAL"),
              defaultValue: "INFO",
            },
            entityType: {
              type: Sequelize.STRING,
              allowNull: true,
              comment: "complaint, nc, capa, document...",
            },
            entityId: {
              type: Sequelize.INTEGER,
              allowNull: true,
            },
            link: {
              type: Sequelize.STRING,
              allowNull: true,
              comment: "Ссылка на модуль /qms/...",
            },
            isRead: {
              type: Sequelize.BOOLEAN,
              defaultValue: false,
            },
            readAt: {
              type: Sequelize.DATE,
              allowNull: true,
            },
            createdAt: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.fn("NOW"),
            },
            updatedAt: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.fn("NOW"),
            },
          },
          { transaction: t }
        );

        // Индекс для быстрой выборки непрочитанных уведомлений пользователя
        await queryInterface.addIndex(
          "notifications",
          ["userId", "isRead"],
          { name: "idx_notifications_user_read", transaction: t }
        );
      }

      await t.commit();
      console.log("✅ [CORE] таблица notifications создана");
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("notifications").catch(() => {});
  },
};
