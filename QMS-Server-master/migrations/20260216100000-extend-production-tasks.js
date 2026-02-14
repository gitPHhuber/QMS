"use strict";

/**
 * MES Module — Extend production_tasks with MES-specific columns
 *
 * Adds DMR link, process route, batch/serial tracking, scheduling,
 * yield metrics, and launch audit fields.
 *
 * All new columns are nullable for backward compatibility.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      const hasColumn = async (table, column) => {
        try {
          const desc = await queryInterface.describeTable(table);
          return !!desc[column];
        } catch {
          return false;
        }
      };

      if (!(await hasColumn("production_tasks", "dmrId"))) {
        await queryInterface.addColumn("production_tasks", "dmrId", {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "device_master_records", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        }, { transaction: t });
      }

      if (!(await hasColumn("production_tasks", "dmrVersion"))) {
        await queryInterface.addColumn("production_tasks", "dmrVersion", {
          type: Sequelize.STRING(20),
          allowNull: true,
        }, { transaction: t });
      }

      if (!(await hasColumn("production_tasks", "processRouteId"))) {
        await queryInterface.addColumn("production_tasks", "processRouteId", {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "process_routes", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        }, { transaction: t });
      }

      if (!(await hasColumn("production_tasks", "batchNumber"))) {
        await queryInterface.addColumn("production_tasks", "batchNumber", {
          type: Sequelize.STRING(50),
          allowNull: true,
        }, { transaction: t });
      }

      if (!(await hasColumn("production_tasks", "serialNumberPrefix"))) {
        await queryInterface.addColumn("production_tasks", "serialNumberPrefix", {
          type: Sequelize.STRING(30),
          allowNull: true,
        }, { transaction: t });
      }

      if (!(await hasColumn("production_tasks", "orderType"))) {
        await queryInterface.addColumn("production_tasks", "orderType", {
          type: Sequelize.STRING(30),
          allowNull: true,
          defaultValue: "STANDARD",
        }, { transaction: t });
      }

      if (!(await hasColumn("production_tasks", "plannedStartDate"))) {
        await queryInterface.addColumn("production_tasks", "plannedStartDate", {
          type: Sequelize.DATEONLY,
          allowNull: true,
        }, { transaction: t });
      }

      if (!(await hasColumn("production_tasks", "plannedEndDate"))) {
        await queryInterface.addColumn("production_tasks", "plannedEndDate", {
          type: Sequelize.DATEONLY,
          allowNull: true,
        }, { transaction: t });
      }

      if (!(await hasColumn("production_tasks", "actualStartDate"))) {
        await queryInterface.addColumn("production_tasks", "actualStartDate", {
          type: Sequelize.DATEONLY,
          allowNull: true,
        }, { transaction: t });
      }

      if (!(await hasColumn("production_tasks", "actualEndDate"))) {
        await queryInterface.addColumn("production_tasks", "actualEndDate", {
          type: Sequelize.DATEONLY,
          allowNull: true,
        }, { transaction: t });
      }

      if (!(await hasColumn("production_tasks", "yieldTarget"))) {
        await queryInterface.addColumn("production_tasks", "yieldTarget", {
          type: Sequelize.FLOAT,
          allowNull: true,
          defaultValue: 100,
        }, { transaction: t });
      }

      if (!(await hasColumn("production_tasks", "completedQty"))) {
        await queryInterface.addColumn("production_tasks", "completedQty", {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 0,
        }, { transaction: t });
      }

      if (!(await hasColumn("production_tasks", "scrapQty"))) {
        await queryInterface.addColumn("production_tasks", "scrapQty", {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 0,
        }, { transaction: t });
      }

      if (!(await hasColumn("production_tasks", "launchedById"))) {
        await queryInterface.addColumn("production_tasks", "launchedById", {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        }, { transaction: t });
      }

      if (!(await hasColumn("production_tasks", "launchedAt"))) {
        await queryInterface.addColumn("production_tasks", "launchedAt", {
          type: Sequelize.DATE,
          allowNull: true,
        }, { transaction: t });
      }

      await t.commit();
      console.log("✅ [MES-EXTEND] production_tasks extended with MES columns");
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      const columns = [
        "launchedAt", "launchedById", "scrapQty", "completedQty",
        "yieldTarget", "actualEndDate", "actualStartDate",
        "plannedEndDate", "plannedStartDate", "orderType",
        "serialNumberPrefix", "batchNumber", "processRouteId",
        "dmrVersion", "dmrId",
      ];
      for (const col of columns) {
        await queryInterface.removeColumn("production_tasks", col, { transaction: t }).catch(() => {});
      }
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },
};
