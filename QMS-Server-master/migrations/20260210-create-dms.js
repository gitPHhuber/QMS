"use strict";

/**
 * Миграция: Система управления документами (DMS)
 * 
 * ISO 13485 §4.2.4: Организация должна иметь задокументированную процедуру
 * для управления документацией. Документы должны быть утверждены до выпуска,
 * пересматриваться и повторно утверждаться при необходимости.
 * 
 * Таблицы:
 *   - documents              — Реестр документов (код, тип, владелец)
 *   - document_versions      — Версии с файлами (1.0, 1.1, 2.0...)
 *   - document_approvals     — Цепочка согласования для каждой версии
 *   - document_distributions — Рассылка/ознакомление сотрудников
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // ═══ 1. DOCUMENTS — реестр документов ═══
      await queryInterface.createTable("documents", {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
          comment: "Уникальный код документа: СТО-СМК-001, РИ-ПР-003 и т.д.",
        },
        title: {
          type: Sequelize.STRING(500),
          allowNull: false,
        },
        type: {
          type: Sequelize.ENUM(
            "POLICY",           // Политика
            "MANUAL",           // Руководство по качеству
            "PROCEDURE",        // Стандарт организации (СТО / процедура)
            "WORK_INSTRUCTION", // Рабочая инструкция (РИ)
            "FORM",             // Форма / шаблон
            "RECORD",           // Запись (заполненная форма)
            "SPECIFICATION",    // Спецификация
            "PLAN",             // План качества
            "EXTERNAL",         // Внешний документ (ГОСТ, ТУ)
            "OTHER"
          ),
          allowNull: false,
        },
        category: {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: "Категория: Производство, Закупки, Управление рисками и т.д.",
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM(
            "DRAFT",      // Черновик — только автор видит
            "REVIEW",     // На согласовании
            "APPROVED",   // Утверждён (но ещё не введён)
            "EFFECTIVE",  // Действующий — основной рабочий статус
            "REVISION",   // На пересмотре (действующая версия остаётся)
            "OBSOLETE",   // Устарел — заменён новой версией
            "CANCELLED"   // Отменён
          ),
          allowNull: false,
          defaultValue: "DRAFT",
        },
        currentVersionId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: "FK на текущую действующую версию",
        },
        ownerId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          comment: "Владелец документа (ответственный за актуальность)",
        },
        reviewCycleMonths: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 12,
          comment: "Периодичность пересмотра в месяцах",
        },
        nextReviewDate: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          comment: "Дата следующего планового пересмотра",
        },
        effectiveDate: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          comment: "Дата введения в действие",
        },
        obsoleteDate: {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
        replacedById: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "documents", key: "id" },
          comment: "Каким документом заменён (если OBSOLETE)",
        },
        // Связь с ISO разделом
        isoSection: {
          type: Sequelize.STRING(20),
          allowNull: true,
          comment: "Раздел ISO 13485: 4.2, 7.5.1 и т.д.",
        },
        tags: {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: true,
          defaultValue: [],
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      }, { transaction });

      // ═══ 2. DOCUMENT_VERSIONS — версии документов ═══
      await queryInterface.createTable("document_versions", {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        documentId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "documents", key: "id" },
          onDelete: "CASCADE",
        },
        version: {
          type: Sequelize.STRING(20),
          allowNull: false,
          comment: "Номер версии: 1.0, 1.1, 2.0",
        },
        versionNumber: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: "Числовой номер для сортировки (1, 2, 3...)",
        },
        status: {
          type: Sequelize.ENUM("DRAFT", "REVIEW", "APPROVED", "EFFECTIVE", "SUPERSEDED", "REJECTED"),
          allowNull: false,
          defaultValue: "DRAFT",
        },
        changeDescription: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: "Описание изменений по сравнению с предыдущей версией",
        },
        fileUrl: {
          type: Sequelize.STRING(1000),
          allowNull: true,
          comment: "Путь к файлу документа",
        },
        fileName: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        fileSize: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        fileMimeType: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        fileHash: {
          type: Sequelize.STRING(64),
          allowNull: true,
          comment: "SHA-256 хеш файла — защита от подмены",
        },
        // Содержимое (для текстовых документов — хранение в БД)
        content: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: "Текстовое содержимое (для форм, шаблонов)",
        },
        createdById: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
        },
        approvedById: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
        },
        approvedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        effectiveAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        supersededAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      }, { transaction });

      // ═══ 3. DOCUMENT_APPROVALS — цепочка согласования ═══
      await queryInterface.createTable("document_approvals", {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        versionId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "document_versions", key: "id" },
          onDelete: "CASCADE",
        },
        step: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
          comment: "Порядковый номер шага согласования",
        },
        role: {
          type: Sequelize.ENUM(
            "REVIEWER",       // Проверяющий (может предложить правки)
            "APPROVER",       // Утверждающий (принимает решение)
            "QUALITY_OFFICER" // Уполномоченный по качеству (финальный)
          ),
          allowNull: false,
        },
        assignedToId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
        },
        decision: {
          type: Sequelize.ENUM("PENDING", "APPROVED", "REJECTED", "RETURNED"),
          allowNull: false,
          defaultValue: "PENDING",
        },
        comment: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        decidedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        dueDate: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          comment: "Срок рассмотрения",
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      }, { transaction });

      // ═══ 4. DOCUMENT_DISTRIBUTIONS — рассылка/ознакомление ═══
      await queryInterface.createTable("document_distributions", {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        versionId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "document_versions", key: "id" },
          onDelete: "CASCADE",
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
        },
        distributedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        acknowledged: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: "Сотрудник подтвердил ознакомление",
        },
        acknowledgedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      }, { transaction });

      // ═══ Индексы ═══
      await queryInterface.addIndex("documents", ["code"], { unique: true, transaction });
      await queryInterface.addIndex("documents", ["status"], { transaction });
      await queryInterface.addIndex("documents", ["type"], { transaction });
      await queryInterface.addIndex("documents", ["ownerId"], { transaction });
      await queryInterface.addIndex("documents", ["nextReviewDate"], { transaction });

      await queryInterface.addIndex("document_versions", ["documentId", "versionNumber"], {
        unique: true, transaction,
      });
      await queryInterface.addIndex("document_versions", ["status"], { transaction });

      await queryInterface.addIndex("document_approvals", ["versionId", "step"], { transaction });
      await queryInterface.addIndex("document_approvals", ["assignedToId", "decision"], { transaction });

      await queryInterface.addIndex("document_distributions", ["versionId", "userId"], {
        unique: true, transaction,
      });
      await queryInterface.addIndex("document_distributions", ["userId", "acknowledged"], { transaction });

      await transaction.commit();
      console.log("✅ Миграция DMS выполнена: documents, document_versions, document_approvals, document_distributions");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("document_distributions", { transaction });
      await queryInterface.dropTable("document_approvals", { transaction });
      await queryInterface.dropTable("document_versions", { transaction });
      await queryInterface.dropTable("documents", { transaction });

      // Cleanup ENUMs
      for (const type of [
        "enum_documents_type",
        "enum_documents_status",
        "enum_document_versions_status",
        "enum_document_approvals_role",
        "enum_document_approvals_decision",
      ]) {
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${type}";`, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
