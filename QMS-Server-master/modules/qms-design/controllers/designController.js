/**
 * designController.js — REST API for Design Control (ISO 13485 §7.3)
 */

const ApiError = require("../../../error/ApiError");
const DesignService = require("../services/DesignService");

// Helper: business errors → 400, infrastructure errors → 500
const handleError = (e, next) => {
  if (e instanceof ApiError) return next(e);
  if (e.message && !e.message.includes("Cannot") && !e.message.includes("ECONNREFUSED")) {
    return next(ApiError.badRequest(e.message));
  }
  console.error("DesignController error:", e);
  return next(ApiError.internal("Internal server error"));
};

class DesignController {
  // ── Project ──

  async getProjectList(req, res, next) {
    try {
      const result = await DesignService.getProjectList(req.query);
      return res.json(result);
    } catch (e) { handleError(e, next); }
  }

  async getProjectDetail(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Invalid ID"));
      const project = await DesignService.getProjectDetail(id);
      if (!project) return next(ApiError.notFound("Design project not found"));
      return res.json(project);
    } catch (e) { handleError(e, next); }
  }

  async createProject(req, res, next) {
    try {
      const project = await DesignService.createProject(req, req.body);
      return res.status(201).json(project);
    } catch (e) { handleError(e, next); }
  }

  async updateProject(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Invalid ID"));
      const project = await DesignService.updateProject(req, id, req.body);
      return res.json(project);
    } catch (e) { handleError(e, next); }
  }

  // ── Input (§7.3.3) ──

  async addInput(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Invalid ID"));
      const input = await DesignService.addInput(req, id, req.body);
      return res.status(201).json(input);
    } catch (e) { handleError(e, next); }
  }

  async updateInput(req, res, next) {
    try {
      const inputId = Number(req.params.inputId);
      if (isNaN(inputId)) return next(ApiError.badRequest("Invalid ID"));
      const input = await DesignService.updateInput(req, inputId, req.body);
      return res.json(input);
    } catch (e) { handleError(e, next); }
  }

  // ── Output (§7.3.4) ──

  async addOutput(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Invalid ID"));
      const output = await DesignService.addOutput(req, id, req.body);
      return res.status(201).json(output);
    } catch (e) { handleError(e, next); }
  }

  async updateOutput(req, res, next) {
    try {
      const outputId = Number(req.params.outputId);
      if (isNaN(outputId)) return next(ApiError.badRequest("Invalid ID"));
      const output = await DesignService.updateOutput(req, outputId, req.body);
      return res.json(output);
    } catch (e) { handleError(e, next); }
  }

  // ── Review (§7.3.5) ──

  async addReview(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Invalid ID"));
      const review = await DesignService.addReview(req, id, req.body);
      return res.status(201).json(review);
    } catch (e) { handleError(e, next); }
  }

  async completeReview(req, res, next) {
    try {
      const reviewId = Number(req.params.reviewId);
      if (isNaN(reviewId)) return next(ApiError.badRequest("Invalid ID"));
      const review = await DesignService.completeReview(req, reviewId, req.body);
      return res.json(review);
    } catch (e) { handleError(e, next); }
  }

  // ── Verification (§7.3.6) ──

  async addVerification(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Invalid ID"));
      const verification = await DesignService.addVerification(req, id, req.body);
      return res.status(201).json(verification);
    } catch (e) { handleError(e, next); }
  }

  async updateVerification(req, res, next) {
    try {
      const vId = Number(req.params.vId);
      if (isNaN(vId)) return next(ApiError.badRequest("Invalid ID"));
      const verification = await DesignService.updateVerification(req, vId, req.body);
      return res.json(verification);
    } catch (e) { handleError(e, next); }
  }

  // ── Validation (§7.3.7) ──

  async addValidation(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Invalid ID"));
      const validation = await DesignService.addValidation(req, id, req.body);
      return res.status(201).json(validation);
    } catch (e) { handleError(e, next); }
  }

  async updateValidation(req, res, next) {
    try {
      const vId = Number(req.params.vId);
      if (isNaN(vId)) return next(ApiError.badRequest("Invalid ID"));
      const validation = await DesignService.updateValidation(req, vId, req.body);
      return res.json(validation);
    } catch (e) { handleError(e, next); }
  }

  // ── Transfer (§7.3.8) ──

  async addTransfer(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Invalid ID"));
      const transfer = await DesignService.addTransfer(req, id, req.body);
      return res.status(201).json(transfer);
    } catch (e) { handleError(e, next); }
  }

  async completeTransfer(req, res, next) {
    try {
      const tId = Number(req.params.tId);
      if (isNaN(tId)) return next(ApiError.badRequest("Invalid ID"));
      const transfer = await DesignService.completeTransfer(req, tId, req.body);
      return res.json(transfer);
    } catch (e) { handleError(e, next); }
  }

  // ── Change (§7.3.9) ──

  async createChange(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Invalid ID"));
      const change = await DesignService.createChange(req, id, req.body);
      return res.status(201).json(change);
    } catch (e) { handleError(e, next); }
  }

  async updateChangeStatus(req, res, next) {
    try {
      const cId = Number(req.params.cId);
      if (isNaN(cId)) return next(ApiError.badRequest("Invalid ID"));
      const change = await DesignService.updateChangeStatus(req, cId, req.body);
      return res.json(change);
    } catch (e) { handleError(e, next); }
  }

  // ── Stats ──

  async getStats(req, res, next) {
    try {
      const stats = await DesignService.getStats();
      return res.json(stats);
    } catch (e) { handleError(e, next); }
  }
}

module.exports = new DesignController();
