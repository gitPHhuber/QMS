/**
 * ncCapaController.js — REST API для NC и CAPA
 */

const ApiError = require("../../../error/ApiError");
const NcCapaService = require("../services/NcCapaService");
const SlaEscalationService = require("../services/SlaEscalationService");

// Хелпер: бизнес-ошибки → 400, инфраструктурные → 500
const handleError = (e, next) => {
  if (e instanceof ApiError) return next(e);
  if (e.message && !e.message.includes("Cannot") && !e.message.includes("ECONNREFUSED")) {
    return next(ApiError.badRequest(e.message));
  }
  console.error("NcCapaController error:", e);
  return next(ApiError.internal("Внутренняя ошибка сервера"));
};

class NcCapaController {
  // ── NC ──
  async getNcList(req, res, next) {
    try {
      const result = await NcCapaService.getNCList(req.query);
      return res.json(result);
    } catch (e) { handleError(e, next); }
  }

  async getNcOne(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));
      const nc = await NcCapaService.getNCDetail(id);
      if (!nc) return next(ApiError.notFound("NC не найдена"));
      return res.json(nc);
    } catch (e) { handleError(e, next); }
  }

  async createNc(req, res, next) {
    try {
      const nc = await NcCapaService.createNC(req, req.body);
      return res.status(201).json(nc);
    } catch (e) { handleError(e, next); }
  }

  async updateNc(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));
      const nc = await NcCapaService.updateNC(req, id, req.body);
      return res.json(nc);
    } catch (e) { handleError(e, next); }
  }

  async closeNc(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));
      const nc = await NcCapaService.closeNC(req, id, req.body);
      return res.json(nc);
    } catch (e) { handleError(e, next); }
  }

  // ── CAPA ──
  async getCapaList(req, res, next) {
    try {
      const result = await NcCapaService.getCAPAList(req.query);
      return res.json(result);
    } catch (e) { handleError(e, next); }
  }

  async getCapaOne(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));
      const capa = await NcCapaService.getCAPADetail(id);
      if (!capa) return next(ApiError.notFound("CAPA не найдена"));
      return res.json(capa);
    } catch (e) { handleError(e, next); }
  }

  async createCapa(req, res, next) {
    try {
      const capa = await NcCapaService.createCAPA(req, req.body);
      return res.status(201).json(capa);
    } catch (e) { handleError(e, next); }
  }

  async updateCapaStatus(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));
      const capa = await NcCapaService.updateCAPAStatus(req, id, req.body);
      return res.json(capa);
    } catch (e) { handleError(e, next); }
  }

  async addCapaAction(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));
      const action = await NcCapaService.addCapaAction(req, id, req.body);
      return res.status(201).json(action);
    } catch (e) { handleError(e, next); }
  }

  async updateCapaAction(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));
      const action = await NcCapaService.updateCapaAction(req, id, req.body);
      return res.json(action);
    } catch (e) { handleError(e, next); }
  }

  async verifyEffectiveness(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));
      const v = await NcCapaService.verifyCapaEffectiveness(req, id, req.body);
      return res.json(v);
    } catch (e) { handleError(e, next); }
  }

  // ── Stats ──
  async getStats(req, res, next) {
    try {
      const stats = await NcCapaService.getStats();
      return res.json(stats);
    } catch (e) { handleError(e, next); }
  }

  // ── SLA Escalation ──
  async checkEscalation(req, res, next) {
    try {
      const results = await SlaEscalationService.checkAndEscalate();
      return res.json(results);
    } catch (e) { handleError(e, next); }
  }

  async getOverdueItems(req, res, next) {
    try {
      const items = await SlaEscalationService.getOverdueItems();
      return res.json(items);
    } catch (e) { handleError(e, next); }
  }

  // ── NC ↔ Risk linkage ──
  async linkNcToRisk(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));
      const nc = await NcCapaService.linkNCToRisk(req, id, req.body.riskRegisterId);
      return res.json(nc);
    } catch (e) { handleError(e, next); }
  }

  async unlinkNcFromRisk(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));
      const nc = await NcCapaService.unlinkNCFromRisk(req, id);
      return res.json(nc);
    } catch (e) { handleError(e, next); }
  }
}

module.exports = new NcCapaController();
