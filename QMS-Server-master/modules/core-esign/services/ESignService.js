/**
 * ESignService.js — Business logic for Electronic Signatures (21 CFR Part 11 / ISO 13485)
 *
 * Implements electronic signature creation with password re-verification,
 * SHA-256 hash computation for integrity, signature requests with sequential
 * signing, and organization-wide signing policies.
 */

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const sequelize = require("../../../db");
const {
  ESignature, ESignRequest, ESignRequestSigner, ESignPolicy,
  REQUEST_STATUSES, SIGNER_STATUSES,
} = require("../models/ESign");
const { User } = require("../../../models/index");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");

class ESignService {
  // ═══ SIGN ═══

  /**
   * Create an electronic signature (21 CFR Part 11 compliant).
   * Requires password re-verification before signing.
   */
  async sign(req, data) {
    const {
      signedEntity, signedEntityId, signedAction, meaning,
      reason, method, password, requestSignerId,
    } = data;

    if (!signedEntity || !signedEntityId || !signedAction || !meaning) {
      throw ApiError.badRequest("signedEntity, signedEntityId, signedAction, and meaning are required");
    }
    if (!password) {
      throw ApiError.badRequest("Password is required for electronic signature (21 CFR Part 11)");
    }

    // 1. Verify user's password (21 CFR Part 11 compliance)
    const user = await User.findByPk(req.user.id);
    if (!user) throw ApiError.notFound("User not found");

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      await logAudit({
        req,
        userId: req.user.id,
        action: "ESIGN_FAILED",
        entity: "esignature",
        entityId: null,
        description: `Failed e-signature attempt: invalid password for ${signedEntity}#${signedEntityId} action=${signedAction}`,
        metadata: { signedEntity, signedEntityId, signedAction, reason: "invalid_password" },
        severity: "WARNING",
      });
      throw ApiError.unauthorized("Invalid password. Signature denied.");
    }

    const t = await sequelize.transaction();
    try {
      // 2. Compute signatureHash = SHA-256(signedEntity + signedEntityId + signedAction + signerId + timestamp)
      const timestamp = new Date().toISOString();
      const hashInput = `${signedEntity}${signedEntityId}${signedAction}${req.user.id}${timestamp}`;
      const signatureHash = crypto.createHash("sha256").update(hashInput).digest("hex");

      // 3. Create ESignature record
      const signerFullName = [user.name, user.surname].filter(Boolean).join(" ") || user.email || `User#${user.id}`;
      const signerRole = user.role || "USER";

      const signature = await ESignature.create({
        signatureHash,
        signedEntity,
        signedEntityId,
        signedAction,
        signerId: req.user.id,
        signerFullName,
        signerRole,
        meaning,
        reason: reason || null,
        method: method || "PASSWORD",
        ipAddress: req.ip || req.connection?.remoteAddress || null,
        userAgent: req.headers?.["user-agent"]?.substring(0, 500) || null,
        signedAt: timestamp,
      }, { transaction: t });

      // 4. If part of an ESignRequest, update the request status
      if (requestSignerId) {
        const requestSigner = await ESignRequestSigner.findByPk(requestSignerId, {
          include: [{ model: ESignRequest, as: "request" }],
          transaction: t,
        });

        if (requestSigner && requestSigner.request) {
          if (requestSigner.signerId !== req.user.id) {
            throw ApiError.forbidden("You are not the designated signer for this request");
          }
          if (requestSigner.status !== SIGNER_STATUSES.PENDING) {
            throw ApiError.badRequest(`Signer record is already ${requestSigner.status}`);
          }

          // Check sequential signing order
          const request = requestSigner.request;
          const pendingBefore = await ESignRequestSigner.count({
            where: {
              requestId: request.id,
              order: { [Op.lt]: requestSigner.order },
              status: SIGNER_STATUSES.PENDING,
            },
            transaction: t,
          });
          if (pendingBefore > 0) {
            throw ApiError.badRequest("Sequential signing required: previous signers have not yet signed");
          }

          await requestSigner.update({
            status: SIGNER_STATUSES.SIGNED,
            signatureId: signature.id,
            signedAt: timestamp,
          }, { transaction: t });

          const newCount = request.currentSignatures + 1;
          const updates = { currentSignatures: newCount };

          if (newCount >= request.requiredSignatures) {
            updates.status = REQUEST_STATUSES.COMPLETED;
            updates.completedAt = new Date();
          } else {
            updates.status = REQUEST_STATUSES.PARTIALLY_SIGNED;
          }

          await request.update(updates, { transaction: t });
        }
      }

      await t.commit();

      // 5. Log via audit logger
      await logAudit({
        req,
        userId: req.user.id,
        action: "ESIGN_CREATE",
        entity: "esignature",
        entityId: signature.id,
        description: `Electronic signature applied: ${signedAction} on ${signedEntity}#${signedEntityId}`,
        metadata: {
          signatureHash,
          signedEntity,
          signedEntityId,
          signedAction,
          meaning,
          method: method || "PASSWORD",
          requestSignerId: requestSignerId || null,
        },
        severity: "INFO",
      });

      return signature;
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  // ═══ REQUESTS ═══

  /**
   * Create a signature request with designated signers.
   */
  async createRequest(req, data) {
    const { entity, entityId, action, title, description, signers, expiresAt, metadata } = data;

    if (!entity || !entityId || !action || !title) {
      throw ApiError.badRequest("entity, entityId, action, and title are required");
    }
    if (!signers || !Array.isArray(signers) || signers.length === 0) {
      throw ApiError.badRequest("At least one signer is required");
    }

    // Check if a policy applies
    const policy = await this.checkPolicy(entity, action);

    const t = await sequelize.transaction({ isolationLevel: "SERIALIZABLE" });
    try {
      // Generate request number
      const [maxResult] = await sequelize.query(
        `SELECT MAX(CAST(SUBSTRING("requestNumber" FROM '(\\d+)$') AS INTEGER)) AS max_num FROM esign_requests`,
        { transaction: t, type: sequelize.QueryTypes.SELECT }
      );
      const num = (maxResult?.max_num || 0) + 1;
      const requestNumber = `SR-${String(num).padStart(4, "0")}`;

      const requiredSignatures = data.requiredSignatures || policy?.requiredSignatures || signers.length;

      // Compute expiration from policy if not explicitly set
      let computedExpiresAt = expiresAt || null;
      if (!computedExpiresAt && policy?.expirationHours) {
        computedExpiresAt = new Date(Date.now() + policy.expirationHours * 3600000);
      }

      const request = await ESignRequest.create({
        requestNumber,
        entity,
        entityId,
        action,
        title,
        description: description || null,
        requiredSignatures,
        currentSignatures: 0,
        status: REQUEST_STATUSES.PENDING,
        requestedById: req.user.id,
        expiresAt: computedExpiresAt,
        metadata: metadata || {},
      }, { transaction: t });

      // Create signer records
      for (let i = 0; i < signers.length; i++) {
        const s = signers[i];
        await ESignRequestSigner.create({
          requestId: request.id,
          signerId: s.signerId || s.id,
          order: s.order || i + 1,
          status: SIGNER_STATUSES.PENDING,
        }, { transaction: t });
      }

      await t.commit();

      await logAudit({
        req,
        userId: req.user.id,
        action: "ESIGN_REQUEST_CREATE",
        entity: "esign_request",
        entityId: request.id,
        description: `Signature request ${requestNumber} created for ${action} on ${entity}#${entityId}`,
        metadata: {
          requestNumber,
          entity,
          entityId,
          action,
          signerCount: signers.length,
          requiredSignatures,
        },
        severity: "INFO",
      });

      return this.getRequestDetail(request.id);
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  /**
   * Get a single signature request with all signers.
   */
  async getRequestDetail(id) {
    return ESignRequest.findByPk(id, {
      include: [
        { model: User, as: "requestedBy", attributes: ["id", "name", "surname"] },
        {
          model: ESignRequestSigner,
          as: "signers",
          order: [["order", "ASC"]],
          include: [
            { model: User, as: "signer", attributes: ["id", "name", "surname"] },
            { model: ESignature, as: "signature" },
          ],
        },
      ],
    });
  }

  /**
   * List signature requests with filters.
   */
  async getRequestList({ page = 1, limit = 20, status, entity, action, requestedById, search }) {
    const where = {};
    if (status) where.status = status;
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (requestedById) where.requestedById = requestedById;
    if (search) {
      where[Op.or] = [
        { requestNumber: { [Op.iLike]: `%${search}%` } },
        { title: { [Op.iLike]: `%${search}%` } },
      ];
    }

    return ESignRequest.findAndCountAll({
      where,
      include: [
        { model: User, as: "requestedBy", attributes: ["id", "name", "surname"] },
        {
          model: ESignRequestSigner,
          as: "signers",
          include: [{ model: User, as: "signer", attributes: ["id", "name", "surname"] }],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: Math.min(limit, 100),
      offset: (page - 1) * limit,
    });
  }

  // ═══ ENTITY SIGNATURES ═══

  /**
   * Get all signatures for a given entity.
   */
  async getSignaturesForEntity(entity, entityId) {
    return ESignature.findAll({
      where: { signedEntity: entity, signedEntityId: entityId },
      include: [
        { model: User, as: "signer", attributes: ["id", "name", "surname"] },
        { model: User, as: "invalidatedBy", attributes: ["id", "name", "surname"] },
      ],
      order: [["signedAt", "DESC"]],
    });
  }

  // ═══ VERIFY ═══

  /**
   * Re-verify a signature's hash integrity.
   */
  async verifySignature(id) {
    const signature = await ESignature.findByPk(id);
    if (!signature) throw ApiError.notFound("Signature not found");

    // Recompute hash from stored fields
    const hashInput = `${signature.signedEntity}${signature.signedEntityId}${signature.signedAction}${signature.signerId}${signature.signedAt.toISOString()}`;
    const recomputedHash = crypto.createHash("sha256").update(hashInput).digest("hex");

    const isIntact = recomputedHash === signature.signatureHash;

    return {
      signatureId: signature.id,
      storedHash: signature.signatureHash,
      recomputedHash,
      isIntact,
      isValid: signature.isValid,
      signedAt: signature.signedAt,
      signedEntity: signature.signedEntity,
      signedEntityId: signature.signedEntityId,
      signedAction: signature.signedAction,
    };
  }

  // ═══ INVALIDATE ═══

  /**
   * Mark a signature as invalid (e.g. discovered fraud, retracted approval).
   */
  async invalidateSignature(req, id, reason) {
    if (!reason) throw ApiError.badRequest("Invalidation reason is required");

    const signature = await ESignature.findByPk(id);
    if (!signature) throw ApiError.notFound("Signature not found");
    if (!signature.isValid) throw ApiError.badRequest("Signature is already invalidated");

    await signature.update({
      isValid: false,
      invalidatedById: req.user.id,
      invalidatedAt: new Date(),
      invalidationReason: reason,
    });

    await logAudit({
      req,
      userId: req.user.id,
      action: "ESIGN_INVALIDATE",
      entity: "esignature",
      entityId: signature.id,
      description: `Signature #${id} invalidated: ${reason}`,
      metadata: {
        signatureHash: signature.signatureHash,
        signedEntity: signature.signedEntity,
        signedEntityId: signature.signedEntityId,
        signedAction: signature.signedAction,
        invalidationReason: reason,
      },
      severity: "WARNING",
    });

    return signature;
  }

  // ═══ DECLINE ═══

  /**
   * Decline to sign a request.
   */
  async declineRequest(req, requestSignerId, reason) {
    const requestSigner = await ESignRequestSigner.findByPk(requestSignerId, {
      include: [{ model: ESignRequest, as: "request" }],
    });
    if (!requestSigner) throw ApiError.notFound("Signer record not found");
    if (requestSigner.signerId !== req.user.id) {
      throw ApiError.forbidden("You are not the designated signer");
    }
    if (requestSigner.status !== SIGNER_STATUSES.PENDING) {
      throw ApiError.badRequest(`Signer record is already ${requestSigner.status}`);
    }

    await requestSigner.update({
      status: SIGNER_STATUSES.DECLINED,
      declineReason: reason || null,
    });

    await logAudit({
      req,
      userId: req.user.id,
      action: "ESIGN_DECLINE",
      entity: "esign_request_signer",
      entityId: requestSigner.id,
      description: `Signer declined request ${requestSigner.request?.requestNumber || requestSigner.requestId}`,
      metadata: {
        requestId: requestSigner.requestId,
        declineReason: reason || null,
      },
      severity: "INFO",
    });

    return requestSigner;
  }

  // ═══ POLICIES ═══

  /**
   * List all active signing policies.
   */
  async getPolicies() {
    return ESignPolicy.findAll({
      where: { isActive: true },
      include: [{ model: User, as: "createdBy", attributes: ["id", "name", "surname"] }],
      order: [["entity", "ASC"], ["action", "ASC"]],
    });
  }

  /**
   * Create a new signing policy.
   */
  async createPolicy(req, data) {
    const { entity, action, requiredSignatures, requiredRoles, sequentialSigning, expirationHours } = data;

    if (!entity || !action) {
      throw ApiError.badRequest("entity and action are required");
    }

    // Check for duplicate active policy
    const existing = await ESignPolicy.findOne({
      where: { entity, action, isActive: true },
    });
    if (existing) {
      throw ApiError.badRequest(`An active policy already exists for ${entity}/${action}`);
    }

    const policy = await ESignPolicy.create({
      entity,
      action,
      requiredSignatures: requiredSignatures || 1,
      requiredRoles: requiredRoles || [],
      sequentialSigning: sequentialSigning || false,
      expirationHours: expirationHours || null,
      isActive: true,
      createdById: req.user.id,
    });

    await logAudit({
      req,
      userId: req.user.id,
      action: "ESIGN_POLICY_CREATE",
      entity: "esign_policy",
      entityId: policy.id,
      description: `Signing policy created for ${entity}/${action}`,
      metadata: { entity, action, requiredSignatures: policy.requiredSignatures },
      severity: "INFO",
    });

    return policy;
  }

  /**
   * Update an existing signing policy.
   */
  async updatePolicy(req, id, data) {
    const policy = await ESignPolicy.findByPk(id);
    if (!policy) throw ApiError.notFound("Policy not found");

    const allowedFields = [
      "requiredSignatures", "requiredRoles", "sequentialSigning",
      "expirationHours", "isActive",
    ];
    const safeData = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) safeData[field] = data[field];
    }

    await policy.update(safeData);

    await logAudit({
      req,
      userId: req.user.id,
      action: "ESIGN_POLICY_UPDATE",
      entity: "esign_policy",
      entityId: policy.id,
      description: `Signing policy #${id} updated`,
      metadata: { updatedFields: Object.keys(safeData) },
      severity: "INFO",
    });

    return policy;
  }

  /**
   * Check if a policy exists for the given entity/action and return requirements.
   */
  async checkPolicy(entity, action) {
    const policy = await ESignPolicy.findOne({
      where: { entity, action, isActive: true },
    });
    return policy || null;
  }
}

module.exports = new ESignService();
