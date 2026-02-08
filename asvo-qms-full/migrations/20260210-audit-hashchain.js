"use strict";

/**
 * Миграция: добавление hash-chain полей в таблицу audit_logs
 * 
 * ISO 13485 §4.2.5 требует защиту записей от несанкционированного изменения.
 * Hash-chain гарантирует: если кто-то изменит/удалит запись в середине цепочки,
 * верификация покажет разрыв.
 * 
 * Схема: каждая запись содержит:
 *   - chainIndex: порядковый номер в цепочке (глобальный автоинкремент)
 *   - prevHash:   SHA-256 хеш предыдущей записи
 *   - currentHash: SHA-256 хеш текущей записи (включая prevHash)
 *   - dataHash:   SHA-256 только данных записи (без chain-полей)
 * 
 * Начальная запись (genesis): prevHash = "0".repeat(64)
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Добавляем chain-поля
      await queryInterface.addColumn("audit_logs", "chainIndex", {
        type: Sequelize.BIGINT,
        allowNull: true, // nullable для старых записей
        unique: true,
      }, { transaction });

      await queryInterface.addColumn("audit_logs", "prevHash", {
        type: Sequelize.STRING(64),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("audit_logs", "currentHash", {
        type: Sequelize.STRING(64),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("audit_logs", "dataHash", {
        type: Sequelize.STRING(64),
        allowNull: true,
      }, { transaction });

      // 2. Добавляем поле signature для электронной подписи (будущее)
      await queryInterface.addColumn("audit_logs", "signedBy", {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: "userId кто подтвердил запись (электронная подпись)",
      }, { transaction });

      await queryInterface.addColumn("audit_logs", "signedAt", {
        type: Sequelize.DATE,
        allowNull: true,
      }, { transaction });

      // 3. Добавляем поле severity для QMS-классификации
      await queryInterface.addColumn("audit_logs", "severity", {
        type: Sequelize.ENUM("INFO", "WARNING", "CRITICAL", "SECURITY"),
        allowNull: false,
        defaultValue: "INFO",
      }, { transaction });

      // 4. Индексы для производительности
      await queryInterface.addIndex("audit_logs", ["chainIndex"], {
        name: "idx_audit_chain_index",
        unique: true,
        where: { chainIndex: { [Sequelize.Op.ne]: null } },
        transaction,
      });

      await queryInterface.addIndex("audit_logs", ["currentHash"], {
        name: "idx_audit_current_hash",
        transaction,
      });

      await queryInterface.addIndex("audit_logs", ["severity"], {
        name: "idx_audit_severity",
        transaction,
      });

      await queryInterface.addIndex("audit_logs", ["entity", "entityId"], {
        name: "idx_audit_entity_lookup",
        transaction,
      });

      await queryInterface.addIndex("audit_logs", ["createdAt"], {
        name: "idx_audit_created_at",
        transaction,
      });

      // 5. Бэкфилл: пересчитываем хеши для существующих записей
      // Это делается отдельным скриптом после миграции: scripts/backfill-audit-hashes.js

      await transaction.commit();
      console.log("✅ Миграция audit-hashchain выполнена успешно");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeIndex("audit_logs", "idx_audit_created_at", { transaction });
      await queryInterface.removeIndex("audit_logs", "idx_audit_entity_lookup", { transaction });
      await queryInterface.removeIndex("audit_logs", "idx_audit_severity", { transaction });
      await queryInterface.removeIndex("audit_logs", "idx_audit_current_hash", { transaction });
      await queryInterface.removeIndex("audit_logs", "idx_audit_chain_index", { transaction });

      await queryInterface.removeColumn("audit_logs", "severity", { transaction });
      await queryInterface.removeColumn("audit_logs", "signedAt", { transaction });
      await queryInterface.removeColumn("audit_logs", "signedBy", { transaction });
      await queryInterface.removeColumn("audit_logs", "dataHash", { transaction });
      await queryInterface.removeColumn("audit_logs", "currentHash", { transaction });
      await queryInterface.removeColumn("audit_logs", "prevHash", { transaction });
      await queryInterface.removeColumn("audit_logs", "chainIndex", { transaction });

      // Удаляем ENUM тип
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_audit_logs_severity";',
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
