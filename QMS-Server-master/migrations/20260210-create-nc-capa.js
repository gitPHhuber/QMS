"use strict";

/**
 * Миграция: Несоответствия (NC) и Корректирующие/Предупреждающие действия (CAPA)
 * 
 * ISO 13485:
 *   §8.3   — Управление несоответствующей продукцией
 *   §8.5.2 — Корректирующие действия  
 *   §8.5.3 — Предупреждающие действия
 * 
 * Таблицы:
 *   nonconformities       — Реестр несоответствий
 *   nc_attachments        — Вложения к NC (фото, файлы)
 *   capas                 — Корректирующие/предупреждающие действия
 *   capa_actions          — Конкретные шаги внутри CAPA
 *   capa_verifications    — Проверки эффективности CAPA
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // ═══ 1. NONCONFORMITIES ═══
      await queryInterface.createTable("nonconformities", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        number: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true,
          comment: "Номер NC: NC-0001, NC-0002...",
        },
        title: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: false },
        source: {
          type: Sequelize.ENUM(
            "INCOMING_INSPECTION",  // Входной контроль
            "IN_PROCESS",           // В процессе производства
            "FINAL_INSPECTION",     // Выходной контроль
            "CUSTOMER_COMPLAINT",   // Жалоба потребителя
            "INTERNAL_AUDIT",       // Внутренний аудит
            "EXTERNAL_AUDIT",       // Внешний аудит
            "SUPPLIER",             // Претензия к поставщику
            "FIELD_RETURN",         // Возврат с эксплуатации
            "OTHER"
          ),
          allowNull: false,
        },
        classification: {
          type: Sequelize.ENUM("CRITICAL", "MAJOR", "MINOR"),
          allowNull: false,
          defaultValue: "MINOR",
        },
        status: {
          type: Sequelize.ENUM(
            "OPEN",           // Зарегистрировано
            "INVESTIGATING",  // Расследование
            "DISPOSITION",    // Решение принято
            "IMPLEMENTING",   // Выполняется решение
            "VERIFICATION",   // На проверке
            "CLOSED",         // Закрыто
            "REOPENED"        // Переоткрыто
          ),
          allowNull: false,
          defaultValue: "OPEN",
        },
        disposition: {
          type: Sequelize.ENUM(
            "USE_AS_IS",          // Использовать как есть (с обоснованием)
            "REWORK",             // Переделка
            "REPAIR",             // Ремонт
            "SCRAP",              // Утилизация
            "RETURN_TO_SUPPLIER", // Возврат поставщику
            "CONCESSION",         // Уступка (разрешение на отклонение)
            "OTHER"
          ),
          allowNull: true,
          comment: "Решение по несоответствующей продукции",
        },
        dispositionJustification: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: "Обоснование решения (особенно для USE_AS_IS)",
        },

        // Привязки
        productType: { type: Sequelize.STRING(100), allowNull: true },
        productSerialNumber: { type: Sequelize.STRING(100), allowNull: true },
        lotNumber: { type: Sequelize.STRING(100), allowNull: true },
        processName: { type: Sequelize.STRING(200), allowNull: true },
        supplierName: { type: Sequelize.STRING(200), allowNull: true },
        warehouseBoxId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: "Связь с warehouse_box (если NC по конкретной позиции склада)",
        },
        documentId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: "Связь с документом СМК (если NC по документу)",
        },

        // Количество
        totalQty: { type: Sequelize.INTEGER, allowNull: true, comment: "Общее кол-во в партии" },
        defectQty: { type: Sequelize.INTEGER, allowNull: true, comment: "Кол-во несоответствующих" },

        // Расследование
        rootCause: { type: Sequelize.TEXT, allowNull: true },
        rootCauseMethod: {
          type: Sequelize.STRING(50),
          allowNull: true,
          comment: "Метод анализа: 5WHY, FISHBONE, FMEA и т.д.",
        },
        immediateAction: { type: Sequelize.TEXT, allowNull: true, comment: "Немедленное корректирующее действие" },

        // Ответственные
        reportedById: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
        },
        assignedToId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
        },
        closedById: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
        },

        // Даты
        detectedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        dueDate: { type: Sequelize.DATEONLY, allowNull: true },
        closedAt: { type: Sequelize.DATE, allowNull: true },

        // Связь с CAPA
        capaRequired: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: "Требуется ли CAPA (обязательно для CRITICAL)",
        },

        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      }, { transaction });

      // ═══ 2. NC_ATTACHMENTS ═══
      await queryInterface.createTable("nc_attachments", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nonconformityId: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: "nonconformities", key: "id" }, onDelete: "CASCADE",
        },
        fileUrl: { type: Sequelize.STRING(1000), allowNull: false },
        fileName: { type: Sequelize.STRING(500), allowNull: false },
        fileSize: { type: Sequelize.INTEGER, allowNull: true },
        fileMimeType: { type: Sequelize.STRING(100), allowNull: true },
        description: { type: Sequelize.STRING(500), allowNull: true },
        uploadedById: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: "users", key: "id" },
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      }, { transaction });

      // ═══ 3. CAPAS ═══
      await queryInterface.createTable("capas", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        number: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true,
          comment: "Номер: CAPA-0001",
        },
        type: {
          type: Sequelize.ENUM("CORRECTIVE", "PREVENTIVE"),
          allowNull: false,
        },
        title: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        status: {
          type: Sequelize.ENUM(
            "INITIATED",      // Инициировано
            "INVESTIGATING",  // Расследование причин
            "PLANNING",       // Планирование действий
            "PLAN_APPROVED",  // План утверждён
            "IMPLEMENTING",   // Выполнение
            "VERIFYING",      // Проверка эффективности
            "EFFECTIVE",      // Эффективно
            "INEFFECTIVE",    // Неэффективно → переоткрытие
            "CLOSED"          // Закрыто
          ),
          allowNull: false,
          defaultValue: "INITIATED",
        },
        priority: {
          type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH", "URGENT"),
          allowNull: false,
          defaultValue: "MEDIUM",
        },

        // Связь с NC (может быть несколько NC → 1 CAPA)
        nonconformityId: {
          type: Sequelize.INTEGER, allowNull: true,
          references: { model: "nonconformities", key: "id" },
          comment: "Первичная NC, породившая CAPA",
        },

        // Анализ первопричины
        rootCauseAnalysis: { type: Sequelize.TEXT, allowNull: true },
        rootCauseMethod: { type: Sequelize.STRING(50), allowNull: true },

        // Ответственные
        initiatedById: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: "users", key: "id" },
        },
        assignedToId: {
          type: Sequelize.INTEGER, allowNull: true,
          references: { model: "users", key: "id" },
        },
        approvedById: {
          type: Sequelize.INTEGER, allowNull: true,
          references: { model: "users", key: "id" },
        },

        // Даты
        dueDate: { type: Sequelize.DATEONLY, allowNull: true },
        planApprovedAt: { type: Sequelize.DATE, allowNull: true },
        implementedAt: { type: Sequelize.DATE, allowNull: true },
        closedAt: { type: Sequelize.DATE, allowNull: true },

        // Проверка эффективности
        effectivenessCheckDate: {
          type: Sequelize.DATEONLY, allowNull: true,
          comment: "Дата плановой проверки эффективности (30/60/90 дней)",
        },
        effectivenessCheckDays: {
          type: Sequelize.INTEGER, allowNull: true, defaultValue: 90,
          comment: "Через сколько дней проверять эффективность",
        },

        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      }, { transaction });

      // ═══ 4. CAPA_ACTIONS — конкретные шаги ═══
      await queryInterface.createTable("capa_actions", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        capaId: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: "capas", key: "id" }, onDelete: "CASCADE",
        },
        order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        description: { type: Sequelize.TEXT, allowNull: false },
        assignedToId: {
          type: Sequelize.INTEGER, allowNull: true,
          references: { model: "users", key: "id" },
        },
        status: {
          type: Sequelize.ENUM("PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"),
          allowNull: false,
          defaultValue: "PLANNED",
        },
        dueDate: { type: Sequelize.DATEONLY, allowNull: true },
        completedAt: { type: Sequelize.DATE, allowNull: true },
        result: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      }, { transaction });

      // ═══ 5. CAPA_VERIFICATIONS — проверки эффективности ═══
      await queryInterface.createTable("capa_verifications", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        capaId: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: "capas", key: "id" }, onDelete: "CASCADE",
        },
        verifiedById: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: "users", key: "id" },
        },
        isEffective: { type: Sequelize.BOOLEAN, allowNull: false },
        evidence: { type: Sequelize.TEXT, allowNull: true, comment: "Доказательства эффективности" },
        comment: { type: Sequelize.TEXT, allowNull: true },
        verifiedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      }, { transaction });

      // ═══ Индексы ═══
      await queryInterface.addIndex("nonconformities", ["number"], { unique: true, transaction });
      await queryInterface.addIndex("nonconformities", ["status"], { transaction });
      await queryInterface.addIndex("nonconformities", ["source"], { transaction });
      await queryInterface.addIndex("nonconformities", ["classification"], { transaction });
      await queryInterface.addIndex("nonconformities", ["assignedToId"], { transaction });
      await queryInterface.addIndex("nonconformities", ["reportedById"], { transaction });
      await queryInterface.addIndex("nonconformities", ["detectedAt"], { transaction });

      await queryInterface.addIndex("capas", ["number"], { unique: true, transaction });
      await queryInterface.addIndex("capas", ["status"], { transaction });
      await queryInterface.addIndex("capas", ["type"], { transaction });
      await queryInterface.addIndex("capas", ["nonconformityId"], { transaction });
      await queryInterface.addIndex("capas", ["assignedToId"], { transaction });
      await queryInterface.addIndex("capas", ["effectivenessCheckDate"], { transaction });

      await queryInterface.addIndex("capa_actions", ["capaId", "order"], { transaction });
      await queryInterface.addIndex("capa_verifications", ["capaId"], { transaction });

      await transaction.commit();
      console.log("✅ Миграция NC/CAPA выполнена");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("capa_verifications", { transaction });
      await queryInterface.dropTable("capa_actions", { transaction });
      await queryInterface.dropTable("capas", { transaction });
      await queryInterface.dropTable("nc_attachments", { transaction });
      await queryInterface.dropTable("nonconformities", { transaction });

      for (const type of [
        "enum_nonconformities_source", "enum_nonconformities_classification",
        "enum_nonconformities_status", "enum_nonconformities_disposition",
        "enum_capas_type", "enum_capas_status", "enum_capas_priority",
        "enum_capa_actions_status",
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
