/**
 * esignController.js — REST API for Electronic Signatures (21 CFR Part 11 / ISO 13485)
 */

const ApiError = require("../../../error/ApiError");
const ESignService = require("../services/ESignService");

// Helper: business errors → 400, infrastructure → 500
const handleError = (e, next) => {
  if (e instanceof ApiError) return next(e);
  if (e.message && !e.message.includes("Cannot") && !e.message.includes("ECONNREFUSED")) {
    return next(ApiError.badRequest(e.message));
  }
  console.error("ESignController error:", e);
  return next(ApiError.internal("Internal server error"));
};

class ESignController {
  // ── Sign ──
  async sign(req, res, next) {
    try {
      const signature = await ESignService.sign(req, req.body);
      return res.status(201).json(signature);
    } catch (e) { handleError(e, next); }
  }

  // ── Requests ──
  async createRequest(req, res, next) {
    try {
      const request = await ESignService.createRequest(req, req.body);
      return res.status(201).json(request);
    } catch (e) { handleError(e, next); }
  }

  async getRequestDetail(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Invalid ID"));
      const request = await ESignService.getRequestDetail(id);
      if (!request) return next(ApiError.notFound("Signature request not found"));
      return res.json(request);
    } catch (e) { handleError(e, next); }
  }

  async getRequestList(req, res, next) {
    try {
      const result = await ESignService.getRequestList(req.query);
      return res.json(result);
    } catch (e) { handleError(e, next); }
  }

  // ── Entity signatures ──
  async getSignaturesForEntity(req, res, next) {
    try {
      const { entity, entityId } = req.params;
      const numericId = Number(entityId);
      if (!entity || isNaN(numericId)) return next(ApiError.badRequest("Invalid entity or entityId"));
      const signatures = await ESignService.getSignaturesForEntity(entity, numericId);
      return res.json(signatures);
    } catch (e) { handleError(e, next); }
  }

  // ── Verify ──
  async verifySignature(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Invalid ID"));
      const result = await ESignService.verifySignature(id);
      return res.json(result);
    } catch (e) { handleError(e, next); }
  }

  // ── Invalidate ──
  async invalidateSignature(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Invalid ID"));
      const signature = await ESignService.invalidateSignature(req, id, req.body.reason);
      return res.json(signature);
    } catch (e) { handleError(e, next); }
  }

  // ── Decline ──
  async declineRequest(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Invalid ID"));
      const result = await ESignService.declineRequest(req, id, req.body.reason);
      return res.json(result);
    } catch (e) { handleError(e, next); }
  }

  // ── Policies ──
  async getPolicies(req, res, next) {
    try {
      const policies = await ESignService.getPolicies();
      return res.json(policies);
    } catch (e) { handleError(e, next); }
  }

  async createPolicy(req, res, next) {
    try {
      const policy = await ESignService.createPolicy(req, req.body);
      return res.status(201).json(policy);
    } catch (e) { handleError(e, next); }
  }

  async updatePolicy(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Invalid ID"));
      const policy = await ESignService.updatePolicy(req, id, req.body);
      return res.json(policy);
    } catch (e) { handleError(e, next); }
  }
}

module.exports = new ESignController();
