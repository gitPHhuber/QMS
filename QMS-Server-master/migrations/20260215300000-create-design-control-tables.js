"use strict";

/**
 * Migration: create Design Control tables (ISO 13485 §7.3)
 *
 * Tables:
 *   - design_projects        — main design project entity
 *   - design_inputs          — design requirements / inputs
 *   - design_outputs         — design deliverables / outputs
 *   - design_reviews         — phase-gate and peer reviews
 *   - design_verifications   — testing / inspection of outputs
 *   - design_validations     — real-world validation
 *   - design_transfers       — transfer to production
 *   - design_changes         — design change notices
 *
 * Dependencies: users, risk_registers tables must already exist
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // ═══════════════════════════════════════════════════════
      // DESIGN_PROJECTS
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("design_projects", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        number: { type: Sequelize.STRING(20), allowNull: false, unique: true },
        title: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        productType: { type: Sequelize.STRING(200), allowNull: true },
        regulatoryClass: {
          type: Sequelize.ENUM("CLASS_I", "CLASS_IIA", "CLASS_IIB", "CLASS_III"),
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM(
            "PLANNING", "INPUTS_DEFINED", "DESIGN_IN_PROGRESS",
            "REVIEW", "VERIFICATION", "VALIDATION",
            "TRANSFER", "CLOSED", "CANCELLED"
          ),
          allowNull: false,
          defaultValue: "PLANNING",
        },
        phase: { type: Sequelize.STRING(100), allowNull: true },
        ownerId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "RESTRICT",
        },
        teamLeadId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
          onDelete: "SET NULL",
        },
        plannedStartDate: { type: Sequelize.DATEONLY, allowNull: true },
        plannedEndDate: { type: Sequelize.DATEONLY, allowNull: true },
        actualStartDate: { type: Sequelize.DATEONLY, allowNull: true },
        actualEndDate: { type: Sequelize.DATEONLY, allowNull: true },
        riskFileId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "risk_registers", key: "id" },
          onDelete: "SET NULL",
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      }, { transaction });

      // ═══════════════════════════════════════════════════════
      // DESIGN_INPUTS
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("design_inputs", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        designProjectId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "design_projects", key: "id" },
          onDelete: "CASCADE",
        },
        category: {
          type: Sequelize.ENUM("FUNCTIONAL", "PERFORMANCE", "SAFETY", "REGULATORY", "STANDARDS", "USABILITY", "OTHER"),
          allowNull: false,
        },
        title: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        source: { type: Sequelize.STRING(200), allowNull: true },
        priority: {
          type: Sequelize.ENUM("MUST_HAVE", "SHOULD_HAVE", "NICE_TO_HAVE"),
          allowNull: false,
          defaultValue: "MUST_HAVE",
        },
        status: {
          type: Sequelize.ENUM("DRAFT", "APPROVED", "REVISED"),
          allowNull: false,
          defaultValue: "DRAFT",
        },
        addedById: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "RESTRICT",
        },
        approvedById: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
          onDelete: "SET NULL",
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      }, { transaction });

      // ═══════════════════════════════════════════════════════
      // DESIGN_OUTPUTS
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("design_outputs", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        designProjectId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "design_projects", key: "id" },
          onDelete: "CASCADE",
        },
        designInputId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "design_inputs", key: "id" },
          onDelete: "SET NULL",
        },
        category: {
          type: Sequelize.ENUM("SPECIFICATION", "DRAWING", "SOFTWARE", "PROCEDURE", "LABELING", "PACKAGING", "OTHER"),
          allowNull: false,
        },
        title: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        documentRef: { type: Sequelize.STRING(500), allowNull: true },
        status: {
          type: Sequelize.ENUM("DRAFT", "IN_REVIEW", "APPROVED", "RELEASED"),
          allowNull: false,
          defaultValue: "DRAFT",
        },
        createdById: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "RESTRICT",
        },
        approvedById: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
          onDelete: "SET NULL",
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      }, { transaction });

      // ═══════════════════════════════════════════════════════
      // DESIGN_REVIEWS
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("design_reviews", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        designProjectId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "design_projects", key: "id" },
          onDelete: "CASCADE",
        },
        reviewType: {
          type: Sequelize.ENUM("PHASE_GATE", "PEER_REVIEW", "FORMAL_REVIEW", "MANAGEMENT_REVIEW"),
          allowNull: false,
        },
        phase: { type: Sequelize.STRING(100), allowNull: true },
        title: { type: Sequelize.STRING(500), allowNull: false },
        scheduledDate: { type: Sequelize.DATEONLY, allowNull: true },
        actualDate: { type: Sequelize.DATEONLY, allowNull: true },
        status: {
          type: Sequelize.ENUM("PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"),
          allowNull: false,
          defaultValue: "PLANNED",
        },
        outcome: {
          type: Sequelize.ENUM("APPROVED", "APPROVED_WITH_CONDITIONS", "REJECTED"),
          allowNull: true,
        },
        summary: { type: Sequelize.TEXT, allowNull: true },
        actionItems: { type: Sequelize.TEXT, allowNull: true },
        chairId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "RESTRICT",
        },
        participants: { type: Sequelize.JSONB, allowNull: true, defaultValue: [] },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      }, { transaction });

      // ═══════════════════════════════════════════════════════
      // DESIGN_VERIFICATIONS
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("design_verifications", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        designProjectId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "design_projects", key: "id" },
          onDelete: "CASCADE",
        },
        designOutputId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "design_outputs", key: "id" },
          onDelete: "SET NULL",
        },
        method: {
          type: Sequelize.ENUM("TESTING", "INSPECTION", "ANALYSIS", "DEMONSTRATION", "SIMULATION"),
          allowNull: false,
        },
        title: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        acceptanceCriteria: { type: Sequelize.TEXT, allowNull: true },
        results: { type: Sequelize.TEXT, allowNull: true },
        status: {
          type: Sequelize.ENUM("PLANNED", "IN_PROGRESS", "PASSED", "FAILED", "DEFERRED"),
          allowNull: false,
          defaultValue: "PLANNED",
        },
        performedById: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
          onDelete: "SET NULL",
        },
        verifiedDate: { type: Sequelize.DATE, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      }, { transaction });

      // ═══════════════════════════════════════════════════════
      // DESIGN_VALIDATIONS
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("design_validations", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        designProjectId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "design_projects", key: "id" },
          onDelete: "CASCADE",
        },
        method: {
          type: Sequelize.ENUM(
            "CLINICAL_EVALUATION", "USABILITY_TESTING", "BIOCOMPATIBILITY",
            "PERFORMANCE_TESTING", "SOFTWARE_VALIDATION", "SIMULATED_USE", "OTHER"
          ),
          allowNull: false,
        },
        title: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        acceptanceCriteria: { type: Sequelize.TEXT, allowNull: true },
        results: { type: Sequelize.TEXT, allowNull: true },
        conclusion: { type: Sequelize.TEXT, allowNull: true },
        status: {
          type: Sequelize.ENUM("PLANNED", "IN_PROGRESS", "PASSED", "FAILED", "DEFERRED"),
          allowNull: false,
          defaultValue: "PLANNED",
        },
        performedById: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
          onDelete: "SET NULL",
        },
        validatedDate: { type: Sequelize.DATE, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      }, { transaction });

      // ═══════════════════════════════════════════════════════
      // DESIGN_TRANSFERS
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("design_transfers", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        designProjectId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "design_projects", key: "id" },
          onDelete: "CASCADE",
        },
        title: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        transferredTo: { type: Sequelize.STRING(200), allowNull: true },
        checklist: { type: Sequelize.JSONB, allowNull: true, defaultValue: [] },
        status: {
          type: Sequelize.ENUM("PENDING", "IN_PROGRESS", "COMPLETED"),
          allowNull: false,
          defaultValue: "PENDING",
        },
        completedById: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
          onDelete: "SET NULL",
        },
        completedAt: { type: Sequelize.DATE, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      }, { transaction });

      // ═══════════════════════════════════════════════════════
      // DESIGN_CHANGES
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("design_changes", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        designProjectId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "design_projects", key: "id" },
          onDelete: "CASCADE",
        },
        changeNumber: { type: Sequelize.STRING(20), allowNull: false, unique: true },
        title: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        justification: { type: Sequelize.TEXT, allowNull: true },
        impactAssessment: { type: Sequelize.TEXT, allowNull: true },
        status: {
          type: Sequelize.ENUM("REQUESTED", "UNDER_REVIEW", "APPROVED", "IMPLEMENTED", "REJECTED"),
          allowNull: false,
          defaultValue: "REQUESTED",
        },
        requestedById: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "RESTRICT",
        },
        approvedById: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
          onDelete: "SET NULL",
        },
        approvedAt: { type: Sequelize.DATE, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      }, { transaction });

      // ═══════════════════════════════════════════════════════
      // INDEXES
      // ═══════════════════════════════════════════════════════

      await queryInterface.addIndex("design_projects", ["status"], { name: "idx_dp_status", transaction });
      await queryInterface.addIndex("design_projects", ["ownerId"], { name: "idx_dp_owner", transaction });
      await queryInterface.addIndex("design_projects", ["number"], { name: "idx_dp_number", transaction });
      await queryInterface.addIndex("design_inputs", ["designProjectId"], { name: "idx_di_project", transaction });
      await queryInterface.addIndex("design_outputs", ["designProjectId"], { name: "idx_do_project", transaction });
      await queryInterface.addIndex("design_outputs", ["designInputId"], { name: "idx_do_input", transaction });
      await queryInterface.addIndex("design_reviews", ["designProjectId"], { name: "idx_dr_project", transaction });
      await queryInterface.addIndex("design_verifications", ["designProjectId"], { name: "idx_dv_project", transaction });
      await queryInterface.addIndex("design_validations", ["designProjectId"], { name: "idx_dva_project", transaction });
      await queryInterface.addIndex("design_transfers", ["designProjectId"], { name: "idx_dt_project", transaction });
      await queryInterface.addIndex("design_changes", ["designProjectId"], { name: "idx_dc_project", transaction });
      await queryInterface.addIndex("design_changes", ["changeNumber"], { name: "idx_dc_number", transaction });

      await transaction.commit();
      console.log("Migration design control tables completed: 8 tables created");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tables = [
        "design_changes",
        "design_transfers",
        "design_validations",
        "design_verifications",
        "design_reviews",
        "design_outputs",
        "design_inputs",
        "design_projects",
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
