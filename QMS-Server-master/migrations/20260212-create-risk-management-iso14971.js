"use strict";

/**
 * Migratsiya: sozdaniye tablits ISO 14971 Risk Management File
 *
 * Novyye tablitsy:
 *   - risk_management_plans — Plan menedzhmenta riskov (§4.4)
 *   - hazards              — Analiz opasnostey (§5)
 *   - benefit_risk_analyses — Otsenka pol'zy/riska (§6.5)
 *   - risk_control_traceabilities — Proslezhivayemost' mer (§7, §8)
 *
 * Zavisimosti: tablitsy users, risk_registers, risk_mitigations dolzhny uzhe sushchestvovat'
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // =============================================================
      // RISK MANAGEMENT PLANS — ISO 14971 §4.4
      // =============================================================

      await queryInterface.createTable("risk_management_plans", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        planNumber: { type: Sequelize.STRING, unique: true, allowNull: false },
        title: { type: Sequelize.STRING(500), allowNull: false },
        version: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "1.0" },
        productName: { type: Sequelize.STRING(500), allowNull: false },
        productDescription: { type: Sequelize.TEXT },
        intendedUse: { type: Sequelize.TEXT, allowNull: false },
        intendedPatientPopulation: { type: Sequelize.TEXT },
        scope: { type: Sequelize.TEXT, allowNull: false },
        riskAcceptabilityCriteria: { type: Sequelize.JSON, allowNull: false },
        verificationPlanSummary: { type: Sequelize.TEXT },
        lifecyclePhase: {
          type: Sequelize.ENUM("CONCEPT", "DESIGN", "VERIFICATION", "VALIDATION", "PRODUCTION", "POST_MARKET"),
          allowNull: false,
          defaultValue: "CONCEPT",
        },
        status: {
          type: Sequelize.ENUM("DRAFT", "REVIEW", "APPROVED", "EFFECTIVE", "REVISION", "ARCHIVED"),
          defaultValue: "DRAFT",
        },
        responsiblePersonId: { type: Sequelize.INTEGER },
        approvedBy: { type: Sequelize.INTEGER },
        approvedAt: { type: Sequelize.DATE },
        effectiveDate: { type: Sequelize.DATE },
        nextReviewDate: { type: Sequelize.DATE },
        relatedProductId: { type: Sequelize.INTEGER },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // =============================================================
      // HAZARDS — ISO 14971 §5
      // =============================================================

      await queryInterface.createTable("hazards", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        riskManagementPlanId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "risk_management_plans", key: "id" },
          onDelete: "CASCADE",
        },
        hazardNumber: { type: Sequelize.STRING, allowNull: false },
        hazardCategory: {
          type: Sequelize.ENUM(
            "ENERGY", "BIOLOGICAL", "CHEMICAL", "OPERATIONAL",
            "INFORMATION", "ENVIRONMENTAL", "ELECTROMAGNETIC",
            "MECHANICAL", "THERMAL", "RADIATION", "SOFTWARE", "USE_ERROR"
          ),
          allowNull: false,
        },
        hazardDescription: { type: Sequelize.TEXT, allowNull: false },
        foreseeableSequence: { type: Sequelize.TEXT, allowNull: false },
        hazardousSituation: { type: Sequelize.TEXT, allowNull: false },
        harm: { type: Sequelize.TEXT, allowNull: false },
        severityOfHarm: { type: Sequelize.INTEGER, allowNull: false },
        probabilityOfOccurrence: { type: Sequelize.INTEGER, allowNull: false },
        probabilityOfHarm: { type: Sequelize.INTEGER },
        riskLevel: { type: Sequelize.INTEGER },
        riskClass: { type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL") },
        residualSeverity: { type: Sequelize.INTEGER },
        residualProbability: { type: Sequelize.INTEGER },
        residualRiskLevel: { type: Sequelize.INTEGER },
        residualRiskClass: { type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL") },
        status: {
          type: Sequelize.ENUM("IDENTIFIED", "ANALYZED", "CONTROLLED", "VERIFIED", "ACCEPTED", "MONITORING"),
          defaultValue: "IDENTIFIED",
        },
        linkedRiskRegisterId: {
          type: Sequelize.INTEGER,
          references: { model: "risk_registers", key: "id" },
          onDelete: "SET NULL",
        },
        isoClause: { type: Sequelize.STRING },
        notes: { type: Sequelize.TEXT },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // =============================================================
      // BENEFIT-RISK ANALYSES — ISO 14971 §6.5
      // =============================================================

      await queryInterface.createTable("benefit_risk_analyses", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        riskManagementPlanId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "risk_management_plans", key: "id" },
          onDelete: "CASCADE",
        },
        hazardId: {
          type: Sequelize.INTEGER,
          references: { model: "hazards", key: "id" },
          onDelete: "SET NULL",
        },
        analysisNumber: { type: Sequelize.STRING, allowNull: false },
        residualRiskDescription: { type: Sequelize.TEXT, allowNull: false },
        residualRiskClass: {
          type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
          allowNull: false,
        },
        clinicalBenefitDescription: { type: Sequelize.TEXT, allowNull: false },
        benefitJustification: { type: Sequelize.TEXT, allowNull: false },
        benefitOutweighsRisk: { type: Sequelize.BOOLEAN, allowNull: false },
        stateOfTheArt: { type: Sequelize.TEXT },
        alternativeSolutions: { type: Sequelize.TEXT },
        literatureReferences: { type: Sequelize.TEXT },
        conclusion: { type: Sequelize.TEXT, allowNull: false },
        assessorId: { type: Sequelize.INTEGER, allowNull: false },
        assessmentDate: { type: Sequelize.DATE, allowNull: false },
        reviewedBy: { type: Sequelize.INTEGER },
        reviewedAt: { type: Sequelize.DATE },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // =============================================================
      // RISK CONTROL TRACEABILITY — ISO 14971 §7, §8
      // =============================================================

      await queryInterface.createTable("risk_control_traceabilities", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        riskManagementPlanId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "risk_management_plans", key: "id" },
          onDelete: "CASCADE",
        },
        hazardId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "hazards", key: "id" },
          onDelete: "CASCADE",
        },
        traceNumber: { type: Sequelize.STRING, allowNull: false },
        controlMeasureDescription: { type: Sequelize.TEXT, allowNull: false },
        controlType: {
          type: Sequelize.ENUM("INHERENT_SAFETY", "PROTECTIVE", "INFORMATION"),
          allowNull: false,
        },
        controlPriority: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        implementationStatus: {
          type: Sequelize.ENUM("PLANNED", "IN_PROGRESS", "IMPLEMENTED", "VERIFIED", "INEFFECTIVE"),
          defaultValue: "PLANNED",
        },
        implementedDate: { type: Sequelize.DATE },
        implementedBy: { type: Sequelize.INTEGER },
        verificationMethod: { type: Sequelize.TEXT },
        verificationCriteria: { type: Sequelize.TEXT },
        verificationResult: {
          type: Sequelize.ENUM("PENDING", "PASS", "FAIL", "PARTIAL"),
          defaultValue: "PENDING",
        },
        verificationEvidence: { type: Sequelize.TEXT },
        verificationDate: { type: Sequelize.DATE },
        verifiedById: { type: Sequelize.INTEGER },
        residualRiskAcceptable: { type: Sequelize.BOOLEAN },
        newHazardsIntroduced: { type: Sequelize.BOOLEAN, defaultValue: false },
        newHazardDescription: { type: Sequelize.TEXT },
        linkedMitigationId: {
          type: Sequelize.INTEGER,
          references: { model: "risk_mitigations", key: "id" },
          onDelete: "SET NULL",
        },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });

      // =============================================================
      // INDEKSY
      // =============================================================

      await queryInterface.addIndex("risk_management_plans", ["status"], { name: "idx_rmp_status", transaction });
      await queryInterface.addIndex("risk_management_plans", ["responsiblePersonId"], { name: "idx_rmp_responsible", transaction });
      await queryInterface.addIndex("hazards", ["riskManagementPlanId"], { name: "idx_hazard_rmp", transaction });
      await queryInterface.addIndex("hazards", ["riskClass"], { name: "idx_hazard_risk_class", transaction });
      await queryInterface.addIndex("hazards", ["status"], { name: "idx_hazard_status", transaction });
      await queryInterface.addIndex("hazards", ["linkedRiskRegisterId"], { name: "idx_hazard_linked_risk", transaction });
      await queryInterface.addIndex("benefit_risk_analyses", ["riskManagementPlanId"], { name: "idx_bra_rmp", transaction });
      await queryInterface.addIndex("benefit_risk_analyses", ["hazardId"], { name: "idx_bra_hazard", transaction });
      await queryInterface.addIndex("risk_control_traceabilities", ["riskManagementPlanId"], { name: "idx_rct_rmp", transaction });
      await queryInterface.addIndex("risk_control_traceabilities", ["hazardId"], { name: "idx_rct_hazard", transaction });
      await queryInterface.addIndex("risk_control_traceabilities", ["implementationStatus"], { name: "idx_rct_impl_status", transaction });

      await transaction.commit();
      console.log("Migratsiya ISO 14971 vypolnena: 4 tablitsy sozdany (risk_management_plans, hazards, benefit_risk_analyses, risk_control_traceabilities)");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tables = [
        "risk_control_traceabilities",
        "benefit_risk_analyses",
        "hazards",
        "risk_management_plans",
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
