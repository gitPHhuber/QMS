"use strict";

/**
 * Component CORE — привести component_catalog к модели ComponentCatalog (ComponentModels.js)
 * Важно: НЕ добавляем "name" (его нет в модели, а сиды его не заполняют).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      const hasTable = async (name) => {
        const r = await queryInterface.sequelize.query(
          `SELECT to_regclass('public.${name}') AS t`,
          { type: Sequelize.QueryTypes.SELECT, transaction: t }
        );
        return !!r?.[0]?.t;
      };

      if (!(await hasTable("component_catalog"))) {
        await queryInterface.createTable(
          "component_catalog",
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },

            // enum как в модели (строкой, enum-тип создастся на стороне PG)
            type: {
              type: Sequelize.ENUM(
                "CPU", "RAM", "HDD", "SSD", "NVME", "MOTHERBOARD", "GPU", "NIC",
                "RAID", "PSU", "FAN", "BMC", "BACKPLANE", "CABLE", "CHASSIS", "OTHER"
              ),
              allowNull: false,
            },

            manufacturer: { type: Sequelize.STRING(100), allowNull: true },

            // ⚠️ в модели allowNull: false
            model: { type: Sequelize.STRING(150), allowNull: false },

            revision: { type: Sequelize.STRING(50), allowNull: true },
            partNumber: { type: Sequelize.STRING(100), allowNull: true },

            // JSONB + default {} как в модели
            specifications: { type: Sequelize.JSONB, allowNull: true, defaultValue: {} },

            serialNumberPattern: { type: Sequelize.STRING(100), allowNull: true },

            // в модели default true
            isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },

            notes: { type: Sequelize.TEXT, allowNull: true },

            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction: t }
        );

        // Индексы как в модели
        await queryInterface.addIndex("component_catalog", ["type"], { transaction: t });
        await queryInterface.addIndex("component_catalog", ["manufacturer"], { transaction: t });
        await queryInterface.addIndex("component_catalog", ["model"], { transaction: t });
        await queryInterface.addIndex(
          "component_catalog",
          ["type", "manufacturer", "model"],
          { unique: true, name: "component_catalog_unique", transaction: t }
        );

        console.log("✅ [Component CORE] component_catalog created (matches model)");
      } else {
        // Если таблица уже есть (на всякий) — добавляем недостающие поля под сиды/модель.
        // (В твоём сценарии ты всё равно делаешь db:drop, так что этот блок почти не нужен, но пусть будет безопасно.)
        const table = await queryInterface.describeTable("component_catalog");

        const addIfMissing = async (col, def) => {
          if (!table[col]) {
            await queryInterface.addColumn("component_catalog", col, def, { transaction: t });
            console.log(`✅ [Component CORE] added column: ${col}`);
          }
        };

        await addIfMissing("manufacturer", { type: Sequelize.STRING(100), allowNull: true });
        await addIfMissing("model", { type: Sequelize.STRING(150), allowNull: false, defaultValue: "UNKNOWN" });
        await addIfMissing("revision", { type: Sequelize.STRING(50), allowNull: true });
        await addIfMissing("partNumber", { type: Sequelize.STRING(100), allowNull: true });
        await addIfMissing("specifications", { type: Sequelize.JSONB, allowNull: true, defaultValue: {} });
        await addIfMissing("serialNumberPattern", { type: Sequelize.STRING(100), allowNull: true });
        await addIfMissing("isActive", { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true });
        await addIfMissing("notes", { type: Sequelize.TEXT, allowNull: true });
      }

      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("component_catalog", { transaction: t }).catch(() => {});

      // Удаляем enum-тип, который создастся для поля type
      // Имя обычно вида enum_component_catalog_type
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_component_catalog_type";',
        { transaction: t }
      );

      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },
};
