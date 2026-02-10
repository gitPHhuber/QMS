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

      // abilities
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

      // roles
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

      // role_abilities join
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

      await t.commit();
      console.log("✅ [RBAC] tables created");
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
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
