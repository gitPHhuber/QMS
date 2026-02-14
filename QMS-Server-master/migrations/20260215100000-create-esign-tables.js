"use strict";

/**
 * Migration: create electronic signatures tables (21 CFR Part 11 / ISO 13485)
 *
 * Tables:
 *   - esignatures          — immutable signature records with SHA-256 hash
 *   - esign_requests       — multi-signer signature requests
 *   - esign_request_signers — individual signer records within a request
 *   - esign_policies       — organization-wide signing policies
 *
 * Dependencies: users table must already exist
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // ═══════════════════════════════════════════════════════
      // ESIGNATURES — immutable signature records
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("esignatures", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        signatureHash: { type: Sequelize.STRING(128), allowNull: false, unique: true },
        signedEntity: { type: Sequelize.STRING(100), allowNull: false },
        signedEntityId: { type: Sequelize.INTEGER, allowNull: false },
        signedAction: { type: Sequelize.STRING(100), allowNull: false },
        signerId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "RESTRICT",
        },
        signerFullName: { type: Sequelize.STRING(200), allowNull: false },
        signerRole: { type: Sequelize.STRING(100), allowNull: false },
        meaning: { type: Sequelize.TEXT, allowNull: false },
        reason: { type: Sequelize.TEXT, allowNull: true },
        method: {
          type: Sequelize.ENUM("PASSWORD", "BIOMETRIC", "TOKEN", "CERTIFICATE"),
          allowNull: false,
          defaultValue: "PASSWORD",
        },
        ipAddress: { type: Sequelize.STRING(45), allowNull: true },
        userAgent: { type: Sequelize.STRING(500), allowNull: true },
        signedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        isValid: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        invalidatedById: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
          onDelete: "SET NULL",
        },
        invalidatedAt: { type: Sequelize.DATE, allowNull: true },
        invalidationReason: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      }, { transaction });

      // ═══════════════════════════════════════════════════════
      // ESIGN_REQUESTS — multi-signer signature requests
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("esign_requests", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        requestNumber: { type: Sequelize.STRING(20), allowNull: false, unique: true },
        entity: { type: Sequelize.STRING(100), allowNull: false },
        entityId: { type: Sequelize.INTEGER, allowNull: false },
        action: { type: Sequelize.STRING(100), allowNull: false },
        title: { type: Sequelize.STRING(500), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        requiredSignatures: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        currentSignatures: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        status: {
          type: Sequelize.ENUM("PENDING", "PARTIALLY_SIGNED", "COMPLETED", "EXPIRED", "CANCELLED"),
          allowNull: false,
          defaultValue: "PENDING",
        },
        requestedById: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "RESTRICT",
        },
        expiresAt: { type: Sequelize.DATE, allowNull: true },
        completedAt: { type: Sequelize.DATE, allowNull: true },
        metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      }, { transaction });

      // ═══════════════════════════════════════════════════════
      // ESIGN_REQUEST_SIGNERS — individual signer records
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("esign_request_signers", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        requestId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "esign_requests", key: "id" },
          onDelete: "CASCADE",
        },
        signerId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "RESTRICT",
        },
        order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        status: {
          type: Sequelize.ENUM("PENDING", "SIGNED", "DECLINED", "EXPIRED"),
          allowNull: false,
          defaultValue: "PENDING",
        },
        signatureId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "esignatures", key: "id" },
          onDelete: "SET NULL",
        },
        declineReason: { type: Sequelize.TEXT, allowNull: true },
        signedAt: { type: Sequelize.DATE, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      }, { transaction });

      // ═══════════════════════════════════════════════════════
      // ESIGN_POLICIES — organization-wide signing policies
      // ═══════════════════════════════════════════════════════

      await queryInterface.createTable("esign_policies", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        entity: { type: Sequelize.STRING(100), allowNull: false },
        action: { type: Sequelize.STRING(100), allowNull: false },
        requiredSignatures: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        requiredRoles: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
        sequentialSigning: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        expirationHours: { type: Sequelize.INTEGER, allowNull: true },
        isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        createdById: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "RESTRICT",
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      }, { transaction });

      // ═══════════════════════════════════════════════════════
      // INDEXES
      // ═══════════════════════════════════════════════════════

      await queryInterface.addIndex("esignatures", ["signedEntity", "signedEntityId"], { name: "idx_esig_entity", transaction });
      await queryInterface.addIndex("esignatures", ["signerId"], { name: "idx_esig_signer", transaction });
      await queryInterface.addIndex("esignatures", ["signedAt"], { name: "idx_esig_signed_at", transaction });
      await queryInterface.addIndex("esignatures", ["isValid"], { name: "idx_esig_valid", transaction });
      await queryInterface.addIndex("esign_requests", ["status"], { name: "idx_esreq_status", transaction });
      await queryInterface.addIndex("esign_requests", ["entity", "entityId"], { name: "idx_esreq_entity", transaction });
      await queryInterface.addIndex("esign_requests", ["requestedById"], { name: "idx_esreq_requester", transaction });
      await queryInterface.addIndex("esign_request_signers", ["requestId"], { name: "idx_esrs_request", transaction });
      await queryInterface.addIndex("esign_request_signers", ["signerId"], { name: "idx_esrs_signer", transaction });
      await queryInterface.addIndex("esign_policies", ["entity", "action", "isActive"], { name: "idx_espol_entity_action", transaction });

      await transaction.commit();
      console.log("Migration esign tables completed: 4 tables created (esignatures, esign_requests, esign_request_signers, esign_policies)");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tables = [
        "esign_request_signers",
        "esign_policies",
        "esign_requests",
        "esignatures",
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
