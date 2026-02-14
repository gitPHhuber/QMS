"use strict";

/**
 * Миграция: все доработки модулей QMS
 *
 * Phase 1: DMF sections + Product enhancements
 * Phase 2: Training plan items
 * Phase 3: Validation protocol templates + checklists
 * Phase 4: Change impact items + ChangeRequest enhancements
 * Phase 5: DHR (Device History Records) — ISO 13485 §7.5.9
 * Phase 6: Environmental monitoring — ISO 13485 §6.4
 * Phase 7: Customer requirements — ISO 13485 §7.2
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // ═══════════════════════════════════════════════════════
      // PHASE 1: DMF Sections + Product fields
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("dmf_sections", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        productId: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: "products", key: "id" },
          onDelete: "CASCADE",
        },
        sectionCode: {
          type: Sequelize.ENUM(
            "DEVICE_DESCRIPTION", "DESIGN_SPECS", "MANUFACTURING", "RISK_ANALYSIS",
            "VERIFICATION", "VALIDATION", "LABELING", "IOM", "BIOCOMPATIBILITY",
            "ELECTRICAL_SAFETY", "EMC", "SOFTWARE", "STERILIZATION",
            "CLINICAL_EVALUATION", "POST_MARKET", "REGULATORY_SUBMISSION"
          ),
          allowNull: false,
        },
        title: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT },
        status: {
          type: Sequelize.ENUM("NOT_STARTED", "IN_PROGRESS", "COMPLETE", "NEEDS_UPDATE"),
          defaultValue: "NOT_STARTED",
        },
        documentIds: { type: Sequelize.JSONB, defaultValue: [] },
        sortOrder: { type: Sequelize.INTEGER, defaultValue: 0 },
        lastReviewedAt: { type: Sequelize.DATE },
        lastReviewedById: { type: Sequelize.INTEGER },
        notes: { type: Sequelize.TEXT },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.addIndex("dmf_sections", ["productId"], { name: "idx_dmf_sections_product", transaction });

      // Add new columns to products
      await queryInterface.addColumn("products", "dmfStatus", {
        type: Sequelize.ENUM("NOT_STARTED", "IN_PROGRESS", "COMPLETE", "NEEDS_UPDATE"),
        defaultValue: "NOT_STARTED",
      }, { transaction });
      await queryInterface.addColumn("products", "intendedUse", { type: Sequelize.TEXT }, { transaction });
      await queryInterface.addColumn("products", "indicationsForUse", { type: Sequelize.TEXT }, { transaction });
      await queryInterface.addColumn("products", "contraindications", { type: Sequelize.TEXT }, { transaction });

      // ═══════════════════════════════════════════════════════
      // PHASE 2: Training Plan Items
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("training_plan_items", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        trainingPlanId: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: "training_plans", key: "id" },
          onDelete: "CASCADE",
        },
        title: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT },
        type: {
          type: Sequelize.ENUM("ONBOARDING", "PROCEDURE", "EQUIPMENT", "GMP", "SAFETY", "REGULATORY", "SOFTWARE", "RETRAINING"),
          allowNull: false,
        },
        scheduledMonth: { type: Sequelize.INTEGER, allowNull: false },
        scheduledQuarter: { type: Sequelize.INTEGER, allowNull: false },
        targetUserIds: { type: Sequelize.JSONB, defaultValue: [] },
        targetDepartment: { type: Sequelize.STRING },
        responsibleId: { type: Sequelize.INTEGER },
        trainerId: { type: Sequelize.INTEGER },
        durationHours: { type: Sequelize.FLOAT },
        relatedDocumentId: { type: Sequelize.INTEGER },
        status: {
          type: Sequelize.ENUM("PLANNED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "OVERDUE"),
          defaultValue: "PLANNED",
        },
        completedDate: { type: Sequelize.DATEONLY },
        linkedRecordIds: { type: Sequelize.JSONB, defaultValue: [] },
        notes: { type: Sequelize.TEXT },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.addIndex("training_plan_items", ["trainingPlanId"], { name: "idx_training_plan_items_plan", transaction });

      // ═══════════════════════════════════════════════════════
      // PHASE 3: Validation Protocol Templates + Checklists
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("validation_protocol_templates", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        templateNumber: { type: Sequelize.STRING, unique: true, allowNull: false },
        title: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT },
        phase: { type: Sequelize.ENUM("IQ", "OQ", "PQ"), allowNull: false },
        version: { type: Sequelize.STRING(10), defaultValue: "1.0" },
        status: { type: Sequelize.ENUM("DRAFT", "APPROVED", "OBSOLETE"), defaultValue: "DRAFT" },
        checklistTemplate: { type: Sequelize.JSONB, defaultValue: [] },
        createdById: { type: Sequelize.INTEGER },
        approvedById: { type: Sequelize.INTEGER },
        approvedAt: { type: Sequelize.DATE },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.createTable("validation_checklists", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        processValidationId: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: "process_validations", key: "id" },
          onDelete: "CASCADE",
        },
        templateId: { type: Sequelize.INTEGER },
        phase: { type: Sequelize.ENUM("IQ", "OQ", "PQ"), allowNull: false },
        title: { type: Sequelize.STRING(500), allowNull: false },
        status: {
          type: Sequelize.ENUM("NOT_STARTED", "IN_PROGRESS", "PASSED", "FAILED"),
          defaultValue: "NOT_STARTED",
        },
        executedById: { type: Sequelize.INTEGER },
        executedAt: { type: Sequelize.DATE },
        reviewedById: { type: Sequelize.INTEGER },
        reviewedAt: { type: Sequelize.DATE },
        notes: { type: Sequelize.TEXT },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.addIndex("validation_checklists", ["processValidationId"], { name: "idx_val_checklists_pv", transaction });

      await queryInterface.createTable("validation_checklist_items", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        checklistId: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: "validation_checklists", key: "id" },
          onDelete: "CASCADE",
        },
        sortOrder: { type: Sequelize.INTEGER, defaultValue: 0 },
        title: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT },
        acceptanceCriteria: { type: Sequelize.TEXT, allowNull: false },
        isMandatory: { type: Sequelize.BOOLEAN, defaultValue: true },
        result: {
          type: Sequelize.ENUM("PENDING", "PASS", "FAIL", "N_A"),
          defaultValue: "PENDING",
        },
        actualValue: { type: Sequelize.TEXT },
        deviation: { type: Sequelize.TEXT },
        evidenceDocumentId: { type: Sequelize.INTEGER },
        executedById: { type: Sequelize.INTEGER },
        executedAt: { type: Sequelize.DATE },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.addIndex("validation_checklist_items", ["checklistId"], { name: "idx_val_cl_items_checklist", transaction });

      // ═══════════════════════════════════════════════════════
      // PHASE 4: Change Impact Items + ChangeRequest enhancements
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("change_impact_items", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        changeRequestId: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: "change_requests", key: "id" },
          onDelete: "CASCADE",
        },
        impactArea: {
          type: Sequelize.ENUM(
            "PRODUCT_SAFETY", "PRODUCT_PERFORMANCE", "MANUFACTURING", "QUALITY_SYSTEM",
            "DOCUMENTATION", "LABELING", "REGULATORY", "SUPPLIER",
            "TRAINING", "VALIDATION", "RISK", "CLINICAL"
          ),
          allowNull: false,
        },
        impactLevel: {
          type: Sequelize.ENUM("NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"),
          allowNull: false,
        },
        description: { type: Sequelize.TEXT, allowNull: false },
        mitigationPlan: { type: Sequelize.TEXT },
        affectedProductId: { type: Sequelize.INTEGER },
        affectedDocumentId: { type: Sequelize.INTEGER },
        assessedById: { type: Sequelize.INTEGER },
        assessedAt: { type: Sequelize.DATE },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.addIndex("change_impact_items", ["changeRequestId"], { name: "idx_change_impact_cr", transaction });

      // Add new columns to change_requests
      await queryInterface.addColumn("change_requests", "regulatoryDossierImpact", {
        type: Sequelize.ENUM("NONE", "NOTIFICATION_ONLY", "VARIATION", "NEW_SUBMISSION"),
        defaultValue: "NONE",
      }, { transaction });
      await queryInterface.addColumn("change_requests", "regulatoryDossierNotes", { type: Sequelize.TEXT }, { transaction });
      await queryInterface.addColumn("change_requests", "overallImpactLevel", {
        type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
      }, { transaction });
      await queryInterface.addColumn("change_requests", "affectedProductIds", { type: Sequelize.JSONB, defaultValue: [] }, { transaction });
      await queryInterface.addColumn("change_requests", "affectedDocumentIds", { type: Sequelize.JSONB, defaultValue: [] }, { transaction });

      // ═══════════════════════════════════════════════════════
      // PHASE 5: DHR — Device History Records (ISO 13485 §7.5.9)
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("device_history_records", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        dhrNumber: { type: Sequelize.STRING, unique: true, allowNull: false },
        productId: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: "products", key: "id" },
        },
        serialNumber: { type: Sequelize.STRING },
        lotNumber: { type: Sequelize.STRING },
        batchSize: { type: Sequelize.INTEGER },
        productionStartDate: { type: Sequelize.DATEONLY },
        productionEndDate: { type: Sequelize.DATEONLY },
        dmrVersion: { type: Sequelize.STRING },
        status: {
          type: Sequelize.ENUM(
            "IN_PRODUCTION", "QC_PENDING", "QC_PASSED", "QC_FAILED",
            "RELEASED", "ON_HOLD", "QUARANTINE", "RETURNED", "RECALLED"
          ),
          defaultValue: "IN_PRODUCTION",
        },
        qcInspectorId: { type: Sequelize.INTEGER },
        qcDate: { type: Sequelize.DATE },
        qcNotes: { type: Sequelize.TEXT },
        releasedById: { type: Sequelize.INTEGER },
        releasedAt: { type: Sequelize.DATE },
        warehouseBoxId: { type: Sequelize.INTEGER },
        notes: { type: Sequelize.TEXT },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.addIndex("device_history_records", ["productId"], { name: "idx_dhr_product", transaction });
      await queryInterface.addIndex("device_history_records", ["serialNumber"], { name: "idx_dhr_serial", transaction });
      await queryInterface.addIndex("device_history_records", ["lotNumber"], { name: "idx_dhr_lot", transaction });
      await queryInterface.addIndex("device_history_records", ["status"], { name: "idx_dhr_status", transaction });

      await queryInterface.createTable("dhr_material_traces", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        dhrId: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: "device_history_records", key: "id" },
          onDelete: "CASCADE",
        },
        materialType: {
          type: Sequelize.ENUM("COMPONENT", "RAW_MATERIAL", "SUBASSEMBLY", "PACKAGING"),
          allowNull: false,
        },
        description: { type: Sequelize.STRING(500), allowNull: false },
        partNumber: { type: Sequelize.STRING },
        lotNumber: { type: Sequelize.STRING },
        serialNumber: { type: Sequelize.STRING },
        supplierId: { type: Sequelize.INTEGER },
        supplierName: { type: Sequelize.STRING },
        warehouseBoxId: { type: Sequelize.INTEGER },
        supplyId: { type: Sequelize.INTEGER },
        quantity: { type: Sequelize.FLOAT },
        unit: { type: Sequelize.STRING, defaultValue: "pcs" },
        certificateDocumentId: { type: Sequelize.INTEGER },
        notes: { type: Sequelize.TEXT },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.addIndex("dhr_material_traces", ["dhrId"], { name: "idx_dhr_mat_dhr", transaction });

      await queryInterface.createTable("dhr_process_steps", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        dhrId: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: "device_history_records", key: "id" },
          onDelete: "CASCADE",
        },
        stepOrder: { type: Sequelize.INTEGER, allowNull: false },
        stepName: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT },
        operatorId: { type: Sequelize.INTEGER },
        startedAt: { type: Sequelize.DATE },
        completedAt: { type: Sequelize.DATE },
        equipmentId: { type: Sequelize.INTEGER },
        result: {
          type: Sequelize.ENUM("PENDING", "PASS", "FAIL", "REWORK", "N_A"),
          defaultValue: "PENDING",
        },
        measurements: { type: Sequelize.JSONB },
        linkedNcId: { type: Sequelize.INTEGER },
        notes: { type: Sequelize.TEXT },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.addIndex("dhr_process_steps", ["dhrId"], { name: "idx_dhr_steps_dhr", transaction });

      // ═══════════════════════════════════════════════════════
      // PHASE 6: Environmental Monitoring (ISO 13485 §6.4)
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("environmental_monitoring_points", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        pointCode: { type: Sequelize.STRING, unique: true, allowNull: false },
        name: { type: Sequelize.STRING, allowNull: false },
        location: { type: Sequelize.STRING, allowNull: false },
        roomClassification: {
          type: Sequelize.ENUM("ISO_5", "ISO_6", "ISO_7", "ISO_8", "CONTROLLED", "UNCONTROLLED"),
        },
        monitoredParameters: { type: Sequelize.JSONB, defaultValue: [] },
        monitoringFrequency: {
          type: Sequelize.ENUM("CONTINUOUS", "HOURLY", "DAILY", "WEEKLY", "MONTHLY"),
          defaultValue: "DAILY",
        },
        status: {
          type: Sequelize.ENUM("ACTIVE", "INACTIVE", "MAINTENANCE"),
          defaultValue: "ACTIVE",
        },
        equipmentId: { type: Sequelize.INTEGER },
        responsibleId: { type: Sequelize.INTEGER },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.createTable("environmental_readings", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        monitoringPointId: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: "environmental_monitoring_points", key: "id" },
          onDelete: "CASCADE",
        },
        parameter: { type: Sequelize.STRING, allowNull: false },
        value: { type: Sequelize.FLOAT, allowNull: false },
        unit: { type: Sequelize.STRING, allowNull: false },
        withinSpec: { type: Sequelize.BOOLEAN, allowNull: false },
        readingAt: { type: Sequelize.DATE, allowNull: false },
        recordedById: { type: Sequelize.INTEGER },
        linkedNcId: { type: Sequelize.INTEGER },
        notes: { type: Sequelize.TEXT },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.addIndex("environmental_readings", ["monitoringPointId"], { name: "idx_env_readings_point", transaction });
      await queryInterface.addIndex("environmental_readings", ["readingAt"], { name: "idx_env_readings_time", transaction });

      // ═══════════════════════════════════════════════════════
      // PHASE 7: Customer Requirements (ISO 13485 §7.2)
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("customer_requirements", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        requirementNumber: { type: Sequelize.STRING, unique: true, allowNull: false },
        productId: { type: Sequelize.INTEGER },
        source: {
          type: Sequelize.ENUM("CONTRACT", "TENDER", "REGULATORY", "MARKET_RESEARCH", "CUSTOMER_FEEDBACK", "STANDARDS"),
          allowNull: false,
        },
        title: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT },
        customerName: { type: Sequelize.STRING },
        priority: {
          type: Sequelize.ENUM("MUST", "SHOULD", "COULD", "WONT"),
          defaultValue: "MUST",
        },
        status: {
          type: Sequelize.ENUM("CAPTURED", "REVIEWED", "ACCEPTED", "REJECTED", "IMPLEMENTED", "VERIFIED"),
          defaultValue: "CAPTURED",
        },
        reviewedById: { type: Sequelize.INTEGER },
        reviewedAt: { type: Sequelize.DATE },
        reviewNotes: { type: Sequelize.TEXT },
        linkedDesignInputId: { type: Sequelize.INTEGER },
        responsibleId: { type: Sequelize.INTEGER },
        dueDate: { type: Sequelize.DATEONLY },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.addIndex("customer_requirements", ["productId"], { name: "idx_cust_req_product", transaction });
      await queryInterface.addIndex("customer_requirements", ["status"], { name: "idx_cust_req_status", transaction });

      await transaction.commit();
      console.log("Migration complete: DMF sections, Training plan items, Validation protocols, Change impacts, DHR, Environmental monitoring, Customer requirements");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("customer_requirements", { transaction, cascade: true });
      await queryInterface.dropTable("environmental_readings", { transaction, cascade: true });
      await queryInterface.dropTable("environmental_monitoring_points", { transaction, cascade: true });
      await queryInterface.dropTable("dhr_process_steps", { transaction, cascade: true });
      await queryInterface.dropTable("dhr_material_traces", { transaction, cascade: true });
      await queryInterface.dropTable("device_history_records", { transaction, cascade: true });
      await queryInterface.dropTable("change_impact_items", { transaction, cascade: true });
      await queryInterface.removeColumn("change_requests", "affectedDocumentIds", { transaction });
      await queryInterface.removeColumn("change_requests", "affectedProductIds", { transaction });
      await queryInterface.removeColumn("change_requests", "overallImpactLevel", { transaction });
      await queryInterface.removeColumn("change_requests", "regulatoryDossierNotes", { transaction });
      await queryInterface.removeColumn("change_requests", "regulatoryDossierImpact", { transaction });
      await queryInterface.dropTable("validation_checklist_items", { transaction, cascade: true });
      await queryInterface.dropTable("validation_checklists", { transaction, cascade: true });
      await queryInterface.dropTable("validation_protocol_templates", { transaction, cascade: true });
      await queryInterface.dropTable("training_plan_items", { transaction, cascade: true });
      await queryInterface.removeColumn("products", "contraindications", { transaction });
      await queryInterface.removeColumn("products", "indicationsForUse", { transaction });
      await queryInterface.removeColumn("products", "intendedUse", { transaction });
      await queryInterface.removeColumn("products", "dmfStatus", { transaction });
      await queryInterface.dropTable("dmf_sections", { transaction, cascade: true });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
