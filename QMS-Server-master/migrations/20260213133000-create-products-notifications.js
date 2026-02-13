"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      const has = async (name) => {
        const r = await queryInterface.sequelize.query(
          `SELECT to_regclass('public.${name}') AS t`,
          { type: Sequelize.QueryTypes.SELECT, transaction: t }
        );
        return !!r?.[0]?.t;
      };

      if (!(await has("products"))) {
        await queryInterface.createTable(
          "products",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            productCode: { type: Sequelize.STRING, allowNull: false, unique: true },
            name: { type: Sequelize.STRING, allowNull: false },
            model: { type: Sequelize.STRING, allowNull: true },
            description: { type: Sequelize.TEXT, allowNull: true },
            registrationNumber: { type: Sequelize.STRING, allowNull: true },
            registrationDate: { type: Sequelize.DATEONLY, allowNull: true },
            registrationExpiry: { type: Sequelize.DATEONLY, allowNull: true },
            riskClass: {
              type: Sequelize.ENUM("1", "2A", "2B", "3"),
              allowNull: true,
            },
            category: {
              type: Sequelize.ENUM("DIAGNOSTIC", "THERAPEUTIC", "MONITORING", "SOFTWARE", "ACCESSORY", "OTHER"),
              allowNull: true,
            },
            productionStatus: {
              type: Sequelize.ENUM("DEVELOPMENT", "PROTOTYPE", "PILOT", "SERIAL", "DISCONTINUED"),
              allowNull: true,
              defaultValue: "DEVELOPMENT",
            },
            technicalFileId: { type: Sequelize.INTEGER, allowNull: true },
            iomDocumentId: { type: Sequelize.INTEGER, allowNull: true },
            designOwnerId: { type: Sequelize.INTEGER, allowNull: true },
            qualityOwnerId: { type: Sequelize.INTEGER, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
      }

      if (!(await has("notifications"))) {
        await queryInterface.createTable(
          "notifications",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            userId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "users", key: "id" },
              onDelete: "CASCADE",
              onUpdate: "CASCADE",
            },
            type: {
              type: Sequelize.ENUM(
                "CAPA_OVERDUE", "CAPA_ASSIGNED", "DOCUMENT_PENDING",
                "CALIBRATION_DUE", "AUDIT_UPCOMING", "NC_CREATED",
                "COMPLAINT_RECEIVED", "TRAINING_EXPIRED",
                "CHANGE_REQUEST_PENDING", "REVALIDATION_DUE",
                "REVIEW_SCHEDULED", "GENERAL",
                "NC_OVERDUE", "NC_ESCALATED",
                "CAPA_ESCALATED", "CAPA_ACTION_OVERDUE"
              ),
              allowNull: false,
            },
            title: { type: Sequelize.STRING, allowNull: false },
            message: { type: Sequelize.TEXT, allowNull: true },
            severity: {
              type: Sequelize.ENUM("INFO", "WARNING", "CRITICAL"),
              allowNull: true,
              defaultValue: "INFO",
            },
            entityType: { type: Sequelize.STRING, allowNull: true },
            entityId: { type: Sequelize.INTEGER, allowNull: true },
            link: { type: Sequelize.STRING, allowNull: true },
            isRead: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            readAt: { type: Sequelize.DATE, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );

        await queryInterface.addIndex("notifications", ["userId", "isRead"], {
          name: "idx_notifications_user_read",
          transaction: t,
        });
      }

      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(queryInterface) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("notifications", { transaction: t }).catch(() => {});
      await queryInterface.dropTable("products", { transaction: t }).catch(() => {});
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },
};
