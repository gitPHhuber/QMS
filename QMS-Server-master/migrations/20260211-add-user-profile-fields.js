"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      const desc = await queryInterface.describeTable("users", { transaction: t });

      if (!desc.name) {
        await queryInterface.addColumn("users", "name", {
          type: Sequelize.STRING(255),
          allowNull: true,
        }, { transaction: t });
      }

      if (!desc.surname) {
        await queryInterface.addColumn("users", "surname", {
          type: Sequelize.STRING(255),
          allowNull: true,
        }, { transaction: t });
      }

      if (!desc.img) {
        await queryInterface.addColumn("users", "img", {
          type: Sequelize.STRING(255),
          allowNull: true,
        }, { transaction: t });
      }

      await t.commit();
      console.log("✅ [USERS] name, surname, img columns added");
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(queryInterface) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn("users", "img", { transaction: t }).catch(() => {});
      await queryInterface.removeColumn("users", "surname", { transaction: t }).catch(() => {});
      await queryInterface.removeColumn("users", "name", { transaction: t }).catch(() => {});
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },
};
