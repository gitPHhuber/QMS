/**
 * Design.js — Models for Design Control (ISO 13485 §7.3)
 *
 * Covers: Design Planning, Inputs, Outputs, Reviews,
 * Verification, Validation, Transfer, and Changes.
 */

const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══ Constants ═══

const DESIGN_PROJECT_STATUSES = {
  PLANNING: "PLANNING",
  INPUTS_DEFINED: "INPUTS_DEFINED",
  DESIGN_IN_PROGRESS: "DESIGN_IN_PROGRESS",
  REVIEW: "REVIEW",
  VERIFICATION: "VERIFICATION",
  VALIDATION: "VALIDATION",
  TRANSFER: "TRANSFER",
  CLOSED: "CLOSED",
  CANCELLED: "CANCELLED",
};

const REGULATORY_CLASSES = {
  CLASS_I: "CLASS_I",
  CLASS_IIA: "CLASS_IIA",
  CLASS_IIB: "CLASS_IIB",
  CLASS_III: "CLASS_III",
};

const DESIGN_INPUT_CATEGORIES = {
  FUNCTIONAL: "FUNCTIONAL",
  PERFORMANCE: "PERFORMANCE",
  SAFETY: "SAFETY",
  REGULATORY: "REGULATORY",
  STANDARDS: "STANDARDS",
  USABILITY: "USABILITY",
  OTHER: "OTHER",
};

const DESIGN_INPUT_PRIORITIES = {
  MUST_HAVE: "MUST_HAVE",
  SHOULD_HAVE: "SHOULD_HAVE",
  NICE_TO_HAVE: "NICE_TO_HAVE",
};

const DESIGN_INPUT_STATUSES = {
  DRAFT: "DRAFT",
  APPROVED: "APPROVED",
  REVISED: "REVISED",
};

const DESIGN_OUTPUT_CATEGORIES = {
  SPECIFICATION: "SPECIFICATION",
  DRAWING: "DRAWING",
  SOFTWARE: "SOFTWARE",
  PROCEDURE: "PROCEDURE",
  LABELING: "LABELING",
  PACKAGING: "PACKAGING",
  OTHER: "OTHER",
};

const DESIGN_OUTPUT_STATUSES = {
  DRAFT: "DRAFT",
  IN_REVIEW: "IN_REVIEW",
  APPROVED: "APPROVED",
  RELEASED: "RELEASED",
};

const DESIGN_REVIEW_TYPES = {
  PHASE_GATE: "PHASE_GATE",
  PEER_REVIEW: "PEER_REVIEW",
  FORMAL_REVIEW: "FORMAL_REVIEW",
  MANAGEMENT_REVIEW: "MANAGEMENT_REVIEW",
};

const DESIGN_REVIEW_STATUSES = {
  PLANNED: "PLANNED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

const DESIGN_REVIEW_OUTCOMES = {
  APPROVED: "APPROVED",
  APPROVED_WITH_CONDITIONS: "APPROVED_WITH_CONDITIONS",
  REJECTED: "REJECTED",
};

const DESIGN_VERIFICATION_METHODS = {
  TESTING: "TESTING",
  INSPECTION: "INSPECTION",
  ANALYSIS: "ANALYSIS",
  DEMONSTRATION: "DEMONSTRATION",
  SIMULATION: "SIMULATION",
};

const DESIGN_VERIFICATION_STATUSES = {
  PLANNED: "PLANNED",
  IN_PROGRESS: "IN_PROGRESS",
  PASSED: "PASSED",
  FAILED: "FAILED",
  DEFERRED: "DEFERRED",
};

const DESIGN_VALIDATION_METHODS = {
  CLINICAL_EVALUATION: "CLINICAL_EVALUATION",
  USABILITY_TESTING: "USABILITY_TESTING",
  BIOCOMPATIBILITY: "BIOCOMPATIBILITY",
  PERFORMANCE_TESTING: "PERFORMANCE_TESTING",
  SOFTWARE_VALIDATION: "SOFTWARE_VALIDATION",
  SIMULATED_USE: "SIMULATED_USE",
  OTHER: "OTHER",
};

const DESIGN_VALIDATION_STATUSES = {
  PLANNED: "PLANNED",
  IN_PROGRESS: "IN_PROGRESS",
  PASSED: "PASSED",
  FAILED: "FAILED",
  DEFERRED: "DEFERRED",
};

const DESIGN_TRANSFER_STATUSES = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
};

const DESIGN_CHANGE_STATUSES = {
  REQUESTED: "REQUESTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  IMPLEMENTED: "IMPLEMENTED",
  REJECTED: "REJECTED",
};

// ═══ Models ═══

const DesignProject = sequelize.define("design_project", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  number: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  productType: { type: DataTypes.STRING(200), allowNull: true },
  regulatoryClass: {
    type: DataTypes.ENUM(...Object.values(REGULATORY_CLASSES)),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(DESIGN_PROJECT_STATUSES)),
    allowNull: false,
    defaultValue: "PLANNING",
  },
  phase: { type: DataTypes.STRING(100), allowNull: true },
  ownerId: { type: DataTypes.INTEGER, allowNull: false },
  teamLeadId: { type: DataTypes.INTEGER, allowNull: true },
  plannedStartDate: { type: DataTypes.DATEONLY, allowNull: true },
  plannedEndDate: { type: DataTypes.DATEONLY, allowNull: true },
  actualStartDate: { type: DataTypes.DATEONLY, allowNull: true },
  actualEndDate: { type: DataTypes.DATEONLY, allowNull: true },
  riskFileId: { type: DataTypes.INTEGER, allowNull: true },
});

const DesignInput = sequelize.define("design_input", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  designProjectId: { type: DataTypes.INTEGER, allowNull: false },
  category: {
    type: DataTypes.ENUM(...Object.values(DESIGN_INPUT_CATEGORIES)),
    allowNull: false,
  },
  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  source: { type: DataTypes.STRING(200), allowNull: true },
  priority: {
    type: DataTypes.ENUM(...Object.values(DESIGN_INPUT_PRIORITIES)),
    allowNull: false,
    defaultValue: "MUST_HAVE",
  },
  status: {
    type: DataTypes.ENUM(...Object.values(DESIGN_INPUT_STATUSES)),
    allowNull: false,
    defaultValue: "DRAFT",
  },
  addedById: { type: DataTypes.INTEGER, allowNull: false },
  approvedById: { type: DataTypes.INTEGER, allowNull: true },
});

const DesignOutput = sequelize.define("design_output", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  designProjectId: { type: DataTypes.INTEGER, allowNull: false },
  designInputId: { type: DataTypes.INTEGER, allowNull: true },
  category: {
    type: DataTypes.ENUM(...Object.values(DESIGN_OUTPUT_CATEGORIES)),
    allowNull: false,
  },
  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  documentRef: { type: DataTypes.STRING(500), allowNull: true },
  status: {
    type: DataTypes.ENUM(...Object.values(DESIGN_OUTPUT_STATUSES)),
    allowNull: false,
    defaultValue: "DRAFT",
  },
  createdById: { type: DataTypes.INTEGER, allowNull: false },
  approvedById: { type: DataTypes.INTEGER, allowNull: true },
});

const DesignReview = sequelize.define("design_review", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  designProjectId: { type: DataTypes.INTEGER, allowNull: false },
  reviewType: {
    type: DataTypes.ENUM(...Object.values(DESIGN_REVIEW_TYPES)),
    allowNull: false,
  },
  phase: { type: DataTypes.STRING(100), allowNull: true },
  title: { type: DataTypes.STRING(500), allowNull: false },
  scheduledDate: { type: DataTypes.DATEONLY, allowNull: true },
  actualDate: { type: DataTypes.DATEONLY, allowNull: true },
  status: {
    type: DataTypes.ENUM(...Object.values(DESIGN_REVIEW_STATUSES)),
    allowNull: false,
    defaultValue: "PLANNED",
  },
  outcome: {
    type: DataTypes.ENUM(...Object.values(DESIGN_REVIEW_OUTCOMES)),
    allowNull: true,
  },
  summary: { type: DataTypes.TEXT, allowNull: true },
  actionItems: { type: DataTypes.TEXT, allowNull: true },
  chairId: { type: DataTypes.INTEGER, allowNull: false },
  participants: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
});

const DesignVerification = sequelize.define("design_verification", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  designProjectId: { type: DataTypes.INTEGER, allowNull: false },
  designOutputId: { type: DataTypes.INTEGER, allowNull: true },
  method: {
    type: DataTypes.ENUM(...Object.values(DESIGN_VERIFICATION_METHODS)),
    allowNull: false,
  },
  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  acceptanceCriteria: { type: DataTypes.TEXT, allowNull: true },
  results: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM(...Object.values(DESIGN_VERIFICATION_STATUSES)),
    allowNull: false,
    defaultValue: "PLANNED",
  },
  performedById: { type: DataTypes.INTEGER, allowNull: true },
  verifiedDate: { type: DataTypes.DATE, allowNull: true },
});

const DesignValidation = sequelize.define("design_validation", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  designProjectId: { type: DataTypes.INTEGER, allowNull: false },
  method: {
    type: DataTypes.ENUM(...Object.values(DESIGN_VALIDATION_METHODS)),
    allowNull: false,
  },
  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  acceptanceCriteria: { type: DataTypes.TEXT, allowNull: true },
  results: { type: DataTypes.TEXT, allowNull: true },
  conclusion: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM(...Object.values(DESIGN_VALIDATION_STATUSES)),
    allowNull: false,
    defaultValue: "PLANNED",
  },
  performedById: { type: DataTypes.INTEGER, allowNull: true },
  validatedDate: { type: DataTypes.DATE, allowNull: true },
});

const DesignTransfer = sequelize.define("design_transfer", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  designProjectId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  transferredTo: { type: DataTypes.STRING(200), allowNull: true },
  checklist: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
  status: {
    type: DataTypes.ENUM(...Object.values(DESIGN_TRANSFER_STATUSES)),
    allowNull: false,
    defaultValue: "PENDING",
  },
  completedById: { type: DataTypes.INTEGER, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: true },
});

const DesignChange = sequelize.define("design_change", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  designProjectId: { type: DataTypes.INTEGER, allowNull: false },
  changeNumber: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  justification: { type: DataTypes.TEXT, allowNull: true },
  impactAssessment: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM(...Object.values(DESIGN_CHANGE_STATUSES)),
    allowNull: false,
    defaultValue: "REQUESTED",
  },
  requestedById: { type: DataTypes.INTEGER, allowNull: false },
  approvedById: { type: DataTypes.INTEGER, allowNull: true },
  approvedAt: { type: DataTypes.DATE, allowNull: true },
});

// ═══ Associations ═══

function setupDesignAssociations({ User, RiskRegister }) {
  // ── DesignProject → Users ──
  DesignProject.belongsTo(User, { foreignKey: "ownerId", as: "owner" });
  DesignProject.belongsTo(User, { foreignKey: "teamLeadId", as: "teamLead" });

  // ── DesignProject → Risk (optional, ISO 14971 link) ──
  if (RiskRegister) {
    DesignProject.belongsTo(RiskRegister, { foreignKey: "riskFileId", as: "riskFile" });
    RiskRegister.hasMany(DesignProject, { foreignKey: "riskFileId", as: "designProjects" });
  }

  // ── DesignProject → DesignInput ──
  DesignProject.hasMany(DesignInput, { foreignKey: "designProjectId", as: "inputs", onDelete: "CASCADE" });
  DesignInput.belongsTo(DesignProject, { foreignKey: "designProjectId", as: "project" });

  // ── DesignProject → DesignOutput ──
  DesignProject.hasMany(DesignOutput, { foreignKey: "designProjectId", as: "outputs", onDelete: "CASCADE" });
  DesignOutput.belongsTo(DesignProject, { foreignKey: "designProjectId", as: "project" });

  // ── DesignProject → DesignReview ──
  DesignProject.hasMany(DesignReview, { foreignKey: "designProjectId", as: "reviews", onDelete: "CASCADE" });
  DesignReview.belongsTo(DesignProject, { foreignKey: "designProjectId", as: "project" });

  // ── DesignProject → DesignVerification ──
  DesignProject.hasMany(DesignVerification, { foreignKey: "designProjectId", as: "verifications", onDelete: "CASCADE" });
  DesignVerification.belongsTo(DesignProject, { foreignKey: "designProjectId", as: "project" });

  // ── DesignProject → DesignValidation ──
  DesignProject.hasMany(DesignValidation, { foreignKey: "designProjectId", as: "validations", onDelete: "CASCADE" });
  DesignValidation.belongsTo(DesignProject, { foreignKey: "designProjectId", as: "project" });

  // ── DesignProject → DesignTransfer ──
  DesignProject.hasMany(DesignTransfer, { foreignKey: "designProjectId", as: "transfers", onDelete: "CASCADE" });
  DesignTransfer.belongsTo(DesignProject, { foreignKey: "designProjectId", as: "project" });

  // ── DesignProject → DesignChange ──
  DesignProject.hasMany(DesignChange, { foreignKey: "designProjectId", as: "changes", onDelete: "CASCADE" });
  DesignChange.belongsTo(DesignProject, { foreignKey: "designProjectId", as: "project" });

  // ── DesignInput → Users ──
  DesignInput.belongsTo(User, { foreignKey: "addedById", as: "addedBy" });
  DesignInput.belongsTo(User, { foreignKey: "approvedById", as: "approvedBy" });

  // ── DesignOutput → Users ──
  DesignOutput.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });
  DesignOutput.belongsTo(User, { foreignKey: "approvedById", as: "approvedBy" });

  // ── DesignOutput → DesignInput (traceability) ──
  DesignOutput.belongsTo(DesignInput, { foreignKey: "designInputId", as: "tracedInput" });
  DesignInput.hasMany(DesignOutput, { foreignKey: "designInputId", as: "tracedOutputs" });

  // ── DesignReview → User (chair) ──
  DesignReview.belongsTo(User, { foreignKey: "chairId", as: "chair" });

  // ── DesignVerification → User, DesignOutput ──
  DesignVerification.belongsTo(User, { foreignKey: "performedById", as: "performedBy" });
  DesignVerification.belongsTo(DesignOutput, { foreignKey: "designOutputId", as: "designOutput" });

  // ── DesignValidation → User ──
  DesignValidation.belongsTo(User, { foreignKey: "performedById", as: "performedBy" });

  // ── DesignTransfer → User ──
  DesignTransfer.belongsTo(User, { foreignKey: "completedById", as: "completedBy" });

  // ── DesignChange → Users ──
  DesignChange.belongsTo(User, { foreignKey: "requestedById", as: "requestedBy" });
  DesignChange.belongsTo(User, { foreignKey: "approvedById", as: "approvedBy" });
}

module.exports = {
  DesignProject, DesignInput, DesignOutput, DesignReview,
  DesignVerification, DesignValidation, DesignTransfer, DesignChange,
  setupDesignAssociations,
  DESIGN_PROJECT_STATUSES, REGULATORY_CLASSES,
  DESIGN_INPUT_CATEGORIES, DESIGN_INPUT_PRIORITIES, DESIGN_INPUT_STATUSES,
  DESIGN_OUTPUT_CATEGORIES, DESIGN_OUTPUT_STATUSES,
  DESIGN_REVIEW_TYPES, DESIGN_REVIEW_STATUSES, DESIGN_REVIEW_OUTCOMES,
  DESIGN_VERIFICATION_METHODS, DESIGN_VERIFICATION_STATUSES,
  DESIGN_VALIDATION_METHODS, DESIGN_VALIDATION_STATUSES,
  DESIGN_TRANSFER_STATUSES,
  DESIGN_CHANGE_STATUSES,
};
