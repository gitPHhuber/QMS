"use strict";

/**
 * Миграция: создание таблиц P1+P2 модулей ASVO-QMS
 * 
 * P1: Risk Management, Supplier Management
 * P2: Internal Audits, Training, Equipment/Calibration, Management Review
 * 
 * Зависимости: таблицы users, documents, nonconformities, capas должны уже существовать
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // ═══════════════════════════════════════════════════════
      // P1: RISK MANAGEMENT (ISO 14971)
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("risk_registers", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        riskNumber: { type: Sequelize.STRING, unique: true, allowNull: false },
        title: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT },
        category: { type: Sequelize.ENUM("PRODUCT", "PROCESS", "SUPPLIER", "REGULATORY", "INFRASTRUCTURE", "HUMAN", "CYBER"), allowNull: false },
        relatedEntity: { type: Sequelize.STRING },
        relatedEntityId: { type: Sequelize.INTEGER },
        initialProbability: { type: Sequelize.INTEGER, allowNull: false },
        initialSeverity: { type: Sequelize.INTEGER, allowNull: false },
        initialRiskLevel: { type: Sequelize.INTEGER },
        initialRiskClass: { type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL") },
        residualProbability: { type: Sequelize.INTEGER },
        residualSeverity: { type: Sequelize.INTEGER },
        residualRiskLevel: { type: Sequelize.INTEGER },
        residualRiskClass: { type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL") },
        status: { type: Sequelize.ENUM("IDENTIFIED", "ASSESSED", "MITIGATED", "ACCEPTED", "CLOSED", "MONITORING"), defaultValue: "IDENTIFIED" },
        acceptanceDecision: { type: Sequelize.TEXT },
        acceptedBy: { type: Sequelize.INTEGER },
        acceptedAt: { type: Sequelize.DATE },
        ownerId: { type: Sequelize.INTEGER },
        reviewDate: { type: Sequelize.DATE },
        isoClause: { type: Sequelize.STRING },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.createTable("risk_assessments", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        riskRegisterId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "risk_registers", key: "id" } },
        assessmentDate: { type: Sequelize.DATE, allowNull: false },
        assessorId: { type: Sequelize.INTEGER, allowNull: false },
        probability: { type: Sequelize.INTEGER, allowNull: false },
        severity: { type: Sequelize.INTEGER, allowNull: false },
        detectability: { type: Sequelize.INTEGER },
        riskLevel: { type: Sequelize.INTEGER },
        riskClass: { type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL") },
        rationale: { type: Sequelize.TEXT },
        assessmentType: { type: Sequelize.ENUM("INITIAL", "PERIODIC", "POST_MITIGATION", "POST_INCIDENT"), defaultValue: "INITIAL" },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.createTable("risk_mitigations", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        riskRegisterId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "risk_registers", key: "id" } },
        mitigationType: { type: Sequelize.ENUM("DESIGN", "PROTECTIVE", "INFORMATION", "PROCESS_CONTROL", "TRAINING", "MONITORING"), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: false },
        responsibleId: { type: Sequelize.INTEGER },
        plannedDate: { type: Sequelize.DATE },
        completedDate: { type: Sequelize.DATE },
        status: { type: Sequelize.ENUM("PLANNED", "IN_PROGRESS", "COMPLETED", "VERIFIED", "INEFFECTIVE"), defaultValue: "PLANNED" },
        verifiedBy: { type: Sequelize.INTEGER },
        verifiedAt: { type: Sequelize.DATE },
        verificationNotes: { type: Sequelize.TEXT },
        capaId: { type: Sequelize.INTEGER },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // ═══════════════════════════════════════════════════════
      // P1: SUPPLIER MANAGEMENT (§7.4)
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("suppliers", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        code: { type: Sequelize.STRING, unique: true, allowNull: false },
        name: { type: Sequelize.STRING(500), allowNull: false },
        legalName: { type: Sequelize.STRING(500) },
        inn: { type: Sequelize.STRING(12) },
        address: { type: Sequelize.TEXT },
        contactPerson: { type: Sequelize.STRING },
        phone: { type: Sequelize.STRING },
        email: { type: Sequelize.STRING },
        website: { type: Sequelize.STRING },
        category: { type: Sequelize.ENUM("RAW_MATERIAL", "COMPONENT", "SERVICE", "EQUIPMENT", "PACKAGING", "SOFTWARE", "SUBCONTRACTOR"), allowNull: false },
        criticality: { type: Sequelize.ENUM("CRITICAL", "MAJOR", "MINOR"), defaultValue: "MAJOR" },
        qualificationStatus: { type: Sequelize.ENUM("PENDING", "QUALIFIED", "CONDITIONAL", "DISQUALIFIED", "SUSPENDED"), defaultValue: "PENDING" },
        qualifiedAt: { type: Sequelize.DATE },
        qualifiedBy: { type: Sequelize.INTEGER },
        nextEvaluationDate: { type: Sequelize.DATE },
        hasCertISO9001: { type: Sequelize.BOOLEAN, defaultValue: false },
        hasCertISO13485: { type: Sequelize.BOOLEAN, defaultValue: false },
        certExpiryDate: { type: Sequelize.DATE },
        overallScore: { type: Sequelize.FLOAT },
        notes: { type: Sequelize.TEXT },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.createTable("supplier_evaluations", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        supplierId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "suppliers", key: "id" } },
        evaluationDate: { type: Sequelize.DATE, allowNull: false },
        evaluatorId: { type: Sequelize.INTEGER, allowNull: false },
        evaluationType: { type: Sequelize.ENUM("INITIAL", "PERIODIC", "POST_INCIDENT", "REQUALIFICATION"), defaultValue: "PERIODIC" },
        qualityScore: { type: Sequelize.INTEGER },
        deliveryScore: { type: Sequelize.INTEGER },
        documentationScore: { type: Sequelize.INTEGER },
        communicationScore: { type: Sequelize.INTEGER },
        priceScore: { type: Sequelize.INTEGER },
        complianceScore: { type: Sequelize.INTEGER },
        totalScore: { type: Sequelize.FLOAT },
        decision: { type: Sequelize.ENUM("APPROVED", "CONDITIONALLY_APPROVED", "REJECTED", "SUSPENDED") },
        conditions: { type: Sequelize.TEXT },
        comments: { type: Sequelize.TEXT },
        totalOrders: { type: Sequelize.INTEGER, defaultValue: 0 },
        defectiveOrders: { type: Sequelize.INTEGER, defaultValue: 0 },
        lateDeliveries: { type: Sequelize.INTEGER, defaultValue: 0 },
        ncCount: { type: Sequelize.INTEGER, defaultValue: 0 },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.createTable("supplier_audits", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        supplierId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "suppliers", key: "id" } },
        auditDate: { type: Sequelize.DATE, allowNull: false },
        auditorId: { type: Sequelize.INTEGER, allowNull: false },
        auditType: { type: Sequelize.ENUM("ON_SITE", "REMOTE", "DOCUMENT"), defaultValue: "ON_SITE" },
        scope: { type: Sequelize.TEXT },
        findings: { type: Sequelize.TEXT },
        findingsCount: { type: Sequelize.INTEGER, defaultValue: 0 },
        majorFindings: { type: Sequelize.INTEGER, defaultValue: 0 },
        minorFindings: { type: Sequelize.INTEGER, defaultValue: 0 },
        result: { type: Sequelize.ENUM("PASS", "CONDITIONAL", "FAIL") },
        nextAuditDate: { type: Sequelize.DATE },
        reportUrl: { type: Sequelize.STRING },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // ═══════════════════════════════════════════════════════
      // P2: INTERNAL AUDITS (§8.2.4)
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("audit_plans", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        year: { type: Sequelize.INTEGER, allowNull: false },
        title: { type: Sequelize.STRING, allowNull: false },
        approvedBy: { type: Sequelize.INTEGER },
        approvedAt: { type: Sequelize.DATE },
        status: { type: Sequelize.ENUM("DRAFT", "APPROVED", "IN_PROGRESS", "COMPLETED"), defaultValue: "DRAFT" },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.createTable("audit_schedules", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        auditPlanId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "audit_plans", key: "id" } },
        auditNumber: { type: Sequelize.STRING, unique: true, allowNull: false },
        title: { type: Sequelize.STRING, allowNull: false },
        scope: { type: Sequelize.TEXT },
        isoClause: { type: Sequelize.STRING },
        plannedDate: { type: Sequelize.DATE, allowNull: false },
        actualDate: { type: Sequelize.DATE },
        leadAuditorId: { type: Sequelize.INTEGER },
        auditeeId: { type: Sequelize.INTEGER },
        status: { type: Sequelize.ENUM("PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "OVERDUE"), defaultValue: "PLANNED" },
        criteria: { type: Sequelize.TEXT },
        conclusion: { type: Sequelize.TEXT },
        reportUrl: { type: Sequelize.STRING },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.createTable("audit_findings", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        auditScheduleId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "audit_schedules", key: "id" } },
        findingNumber: { type: Sequelize.STRING, allowNull: false },
        type: { type: Sequelize.ENUM("MAJOR_NC", "MINOR_NC", "OBSERVATION", "OPPORTUNITY", "POSITIVE"), allowNull: false },
        isoClause: { type: Sequelize.STRING },
        description: { type: Sequelize.TEXT, allowNull: false },
        evidence: { type: Sequelize.TEXT },
        nonconformityId: { type: Sequelize.INTEGER },
        capaId: { type: Sequelize.INTEGER },
        responsibleId: { type: Sequelize.INTEGER },
        dueDate: { type: Sequelize.DATE },
        status: { type: Sequelize.ENUM("OPEN", "ACTION_REQUIRED", "CORRECTED", "VERIFIED", "CLOSED"), defaultValue: "OPEN" },
        closedBy: { type: Sequelize.INTEGER },
        closedAt: { type: Sequelize.DATE },
        closureNotes: { type: Sequelize.TEXT },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // ═══════════════════════════════════════════════════════
      // P2: TRAINING (§6.2)
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("training_plans", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        title: { type: Sequelize.STRING, allowNull: false },
        description: { type: Sequelize.TEXT },
        year: { type: Sequelize.INTEGER, allowNull: false },
        status: { type: Sequelize.ENUM("DRAFT", "APPROVED", "IN_PROGRESS", "COMPLETED"), defaultValue: "DRAFT" },
        approvedBy: { type: Sequelize.INTEGER },
        approvedAt: { type: Sequelize.DATE },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.createTable("training_records", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        userId: { type: Sequelize.INTEGER, allowNull: false },
        trainerId: { type: Sequelize.INTEGER },
        trainingPlanId: { type: Sequelize.INTEGER, references: { model: "training_plans", key: "id" } },
        title: { type: Sequelize.STRING, allowNull: false },
        description: { type: Sequelize.TEXT },
        type: { type: Sequelize.ENUM("ONBOARDING", "PROCEDURE", "EQUIPMENT", "GMP", "SAFETY", "REGULATORY", "SOFTWARE", "RETRAINING"), allowNull: false },
        relatedDocumentId: { type: Sequelize.INTEGER },
        trainingDate: { type: Sequelize.DATE, allowNull: false },
        duration: { type: Sequelize.FLOAT },
        assessmentMethod: { type: Sequelize.ENUM("TEST", "PRACTICAL", "OBSERVATION", "SELF_STUDY", "NONE"), defaultValue: "NONE" },
        assessmentScore: { type: Sequelize.FLOAT },
        passed: { type: Sequelize.BOOLEAN },
        confirmedBy: { type: Sequelize.INTEGER },
        confirmedAt: { type: Sequelize.DATE },
        certificateUrl: { type: Sequelize.STRING },
        expiryDate: { type: Sequelize.DATE },
        status: { type: Sequelize.ENUM("PLANNED", "COMPLETED", "FAILED", "EXPIRED"), defaultValue: "PLANNED" },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.createTable("competency_matrices", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        userId: { type: Sequelize.INTEGER, allowNull: false },
        processName: { type: Sequelize.STRING, allowNull: false },
        level: { type: Sequelize.ENUM("NONE", "AWARENESS", "TRAINED", "COMPETENT", "EXPERT"), defaultValue: "NONE" },
        requiredLevel: { type: Sequelize.ENUM("NONE", "AWARENESS", "TRAINED", "COMPETENT", "EXPERT"), defaultValue: "TRAINED" },
        lastTrainingDate: { type: Sequelize.DATE },
        nextTrainingDate: { type: Sequelize.DATE },
        notes: { type: Sequelize.TEXT },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // ═══════════════════════════════════════════════════════
      // P2: EQUIPMENT / CALIBRATION (§7.6)
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("equipment", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        inventoryNumber: { type: Sequelize.STRING, unique: true, allowNull: false },
        name: { type: Sequelize.STRING, allowNull: false },
        manufacturer: { type: Sequelize.STRING },
        model: { type: Sequelize.STRING },
        serialNumber: { type: Sequelize.STRING },
        type: { type: Sequelize.ENUM("MEASURING", "TEST", "PRODUCTION", "MONITORING", "IT"), allowNull: false },
        location: { type: Sequelize.STRING },
        responsibleId: { type: Sequelize.INTEGER },
        measuringRange: { type: Sequelize.STRING },
        accuracy: { type: Sequelize.STRING },
        resolution: { type: Sequelize.STRING },
        calibrationType: { type: Sequelize.ENUM("VERIFICATION", "CALIBRATION", "VALIDATION", "NONE"), defaultValue: "NONE" },
        calibrationInterval: { type: Sequelize.INTEGER },
        lastCalibrationDate: { type: Sequelize.DATE },
        nextCalibrationDate: { type: Sequelize.DATE },
        status: { type: Sequelize.ENUM("IN_SERVICE", "OUT_OF_SERVICE", "IN_CALIBRATION", "OVERDUE", "DECOMMISSIONED"), defaultValue: "IN_SERVICE" },
        commissionedDate: { type: Sequelize.DATE },
        decommissionedDate: { type: Sequelize.DATE },
        decommissionReason: { type: Sequelize.TEXT },
        certificateUrl: { type: Sequelize.STRING },
        notes: { type: Sequelize.TEXT },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.createTable("calibration_records", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        equipmentId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "equipment", key: "id" } },
        calibrationDate: { type: Sequelize.DATE, allowNull: false },
        performedBy: { type: Sequelize.STRING },
        performedById: { type: Sequelize.INTEGER },
        type: { type: Sequelize.ENUM("VERIFICATION", "CALIBRATION", "ADJUSTMENT"), allowNull: false },
        result: { type: Sequelize.ENUM("PASS", "FAIL", "ADJUSTED", "OUT_OF_TOLERANCE"), allowNull: false },
        measuredValues: { type: Sequelize.JSON },
        certificateNumber: { type: Sequelize.STRING },
        certificateUrl: { type: Sequelize.STRING },
        nextCalibrationDate: { type: Sequelize.DATE },
        impactAssessment: { type: Sequelize.TEXT },
        ncCreated: { type: Sequelize.BOOLEAN, defaultValue: false },
        nonconformityId: { type: Sequelize.INTEGER },
        notes: { type: Sequelize.TEXT },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // ═══════════════════════════════════════════════════════
      // P2: MANAGEMENT REVIEW (§5.6)
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("management_reviews", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        reviewNumber: { type: Sequelize.STRING, unique: true, allowNull: false },
        title: { type: Sequelize.STRING, allowNull: false },
        reviewDate: { type: Sequelize.DATE, allowNull: false },
        periodFrom: { type: Sequelize.DATE, allowNull: false },
        periodTo: { type: Sequelize.DATE, allowNull: false },
        chairpersonId: { type: Sequelize.INTEGER },
        participants: { type: Sequelize.JSON },
        status: { type: Sequelize.ENUM("PLANNED", "IN_PROGRESS", "COMPLETED", "APPROVED"), defaultValue: "PLANNED" },
        inputData: { type: Sequelize.JSON },
        outputData: { type: Sequelize.JSON },
        conclusion: { type: Sequelize.TEXT },
        qmsEffectiveness: { type: Sequelize.ENUM("EFFECTIVE", "PARTIALLY_EFFECTIVE", "INEFFECTIVE") },
        minutesUrl: { type: Sequelize.STRING },
        approvedBy: { type: Sequelize.INTEGER },
        approvedAt: { type: Sequelize.DATE },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      await queryInterface.createTable("review_actions", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        managementReviewId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "management_reviews", key: "id" } },
        description: { type: Sequelize.TEXT, allowNull: false },
        responsibleId: { type: Sequelize.INTEGER },
        deadline: { type: Sequelize.DATE },
        priority: { type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH"), defaultValue: "MEDIUM" },
        category: { type: Sequelize.ENUM("IMPROVEMENT", "RESOURCE", "TRAINING", "PROCESS_CHANGE", "POLICY", "INFRASTRUCTURE") },
        status: { type: Sequelize.ENUM("OPEN", "IN_PROGRESS", "COMPLETED", "OVERDUE", "CANCELLED"), defaultValue: "OPEN" },
        completedAt: { type: Sequelize.DATE },
        completionNotes: { type: Sequelize.TEXT },
        capaId: { type: Sequelize.INTEGER },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // ═══════════════════════════════════════════════════════
      // ИНДЕКСЫ
      // ═══════════════════════════════════════════════════════
      
      await queryInterface.addIndex("risk_registers", ["status"], { name: "idx_risk_status", transaction });
      await queryInterface.addIndex("risk_registers", ["initialRiskClass"], { name: "idx_risk_class", transaction });
      await queryInterface.addIndex("risk_registers", ["ownerId"], { name: "idx_risk_owner", transaction });
      await queryInterface.addIndex("suppliers", ["qualificationStatus"], { name: "idx_supplier_status", transaction });
      await queryInterface.addIndex("suppliers", ["category"], { name: "idx_supplier_category", transaction });
      await queryInterface.addIndex("equipment", ["status"], { name: "idx_equip_status", transaction });
      await queryInterface.addIndex("equipment", ["nextCalibrationDate"], { name: "idx_equip_next_cal", transaction });
      await queryInterface.addIndex("training_records", ["userId"], { name: "idx_training_user", transaction });
      await queryInterface.addIndex("competency_matrices", ["userId", "processName"], { name: "idx_competency_user_process", unique: true, transaction });

      await transaction.commit();
      console.log("✅ Миграция P1+P2 модулей выполнена: 17 таблиц создано");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tables = [
        "review_actions", "management_reviews",
        "calibration_records", "equipment",
        "competency_matrices", "training_records", "training_plans",
        "audit_findings", "audit_schedules", "audit_plans",
        "supplier_audits", "supplier_evaluations", "suppliers",
        "risk_mitigations", "risk_assessments", "risk_registers",
      ];
      for (const t of tables) {
        await queryInterface.dropTable(t, { transaction, cascade: true });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
