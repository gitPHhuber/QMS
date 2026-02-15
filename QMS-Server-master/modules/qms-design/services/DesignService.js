/**
 * DesignService.js — Business logic for Design Control (ISO 13485 §7.3)
 */

const { Op } = require("sequelize");
const sequelize = require("../../../db");
const {
  DesignProject, DesignInput, DesignOutput, DesignReview,
  DesignVerification, DesignValidation, DesignTransfer, DesignChange,
  DESIGN_PROJECT_STATUSES, DESIGN_CHANGE_STATUSES,
} = require("../models/Design");
const { User } = require("../../../models/index");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");

// Lazy-load Risk module (may be disabled)
let _RiskRegister = null;
function getRiskRegister() {
  if (_RiskRegister === undefined) return null;
  if (_RiskRegister) return _RiskRegister;
  try {
    const { RiskRegister } = require("../../qms-risk/models/Risk");
    _RiskRegister = RiskRegister;
    return _RiskRegister;
  } catch {
    _RiskRegister = undefined;
    return null;
  }
}

// User attributes for includes
const USER_ATTRS = ["id", "name", "surname"];

// Whitelist fields for project updates
const PROJECT_UPDATABLE_FIELDS = [
  "title", "description", "productType", "regulatoryClass",
  "status", "phase", "teamLeadId",
  "plannedStartDate", "plannedEndDate", "actualStartDate", "actualEndDate",
  "riskFileId",
];

// Whitelist fields for design input updates
const INPUT_UPDATABLE_FIELDS = [
  "category", "title", "description", "source", "priority", "status", "approvedById",
];

// Whitelist fields for design output updates
const OUTPUT_UPDATABLE_FIELDS = [
  "category", "title", "description", "documentRef", "designInputId",
  "status", "approvedById",
];

// Whitelist fields for design verification updates
const VERIFICATION_UPDATABLE_FIELDS = [
  "method", "title", "description", "acceptanceCriteria", "results",
  "status", "performedById", "verifiedDate", "designOutputId",
];

// Whitelist fields for design validation updates
const VALIDATION_UPDATABLE_FIELDS = [
  "method", "title", "description", "acceptanceCriteria", "results",
  "conclusion", "status", "performedById", "validatedDate",
];

class DesignService {
  // ═══ DESIGN PROJECT ═══

  async createProject(req, data) {
    const t = await sequelize.transaction({ isolationLevel: "SERIALIZABLE" });
    try {
      const [maxResult] = await sequelize.query(
        `SELECT MAX(CAST(SUBSTRING(number FROM '(\\d+)$') AS INTEGER)) AS max_num FROM design_projects`,
        { transaction: t, type: sequelize.QueryTypes.SELECT }
      );
      const num = (maxResult?.max_num || 0) + 1;
      const number = `DP-${String(num).padStart(4, "0")}`;

      const project = await DesignProject.create({
        ...data,
        number,
        status: DESIGN_PROJECT_STATUSES.PLANNING,
        ownerId: req.user.id,
      }, { transaction: t });

      await t.commit();

      await logAudit({
        req,
        action: "DESIGN_PROJECT_CREATE",
        entity: "DesignProject",
        entityId: project.id,
        description: `Design project ${number} created: "${project.title}"`,
        metadata: { number, productType: data.productType, regulatoryClass: data.regulatoryClass },
      });

      return project;
    } catch (e) { await t.rollback(); throw e; }
  }

  async updateProject(req, id, data) {
    const project = await DesignProject.findByPk(id);
    if (!project) throw ApiError.notFound("Design project not found");
    if (project.status === DESIGN_PROJECT_STATUSES.CLOSED) {
      throw ApiError.badRequest("Cannot edit a closed design project");
    }

    const safeData = {};
    for (const field of PROJECT_UPDATABLE_FIELDS) {
      if (data[field] !== undefined) safeData[field] = data[field];
    }

    await project.update(safeData);

    await logAudit({
      req,
      action: "DESIGN_PROJECT_UPDATE",
      entity: "DesignProject",
      entityId: project.id,
      description: `Design project ${project.number} updated`,
      metadata: { updatedFields: Object.keys(safeData) },
    });

    return project;
  }

  async getProjectList({ page = 1, limit = 20, status, search, ownerId }) {
    const where = {};
    if (status) where.status = status;
    if (ownerId) where.ownerId = ownerId;
    if (search) {
      where[Op.or] = [
        { number: { [Op.iLike]: `%${search}%` } },
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    return DesignProject.findAndCountAll({
      where,
      include: [
        { model: User, as: "owner", attributes: USER_ATTRS },
        { model: User, as: "teamLead", attributes: USER_ATTRS },
      ],
      order: [["createdAt", "DESC"]],
      limit: Math.min(limit, 100),
      offset: (page - 1) * limit,
    });
  }

  async getProjectDetail(id) {
    const includes = [
      { model: User, as: "owner", attributes: USER_ATTRS },
      { model: User, as: "teamLead", attributes: USER_ATTRS },
      {
        model: DesignInput, as: "inputs",
        include: [
          { model: User, as: "addedBy", attributes: USER_ATTRS },
          { model: User, as: "approvedBy", attributes: USER_ATTRS },
        ],
      },
      {
        model: DesignOutput, as: "outputs",
        include: [
          { model: User, as: "createdBy", attributes: USER_ATTRS },
          { model: User, as: "approvedBy", attributes: USER_ATTRS },
          { model: DesignInput, as: "tracedInput", attributes: ["id", "title", "category"] },
        ],
      },
      {
        model: DesignReview, as: "reviews",
        include: [{ model: User, as: "chair", attributes: USER_ATTRS }],
      },
      {
        model: DesignVerification, as: "verifications",
        include: [
          { model: User, as: "performedBy", attributes: USER_ATTRS },
          { model: DesignOutput, as: "designOutput", attributes: ["id", "title", "category"] },
        ],
      },
      {
        model: DesignValidation, as: "validations",
        include: [{ model: User, as: "performedBy", attributes: USER_ATTRS }],
      },
      {
        model: DesignTransfer, as: "transfers",
        include: [{ model: User, as: "completedBy", attributes: USER_ATTRS }],
      },
      {
        model: DesignChange, as: "changes",
        include: [
          { model: User, as: "requestedBy", attributes: USER_ATTRS },
          { model: User, as: "approvedBy", attributes: USER_ATTRS },
        ],
      },
    ];

    // Include linked Risk if module available
    const RiskRegister = getRiskRegister();
    if (RiskRegister) {
      includes.push({
        model: RiskRegister, as: "riskFile",
        attributes: ["id", "riskNumber", "title", "category", "initialRiskClass", "residualRiskClass", "status"],
      });
    }

    return DesignProject.findByPk(id, { include: includes });
  }

  // ═══ DESIGN INPUT (§7.3.3) ═══

  async addInput(req, projectId, data) {
    const project = await DesignProject.findByPk(projectId);
    if (!project) throw ApiError.notFound("Design project not found");

    const input = await DesignInput.create({
      ...data,
      designProjectId: projectId,
      addedById: req.user.id,
      status: "DRAFT",
    });

    await logAudit({
      req,
      action: "DESIGN_INPUT_CREATE",
      entity: "DesignInput",
      entityId: input.id,
      description: `Design input added to project ${project.number}: "${input.title}"`,
      metadata: { designProjectId: projectId, category: data.category },
    });

    return input;
  }

  async updateInput(req, inputId, data) {
    const input = await DesignInput.findByPk(inputId);
    if (!input) throw ApiError.notFound("Design input not found");

    const safeData = {};
    for (const field of INPUT_UPDATABLE_FIELDS) {
      if (data[field] !== undefined) safeData[field] = data[field];
    }

    if (safeData.status === "APPROVED" && !safeData.approvedById) {
      safeData.approvedById = req.user.id;
    }

    await input.update(safeData);

    await logAudit({
      req,
      action: "DESIGN_INPUT_UPDATE",
      entity: "DesignInput",
      entityId: input.id,
      description: `Design input #${input.id} updated`,
      metadata: { updatedFields: Object.keys(safeData) },
    });

    return input;
  }

  // ═══ DESIGN OUTPUT (§7.3.4) ═══

  async addOutput(req, projectId, data) {
    const project = await DesignProject.findByPk(projectId);
    if (!project) throw ApiError.notFound("Design project not found");

    // Validate traceability link if provided
    if (data.designInputId) {
      const input = await DesignInput.findByPk(data.designInputId);
      if (!input || input.designProjectId !== projectId) {
        throw ApiError.badRequest("Referenced design input not found or does not belong to this project");
      }
    }

    const output = await DesignOutput.create({
      ...data,
      designProjectId: projectId,
      createdById: req.user.id,
      status: "DRAFT",
    });

    await logAudit({
      req,
      action: "DESIGN_OUTPUT_CREATE",
      entity: "DesignOutput",
      entityId: output.id,
      description: `Design output added to project ${project.number}: "${output.title}"`,
      metadata: { designProjectId: projectId, category: data.category, designInputId: data.designInputId || null },
    });

    return output;
  }

  async updateOutput(req, outputId, data) {
    const output = await DesignOutput.findByPk(outputId);
    if (!output) throw ApiError.notFound("Design output not found");

    const safeData = {};
    for (const field of OUTPUT_UPDATABLE_FIELDS) {
      if (data[field] !== undefined) safeData[field] = data[field];
    }

    if (safeData.status === "APPROVED" && !safeData.approvedById) {
      safeData.approvedById = req.user.id;
    }

    await output.update(safeData);

    await logAudit({
      req,
      action: "DESIGN_OUTPUT_UPDATE",
      entity: "DesignOutput",
      entityId: output.id,
      description: `Design output #${output.id} updated`,
      metadata: { updatedFields: Object.keys(safeData) },
    });

    return output;
  }

  // ═══ DESIGN REVIEW (§7.3.5) ═══

  async addReview(req, projectId, data) {
    const project = await DesignProject.findByPk(projectId);
    if (!project) throw ApiError.notFound("Design project not found");

    const review = await DesignReview.create({
      ...data,
      designProjectId: projectId,
      status: "PLANNED",
      chairId: data.chairId || req.user.id,
    });

    await logAudit({
      req,
      action: "DESIGN_REVIEW_CREATE",
      entity: "DesignReview",
      entityId: review.id,
      description: `Design review scheduled for project ${project.number}: "${review.title}"`,
      metadata: { designProjectId: projectId, reviewType: data.reviewType },
    });

    return review;
  }

  async completeReview(req, reviewId, data) {
    const review = await DesignReview.findByPk(reviewId);
    if (!review) throw ApiError.notFound("Design review not found");

    if (review.status === "COMPLETED") {
      throw ApiError.badRequest("Review is already completed");
    }
    if (review.status === "CANCELLED") {
      throw ApiError.badRequest("Cannot complete a cancelled review");
    }

    const updates = {
      status: "COMPLETED",
      actualDate: data.actualDate || new Date().toISOString().split("T")[0],
      outcome: data.outcome,
      summary: data.summary,
      actionItems: data.actionItems,
      participants: data.participants || review.participants,
    };

    await review.update(updates);

    await logAudit({
      req,
      action: "DESIGN_REVIEW_COMPLETE",
      entity: "DesignReview",
      entityId: review.id,
      description: `Design review #${review.id} completed with outcome: ${data.outcome}`,
      metadata: { outcome: data.outcome, designProjectId: review.designProjectId },
    });

    return review;
  }

  // ═══ DESIGN VERIFICATION (§7.3.6) ═══

  async addVerification(req, projectId, data) {
    const project = await DesignProject.findByPk(projectId);
    if (!project) throw ApiError.notFound("Design project not found");

    // Validate output link if provided
    if (data.designOutputId) {
      const output = await DesignOutput.findByPk(data.designOutputId);
      if (!output || output.designProjectId !== projectId) {
        throw ApiError.badRequest("Referenced design output not found or does not belong to this project");
      }
    }

    const verification = await DesignVerification.create({
      ...data,
      designProjectId: projectId,
      status: "PLANNED",
    });

    await logAudit({
      req,
      action: "DESIGN_VERIFICATION_CREATE",
      entity: "DesignVerification",
      entityId: verification.id,
      description: `Design verification added to project ${project.number}: "${verification.title}"`,
      metadata: { designProjectId: projectId, method: data.method },
    });

    return verification;
  }

  async updateVerification(req, id, data) {
    const verification = await DesignVerification.findByPk(id);
    if (!verification) throw ApiError.notFound("Design verification not found");

    const safeData = {};
    for (const field of VERIFICATION_UPDATABLE_FIELDS) {
      if (data[field] !== undefined) safeData[field] = data[field];
    }

    if (["PASSED", "FAILED"].includes(safeData.status) && !safeData.performedById) {
      safeData.performedById = req.user.id;
    }
    if (["PASSED", "FAILED"].includes(safeData.status) && !safeData.verifiedDate) {
      safeData.verifiedDate = new Date();
    }

    await verification.update(safeData);

    await logAudit({
      req,
      action: "DESIGN_VERIFICATION_UPDATE",
      entity: "DesignVerification",
      entityId: verification.id,
      description: `Design verification #${verification.id} updated`,
      metadata: { updatedFields: Object.keys(safeData), status: safeData.status },
    });

    return verification;
  }

  // ═══ DESIGN VALIDATION (§7.3.7) ═══

  async addValidation(req, projectId, data) {
    const project = await DesignProject.findByPk(projectId);
    if (!project) throw ApiError.notFound("Design project not found");

    const validation = await DesignValidation.create({
      ...data,
      designProjectId: projectId,
      status: "PLANNED",
    });

    await logAudit({
      req,
      action: "DESIGN_VALIDATION_CREATE",
      entity: "DesignValidation",
      entityId: validation.id,
      description: `Design validation added to project ${project.number}: "${validation.title}"`,
      metadata: { designProjectId: projectId, method: data.method },
    });

    return validation;
  }

  async updateValidation(req, id, data) {
    const validation = await DesignValidation.findByPk(id);
    if (!validation) throw ApiError.notFound("Design validation not found");

    const safeData = {};
    for (const field of VALIDATION_UPDATABLE_FIELDS) {
      if (data[field] !== undefined) safeData[field] = data[field];
    }

    if (["PASSED", "FAILED"].includes(safeData.status) && !safeData.performedById) {
      safeData.performedById = req.user.id;
    }
    if (["PASSED", "FAILED"].includes(safeData.status) && !safeData.validatedDate) {
      safeData.validatedDate = new Date();
    }

    await validation.update(safeData);

    await logAudit({
      req,
      action: "DESIGN_VALIDATION_UPDATE",
      entity: "DesignValidation",
      entityId: validation.id,
      description: `Design validation #${validation.id} updated`,
      metadata: { updatedFields: Object.keys(safeData), status: safeData.status },
    });

    return validation;
  }

  // ═══ DESIGN TRANSFER (§7.3.8) ═══

  async addTransfer(req, projectId, data) {
    const project = await DesignProject.findByPk(projectId);
    if (!project) throw ApiError.notFound("Design project not found");

    const transfer = await DesignTransfer.create({
      ...data,
      designProjectId: projectId,
      status: "PENDING",
    });

    await logAudit({
      req,
      action: "DESIGN_TRANSFER_CREATE",
      entity: "DesignTransfer",
      entityId: transfer.id,
      description: `Design transfer added to project ${project.number}: "${transfer.title}"`,
      metadata: { designProjectId: projectId, transferredTo: data.transferredTo },
    });

    return transfer;
  }

  async completeTransfer(req, transferId, data) {
    const transfer = await DesignTransfer.findByPk(transferId);
    if (!transfer) throw ApiError.notFound("Design transfer not found");

    if (transfer.status === "COMPLETED") {
      throw ApiError.badRequest("Transfer is already completed");
    }

    const updates = {
      status: "COMPLETED",
      completedById: req.user.id,
      completedAt: new Date(),
    };
    if (data.checklist) updates.checklist = data.checklist;

    await transfer.update(updates);

    await logAudit({
      req,
      action: "DESIGN_TRANSFER_COMPLETE",
      entity: "DesignTransfer",
      entityId: transfer.id,
      description: `Design transfer #${transfer.id} completed`,
      metadata: { designProjectId: transfer.designProjectId, transferredTo: transfer.transferredTo },
    });

    return transfer;
  }

  // ═══ DESIGN CHANGE (§7.3.9) ═══

  async createChange(req, projectId, data) {
    const t = await sequelize.transaction({ isolationLevel: "SERIALIZABLE" });
    try {
      const project = await DesignProject.findByPk(projectId, { transaction: t });
      if (!project) throw ApiError.notFound("Design project not found");

      const [maxResult] = await sequelize.query(
        `SELECT MAX(CAST(SUBSTRING("changeNumber" FROM '(\\d+)$') AS INTEGER)) AS max_num FROM design_changes`,
        { transaction: t, type: sequelize.QueryTypes.SELECT }
      );
      const num = (maxResult?.max_num || 0) + 1;
      const changeNumber = `DC-${String(num).padStart(4, "0")}`;

      const change = await DesignChange.create({
        ...data,
        designProjectId: projectId,
        changeNumber,
        status: DESIGN_CHANGE_STATUSES.REQUESTED,
        requestedById: req.user.id,
      }, { transaction: t });

      await t.commit();

      await logAudit({
        req,
        action: "DESIGN_CHANGE_CREATE",
        entity: "DesignChange",
        entityId: change.id,
        description: `Design change ${changeNumber} created for project ${project.number}: "${change.title}"`,
        metadata: { designProjectId: projectId, changeNumber },
      });

      return change;
    } catch (e) { await t.rollback(); throw e; }
  }

  async updateChangeStatus(req, changeId, data) {
    const change = await DesignChange.findByPk(changeId);
    if (!change) throw ApiError.notFound("Design change not found");

    const updates = {};
    if (data.status) updates.status = data.status;
    if (data.impactAssessment !== undefined) updates.impactAssessment = data.impactAssessment;

    if (data.status === "APPROVED") {
      updates.approvedById = req.user.id;
      updates.approvedAt = new Date();
    }

    await change.update(updates);

    await logAudit({
      req,
      action: "DESIGN_CHANGE_UPDATE",
      entity: "DesignChange",
      entityId: change.id,
      description: `Design change ${change.changeNumber} status updated to ${data.status}`,
      metadata: { changeNumber: change.changeNumber, newStatus: data.status, designProjectId: change.designProjectId },
    });

    return change;
  }

  // ═══ STATISTICS ═══

  async getStats() {
    const [
      projectsByStatus,
      projectsByClass,
      inputsByCategory,
      outputsByStatus,
      verificationsByStatus,
      validationsByStatus,
      openChanges,
    ] = await Promise.all([
      DesignProject.findAll({ attributes: ["status", [sequelize.fn("COUNT", "*"), "count"]], group: ["status"], raw: true }),
      DesignProject.findAll({ attributes: ["regulatoryClass", [sequelize.fn("COUNT", "*"), "count"]], group: ["regulatoryClass"], raw: true }),
      DesignInput.findAll({ attributes: ["category", [sequelize.fn("COUNT", "*"), "count"]], group: ["category"], raw: true }),
      DesignOutput.findAll({ attributes: ["status", [sequelize.fn("COUNT", "*"), "count"]], group: ["status"], raw: true }),
      DesignVerification.findAll({ attributes: ["status", [sequelize.fn("COUNT", "*"), "count"]], group: ["status"], raw: true }),
      DesignValidation.findAll({ attributes: ["status", [sequelize.fn("COUNT", "*"), "count"]], group: ["status"], raw: true }),
      DesignChange.count({ where: { status: { [Op.notIn]: ["IMPLEMENTED", "REJECTED"] } } }),
    ]);

    return {
      projectsByStatus,
      projectsByClass,
      inputsByCategory,
      outputsByStatus,
      verificationsByStatus,
      validationsByStatus,
      openChanges,
    };
  }
}

module.exports = new DesignService();
