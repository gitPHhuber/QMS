"use strict";

/**
 * Аудит: enforce append-only + архивная таблица для retention.
 *
 * Без изменения существующих API/DTO/моделей:
 * - Добавляет audit_logs_archive (для долгосрочного хранения)
 * - Блокирует UPDATE/DELETE в audit_logs на уровне БД
 * - Оставляет controlled bypass через session setting audit.allow_mutation=on
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const reg = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.audit_logs') AS t`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!reg?.[0]?.t) {
      console.log("⚠️ [audit-immutability] Таблица public.audit_logs не найдена — пропускаем миграцию");
      return;
    }

    const transaction = await queryInterface.sequelize.transaction();

    try {
      const hasArchive = await queryInterface.sequelize.query(
        `SELECT to_regclass('public.audit_logs_archive') AS t`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (!hasArchive?.[0]?.t) {
        await queryInterface.createTable(
          "audit_logs_archive",
          {
            id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
            sourceAuditId: { type: Sequelize.INTEGER, allowNull: false, unique: true },
            userId: { type: Sequelize.INTEGER, allowNull: true },
            action: { type: Sequelize.STRING(255), allowNull: false },
            entity: { type: Sequelize.STRING(255), allowNull: true },
            entityId: { type: Sequelize.STRING(255), allowNull: true },
            description: { type: Sequelize.TEXT, allowNull: true },
            metadata: { type: Sequelize.JSONB, allowNull: true },
            chainIndex: { type: Sequelize.BIGINT, allowNull: true },
            prevHash: { type: Sequelize.STRING(64), allowNull: true },
            currentHash: { type: Sequelize.STRING(64), allowNull: true },
            dataHash: { type: Sequelize.STRING(64), allowNull: true },
            signedBy: { type: Sequelize.INTEGER, allowNull: true },
            signedAt: { type: Sequelize.DATE, allowNull: true },
            severity: {
              type: Sequelize.ENUM("INFO", "WARNING", "CRITICAL", "SECURITY"),
              allowNull: false,
              defaultValue: "INFO",
            },
            createdAt: { type: Sequelize.DATE, allowNull: false },
            updatedAt: { type: Sequelize.DATE, allowNull: false },
            archivedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
          },
          { transaction }
        );
      }

      const indexes = await queryInterface.sequelize.query(
        `SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename='audit_logs_archive'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      const idx = new Set((indexes || []).map((r) => r.indexname));

      if (!idx.has("idx_audit_archive_created_at")) {
        await queryInterface.addIndex("audit_logs_archive", ["createdAt"], {
          name: "idx_audit_archive_created_at",
          transaction,
        });
      }
      if (!idx.has("idx_audit_archive_archived_at")) {
        await queryInterface.addIndex("audit_logs_archive", ["archivedAt"], {
          name: "idx_audit_archive_archived_at",
          transaction,
        });
      }
      if (!idx.has("idx_audit_archive_source_id")) {
        await queryInterface.addIndex("audit_logs_archive", ["sourceAuditId"], {
          name: "idx_audit_archive_source_id",
          unique: true,
          transaction,
        });
      }

      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE FUNCTION prevent_audit_logs_mutation()
        RETURNS trigger AS $$
        BEGIN
          IF current_setting('audit.allow_mutation', true) = 'on' THEN
            IF TG_OP = 'DELETE' THEN
              RETURN OLD;
            END IF;
            RETURN NEW;
          END IF;

          RAISE EXCEPTION 'audit_logs is append-only: % is not allowed', TG_OP;
        END;
        $$ LANGUAGE plpgsql;
        `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `DROP TRIGGER IF EXISTS trg_prevent_audit_logs_mutation ON audit_logs;`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
        CREATE TRIGGER trg_prevent_audit_logs_mutation
        BEFORE UPDATE OR DELETE ON audit_logs
        FOR EACH ROW
        EXECUTE FUNCTION prevent_audit_logs_mutation();
        `,
        { transaction }
      );

      await transaction.commit();
      console.log("✅ [audit-immutability] Append-only и archive storage настроены");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `DROP TRIGGER IF EXISTS trg_prevent_audit_logs_mutation ON audit_logs;`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `DROP FUNCTION IF EXISTS prevent_audit_logs_mutation();`,
        { transaction }
      );

      const reg = await queryInterface.sequelize.query(
        `SELECT to_regclass('public.audit_logs_archive') AS t`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (reg?.[0]?.t) {
        await queryInterface.dropTable("audit_logs_archive", { transaction });
      }

      await transaction.commit();
      console.log("✅ [audit-immutability] Down выполнен");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
