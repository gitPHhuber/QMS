"use strict";

/**
 * Миграция: создание таблиц change_requests, process_validations
 * и добавление недостающих колонок в audit_findings.
 *
 * Устраняет 500-ошибки на эндпоинтах:
 *   /api/change-requests, /api/process-validations, /api/internal-audits/schedules
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // ═══════════════════════════════════════════════════════
      // 1. CHANGE REQUESTS (ISO 13485 §7.3.9)
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("change_requests", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        changeNumber: { type: Sequelize.STRING, unique: true, allowNull: false },
        title: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: false },
        justification: { type: Sequelize.TEXT, allowNull: false },
        type: {
          type: Sequelize.ENUM("DESIGN", "PROCESS", "DOCUMENT", "SUPPLIER", "SOFTWARE", "MATERIAL", "OTHER"),
          allowNull: false,
        },
        priority: {
          type: Sequelize.ENUM("CRITICAL", "HIGH", "MEDIUM", "LOW"),
          defaultValue: "MEDIUM",
        },
        category: {
          type: Sequelize.ENUM("MAJOR", "MINOR"),
          allowNull: false,
        },
        impactAssessment: { type: Sequelize.TEXT },
        riskAssessment: { type: Sequelize.TEXT },
        affectedProducts: { type: Sequelize.TEXT },
        affectedDocuments: { type: Sequelize.TEXT },
        affectedProcesses: { type: Sequelize.TEXT },
        regulatoryImpact: { type: Sequelize.BOOLEAN, defaultValue: false },
        status: {
          type: Sequelize.ENUM(
            "DRAFT", "SUBMITTED", "IMPACT_REVIEW", "APPROVED",
            "IN_PROGRESS", "VERIFICATION", "COMPLETED", "REJECTED", "CANCELLED"
          ),
          defaultValue: "DRAFT",
        },
        initiatorId: { type: Sequelize.INTEGER, allowNull: false },
        reviewerId: { type: Sequelize.INTEGER },
        approverId: { type: Sequelize.INTEGER },
        approvedAt: { type: Sequelize.DATE },
        verificationMethod: { type: Sequelize.TEXT },
        verificationResult: { type: Sequelize.TEXT },
        verifiedById: { type: Sequelize.INTEGER },
        verifiedAt: { type: Sequelize.DATE },
        plannedDate: { type: Sequelize.DATEONLY },
        completedDate: { type: Sequelize.DATEONLY },
        linkedNcId: { type: Sequelize.INTEGER },
        linkedCapaId: { type: Sequelize.INTEGER },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.addIndex("change_requests", ["status"], { name: "idx_change_request_status", transaction });
      await queryInterface.addIndex("change_requests", ["initiatorId"], { name: "idx_change_request_initiator", transaction });

      // ═══════════════════════════════════════════════════════
      // 2. PROCESS VALIDATIONS (ISO 13485 §7.5.6)
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("process_validations", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        validationNumber: { type: Sequelize.STRING, unique: true, allowNull: false },
        processName: { type: Sequelize.STRING, allowNull: false },
        processOwner: { type: Sequelize.STRING },
        description: { type: Sequelize.TEXT },
        iqStatus: {
          type: Sequelize.ENUM("NOT_STARTED", "IN_PROGRESS", "PASSED", "FAILED", "N_A"),
          defaultValue: "NOT_STARTED",
        },
        iqDate: { type: Sequelize.DATEONLY },
        iqDocumentId: { type: Sequelize.INTEGER },
        oqStatus: {
          type: Sequelize.ENUM("NOT_STARTED", "IN_PROGRESS", "PASSED", "FAILED", "N_A"),
          defaultValue: "NOT_STARTED",
        },
        oqDate: { type: Sequelize.DATEONLY },
        oqDocumentId: { type: Sequelize.INTEGER },
        pqStatus: {
          type: Sequelize.ENUM("NOT_STARTED", "IN_PROGRESS", "PASSED", "FAILED", "N_A"),
          defaultValue: "NOT_STARTED",
        },
        pqDate: { type: Sequelize.DATEONLY },
        pqDocumentId: { type: Sequelize.INTEGER },
        status: {
          type: Sequelize.ENUM(
            "PLANNED", "IQ_PHASE", "OQ_PHASE", "PQ_PHASE",
            "VALIDATED", "REVALIDATION_DUE", "EXPIRED", "FAILED"
          ),
          defaultValue: "PLANNED",
        },
        validatedAt: { type: Sequelize.DATE },
        revalidationIntervalMonths: { type: Sequelize.INTEGER, defaultValue: 12 },
        nextRevalidationDate: { type: Sequelize.DATEONLY },
        equipmentIds: { type: Sequelize.TEXT },
        responsibleId: { type: Sequelize.INTEGER },
        approvedById: { type: Sequelize.INTEGER },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.addIndex("process_validations", ["status"], { name: "idx_process_validation_status", transaction });

      // ═══════════════════════════════════════════════════════
      // 3. AUDIT FINDINGS — добавить недостающие колонки
      // ═══════════════════════════════════════════════════════

      await queryInterface.addColumn("audit_findings", "correctiveAction", {
        type: Sequelize.TEXT,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("audit_findings", "verificationNotes", {
        type: Sequelize.TEXT,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("audit_findings", "followUpStatus", {
        type: Sequelize.ENUM("OPEN", "IN_PROGRESS", "CLOSED", "OVERDUE", "ESCALATED"),
        defaultValue: "OPEN",
        allowNull: true,
      }, { transaction });

      await transaction.commit();
      console.log("✅ Миграция выполнена: таблицы change_requests, process_validations созданы; audit_findings дополнен");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Удаляем колонки audit_findings
      await queryInterface.removeColumn("audit_findings", "followUpStatus", { transaction });
      await queryInterface.removeColumn("audit_findings", "verificationNotes", { transaction });
      await queryInterface.removeColumn("audit_findings", "correctiveAction", { transaction });
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS "enum_audit_findings_followUpStatus";`,
        { transaction }
      );

      // Удаляем таблицы
      await queryInterface.dropTable("process_validations", { transaction, cascade: true });
      await queryInterface.dropTable("change_requests", { transaction, cascade: true });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
