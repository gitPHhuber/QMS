"use strict";

/**
 * Миграция: добавление hash-chain полей в таблицу audit_logs
 *
 * Фикс: migration-safe для пустой БД
 * - если таблицы audit_logs нет (после db:drop/db:create) → миграция НЕ падает, а пропускается
 * - down тоже безопасный
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // ✅ GUARD: таблица должна существовать (иначе после db:create база пустая)
    const reg = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.audit_logs') AS t`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!reg?.[0]?.t) {
      console.log("⚠️ [audit-hashchain] Таблица public.audit_logs не найдена — пропускаем миграцию");
      return;
    }

    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Можно дополнительно защититься от частично применённых изменений
      const table = await queryInterface.describeTable("audit_logs");

      // 1) chain-поля
      if (!table.chainIndex) {
        await queryInterface.addColumn(
          "audit_logs",
          "chainIndex",
          {
            type: Sequelize.BIGINT,
            allowNull: true, // nullable для старых записей
            unique: true,
          },
          { transaction }
        );
      }

      if (!table.prevHash) {
        await queryInterface.addColumn(
          "audit_logs",
          "prevHash",
          {
            type: Sequelize.STRING(64),
            allowNull: true,
          },
          { transaction }
        );
      }

      if (!table.currentHash) {
        await queryInterface.addColumn(
          "audit_logs",
          "currentHash",
          {
            type: Sequelize.STRING(64),
            allowNull: true,
          },
          { transaction }
        );
      }

      if (!table.dataHash) {
        await queryInterface.addColumn(
          "audit_logs",
          "dataHash",
          {
            type: Sequelize.STRING(64),
            allowNull: true,
          },
          { transaction }
        );
      }

      // 2) подпись (будущее)
      if (!table.signedBy) {
        await queryInterface.addColumn(
          "audit_logs",
          "signedBy",
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: "userId кто подтвердил запись (электронная подпись)",
          },
          { transaction }
        );
      }

      if (!table.signedAt) {
        await queryInterface.addColumn(
          "audit_logs",
          "signedAt",
          {
            type: Sequelize.DATE,
            allowNull: true,
          },
          { transaction }
        );
      }

      // 3) severity (ENUM)
      if (!table.severity) {
        await queryInterface.addColumn(
          "audit_logs",
          "severity",
          {
            type: Sequelize.ENUM("INFO", "WARNING", "CRITICAL", "SECURITY"),
            allowNull: false,
            defaultValue: "INFO",
          },
          { transaction }
        );
      }

      // 4) Индексы (создаём только если их нет)
      // PostgreSQL: безопасно проверяем через pg_indexes
      const indexes = await queryInterface.sequelize.query(
        `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'audit_logs'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      const idx = new Set((indexes || []).map((r) => r.indexname));

      if (!idx.has("idx_audit_chain_index")) {
        await queryInterface.addIndex(
          "audit_logs",
          ["chainIndex"],
          {
            name: "idx_audit_chain_index",
            unique: true,
            // частичный индекс: только где chainIndex не null
            where: { chainIndex: { [Sequelize.Op.ne]: null } },
            transaction,
          }
        );
      }

      if (!idx.has("idx_audit_current_hash")) {
        await queryInterface.addIndex(
          "audit_logs",
          ["currentHash"],
          { name: "idx_audit_current_hash", transaction }
        );
      }

      if (!idx.has("idx_audit_severity")) {
        await queryInterface.addIndex(
          "audit_logs",
          ["severity"],
          { name: "idx_audit_severity", transaction }
        );
      }

      if (!idx.has("idx_audit_entity_lookup")) {
        await queryInterface.addIndex(
          "audit_logs",
          ["entity", "entityId"],
          { name: "idx_audit_entity_lookup", transaction }
        );
      }

      if (!idx.has("idx_audit_created_at")) {
        await queryInterface.addIndex(
          "audit_logs",
          ["createdAt"],
          { name: "idx_audit_created_at", transaction }
        );
      }

      await transaction.commit();
      console.log("✅ [audit-hashchain] Миграция выполнена успешно");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // ✅ GUARD: если таблицы нет — просто выходим
    const reg = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.audit_logs') AS t`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (!reg?.[0]?.t) {
      console.log("⚠️ [audit-hashchain] Таблица public.audit_logs не найдена — down пропускаем");
      return;
    }

    const transaction = await queryInterface.sequelize.transaction();

    try {
      // removeIndex не любит, когда индекса нет → проверим
      const indexes = await queryInterface.sequelize.query(
        `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'audit_logs'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      const idx = new Set((indexes || []).map((r) => r.indexname));

      if (idx.has("idx_audit_created_at")) {
        await queryInterface.removeIndex("audit_logs", "idx_audit_created_at", { transaction });
      }
      if (idx.has("idx_audit_entity_lookup")) {
        await queryInterface.removeIndex("audit_logs", "idx_audit_entity_lookup", { transaction });
      }
      if (idx.has("idx_audit_severity")) {
        await queryInterface.removeIndex("audit_logs", "idx_audit_severity", { transaction });
      }
      if (idx.has("idx_audit_current_hash")) {
        await queryInterface.removeIndex("audit_logs", "idx_audit_current_hash", { transaction });
      }
      if (idx.has("idx_audit_chain_index")) {
        await queryInterface.removeIndex("audit_logs", "idx_audit_chain_index", { transaction });
      }

      // Колонки удаляем только если они есть
      const table = await queryInterface.describeTable("audit_logs");

      if (table.severity) {
        await queryInterface.removeColumn("audit_logs", "severity", { transaction });
      }
      if (table.signedAt) {
        await queryInterface.removeColumn("audit_logs", "signedAt", { transaction });
      }
      if (table.signedBy) {
        await queryInterface.removeColumn("audit_logs", "signedBy", { transaction });
      }
      if (table.dataHash) {
        await queryInterface.removeColumn("audit_logs", "dataHash", { transaction });
      }
      if (table.currentHash) {
        await queryInterface.removeColumn("audit_logs", "currentHash", { transaction });
      }
      if (table.prevHash) {
        await queryInterface.removeColumn("audit_logs", "prevHash", { transaction });
      }
      if (table.chainIndex) {
        await queryInterface.removeColumn("audit_logs", "chainIndex", { transaction });
      }

      // ENUM type может остаться — удаляем аккуратно
      // В Postgres имя enum-типа для столбца severity обычно: enum_audit_logs_severity
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_audit_logs_severity";',
        { transaction }
      );

      await transaction.commit();
      console.log("✅ [audit-hashchain] Down выполнен успешно");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
