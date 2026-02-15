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

      // ─── RBAC: abilities / roles / role_abilities ───────────
      if (!(await has("abilities"))) {
        await queryInterface.createTable(
          "abilities",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            code: { type: Sequelize.STRING(128), allowNull: false, unique: true },
            description: { type: Sequelize.TEXT, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
      }

      if (!(await has("roles"))) {
        await queryInterface.createTable(
          "roles",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            code: { type: Sequelize.STRING(128), allowNull: false, unique: true },
            name: { type: Sequelize.STRING(255), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
      }

      if (!(await has("role_abilities"))) {
        await queryInterface.createTable(
          "role_abilities",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            roleId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "roles", key: "id" },
              onDelete: "CASCADE",
              onUpdate: "CASCADE",
            },
            abilityId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "abilities", key: "id" },
              onDelete: "CASCADE",
              onUpdate: "CASCADE",
            },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );

        await queryInterface.addIndex(
          "role_abilities",
          ["roleId", "abilityId"],
          { unique: true, name: "uq_role_abilities_role_ability", transaction: t }
        );
      }

      // ─── Structure: production_section / production_team ─────
      if (!(await has("production_section"))) {
        await queryInterface.createTable(
          "production_section",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            title: { type: Sequelize.STRING(255), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            managerId: { type: Sequelize.INTEGER, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
      }

      if (!(await has("production_team"))) {
        await queryInterface.createTable(
          "production_team",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            title: { type: Sequelize.STRING(255), allowNull: false },
            productionSectionId: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: "production_section", key: "id" },
              onDelete: "SET NULL",
              onUpdate: "CASCADE",
            },
            teamLeadId: { type: Sequelize.INTEGER, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
      }

      // ─── Users ───────────────────────────────────────────────
      if (!(await has("users"))) {
        await queryInterface.createTable(
          "users",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            email: { type: Sequelize.STRING(255), allowNull: true, unique: true },
            login: { type: Sequelize.STRING(255), allowNull: true, unique: true },
            password: { type: Sequelize.STRING(255), allowNull: true },
            name: { type: Sequelize.STRING(255), allowNull: true },
            surname: { type: Sequelize.STRING(255), allowNull: true },
            img: { type: Sequelize.STRING(255), allowNull: true },
            roleId: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: "roles", key: "id" },
              onDelete: "SET NULL",
              onUpdate: "CASCADE",
            },
            teamId: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: "production_team", key: "id" },
              onDelete: "SET NULL",
              onUpdate: "CASCADE",
            },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
      }

      // ─── PC / Session ────────────────────────────────────────
      if (!(await has("pcs"))) {
        await queryInterface.createTable(
          "pcs",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            pc_name: { type: Sequelize.STRING(255), allowNull: true },
            ip: { type: Sequelize.STRING(64), allowNull: true },
            cabinet: { type: Sequelize.STRING(255), allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
      }

      if (!(await has("sessions"))) {
        await queryInterface.createTable(
          "sessions",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            userId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "users", key: "id" },
              onDelete: "CASCADE",
              onUpdate: "CASCADE",
            },
            PCId: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: "pcs", key: "id" },
              onDelete: "SET NULL",
              onUpdate: "CASCADE",
            },
            online: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
      }

      // ─── audit_logs ──────────────────────────────────────────
      if (!(await has("audit_logs"))) {
        await queryInterface.createTable(
          "audit_logs",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            userId: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: "users", key: "id" },
              onDelete: "SET NULL",
              onUpdate: "CASCADE",
            },
            entity: { type: Sequelize.STRING(255), allowNull: true },
            entityId: { type: Sequelize.STRING(255), allowNull: true },
            action: { type: Sequelize.STRING(255), allowNull: true },
            description: { type: Sequelize.TEXT, allowNull: true },
            metadata: { type: Sequelize.JSON, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
      }

      // ─── FK constraints for circular references ──────────────
      // production_section.managerId -> users.id
      // production_team.teamLeadId -> users.id
      // These couldn't be added at table creation time because users
      // didn't exist yet. Add them now, checking existence first.

      const hasFk = async (constraintName) => {
        const [rows] = await queryInterface.sequelize.query(
          `SELECT 1 FROM information_schema.table_constraints
           WHERE constraint_name = '${constraintName}' AND constraint_type = 'FOREIGN KEY'
           LIMIT 1`,
          { transaction: t }
        );
        return rows.length > 0;
      };

      if (!(await hasFk("fk_production_section_managerId"))) {
        await queryInterface.addConstraint("production_section", {
          fields: ["managerId"],
          type: "foreign key",
          name: "fk_production_section_managerId",
          references: { table: "users", field: "id" },
          onDelete: "SET NULL",
          onUpdate: "CASCADE",
          transaction: t,
        });
      }

      if (!(await hasFk("fk_production_team_teamLeadId"))) {
        await queryInterface.addConstraint("production_team", {
          fields: ["teamLeadId"],
          type: "foreign key",
          name: "fk_production_team_teamLeadId",
          references: { table: "users", field: "id" },
          onDelete: "SET NULL",
          onUpdate: "CASCADE",
          transaction: t,
        });
      }

      await t.commit();
      console.log("✅ [CORE] базовые таблицы созданы");
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("audit_logs", { transaction: t }).catch(() => {});
      await queryInterface.dropTable("sessions", { transaction: t }).catch(() => {});
      await queryInterface.dropTable("pcs", { transaction: t }).catch(() => {});
      await queryInterface.dropTable("users", { transaction: t }).catch(() => {});
      await queryInterface.dropTable("production_team", { transaction: t }).catch(() => {});
      await queryInterface.dropTable("production_section", { transaction: t }).catch(() => {});
      await queryInterface.dropTable("role_abilities", { transaction: t }).catch(() => {});
      await queryInterface.dropTable("roles", { transaction: t }).catch(() => {});
      await queryInterface.dropTable("abilities", { transaction: t }).catch(() => {});
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },
};
