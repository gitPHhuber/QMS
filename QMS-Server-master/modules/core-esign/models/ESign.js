/**
 * ESign.js — Models for Electronic Signatures (21 CFR Part 11 / ISO 13485)
 *
 * Provides immutable electronic signature records, signature requests
 * with sequential signing support, and organization-wide signing policies.
 */

const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══ Constants ═══

const SIGNATURE_METHODS = {
  PASSWORD: "PASSWORD",
  BIOMETRIC: "BIOMETRIC",
  TOKEN: "TOKEN",
  CERTIFICATE: "CERTIFICATE",
};

const REQUEST_STATUSES = {
  PENDING: "PENDING",
  PARTIALLY_SIGNED: "PARTIALLY_SIGNED",
  COMPLETED: "COMPLETED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
};

const SIGNER_STATUSES = {
  PENDING: "PENDING",
  SIGNED: "SIGNED",
  DECLINED: "DECLINED",
  EXPIRED: "EXPIRED",
};

// ═══ Models ═══

const ESignature = sequelize.define("esignature", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  signatureHash: { type: DataTypes.STRING(128), allowNull: false, unique: true },
  signedEntity: { type: DataTypes.STRING(100), allowNull: false },
  signedEntityId: { type: DataTypes.INTEGER, allowNull: false },
  signedAction: { type: DataTypes.STRING(100), allowNull: false },
  signerId: { type: DataTypes.INTEGER, allowNull: false },
  signerFullName: { type: DataTypes.STRING(200), allowNull: false },
  signerRole: { type: DataTypes.STRING(100), allowNull: false },
  meaning: { type: DataTypes.TEXT, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: true },
  method: {
    type: DataTypes.ENUM(...Object.values(SIGNATURE_METHODS)),
    allowNull: false,
    defaultValue: "PASSWORD",
  },
  ipAddress: { type: DataTypes.STRING(45), allowNull: true },
  userAgent: { type: DataTypes.STRING(500), allowNull: true },
  signedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  isValid: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  invalidatedById: { type: DataTypes.INTEGER, allowNull: true },
  invalidatedAt: { type: DataTypes.DATE, allowNull: true },
  invalidationReason: { type: DataTypes.TEXT, allowNull: true },
});

const ESignRequest = sequelize.define("esign_request", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  requestNumber: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  entity: { type: DataTypes.STRING(100), allowNull: false },
  entityId: { type: DataTypes.INTEGER, allowNull: false },
  action: { type: DataTypes.STRING(100), allowNull: false },
  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  requiredSignatures: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  currentSignatures: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  status: {
    type: DataTypes.ENUM(...Object.values(REQUEST_STATUSES)),
    allowNull: false,
    defaultValue: "PENDING",
  },
  requestedById: { type: DataTypes.INTEGER, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: true },
  metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
});

const ESignRequestSigner = sequelize.define("esign_request_signer", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  requestId: { type: DataTypes.INTEGER, allowNull: false },
  signerId: { type: DataTypes.INTEGER, allowNull: false },
  order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  status: {
    type: DataTypes.ENUM(...Object.values(SIGNER_STATUSES)),
    allowNull: false,
    defaultValue: "PENDING",
  },
  signatureId: { type: DataTypes.INTEGER, allowNull: true },
  declineReason: { type: DataTypes.TEXT, allowNull: true },
  signedAt: { type: DataTypes.DATE, allowNull: true },
});

const ESignPolicy = sequelize.define("esign_policy", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  entity: { type: DataTypes.STRING(100), allowNull: false },
  action: { type: DataTypes.STRING(100), allowNull: false },
  requiredSignatures: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  requiredRoles: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  sequentialSigning: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  expirationHours: { type: DataTypes.INTEGER, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  createdById: { type: DataTypes.INTEGER, allowNull: false },
});

// ═══ Associations ═══

function setupESignAssociations({ User }) {
  // ESignature → User (signer)
  ESignature.belongsTo(User, { foreignKey: "signerId", as: "signer" });
  // ESignature → User (invalidatedBy)
  ESignature.belongsTo(User, { foreignKey: "invalidatedById", as: "invalidatedBy" });

  // ESignRequest → User (requestedBy)
  ESignRequest.belongsTo(User, { foreignKey: "requestedById", as: "requestedBy" });

  // ESignRequest → ESignRequestSigner (hasMany)
  ESignRequest.hasMany(ESignRequestSigner, { foreignKey: "requestId", as: "signers", onDelete: "CASCADE" });
  ESignRequestSigner.belongsTo(ESignRequest, { foreignKey: "requestId", as: "request" });

  // ESignRequestSigner → User (signer)
  ESignRequestSigner.belongsTo(User, { foreignKey: "signerId", as: "signer" });

  // ESignRequestSigner → ESignature (optional link)
  ESignRequestSigner.belongsTo(ESignature, { foreignKey: "signatureId", as: "signature" });

  // ESignPolicy → User (createdBy)
  ESignPolicy.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });
}

module.exports = {
  ESignature, ESignRequest, ESignRequestSigner, ESignPolicy,
  setupESignAssociations,
  SIGNATURE_METHODS, REQUEST_STATUSES, SIGNER_STATUSES,
};
