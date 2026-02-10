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

      if (!(await has("feature_flags"))) {
        await queryInterface.createTable(
          "feature_flags",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            code: { type: Sequelize.STRING(128), allowNull: false, unique: true },
            name: { type: Sequelize.STRING(255), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            scope: {
              type: Sequelize.ENUM("global", "module", "experiment"),
              allowNull: false,
              defaultValue: "module",
            },
            metadata: { type: Sequelize.JSON, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );
      }

      await t.commit();
      console.log("✅ [FeatureFlags] table created");
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(queryInterface) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("feature_flags", { transaction: t }).catch(() => {});
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_feature_flags_scope"',
        { transaction: t }
      ).catch(() => {});
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },
};
