/**
 * ncCapaController.js — REST API для NC и CAPA
 * НОВЫЙ ФАЙЛ: controllers/ncCapaController.js
 */

const ApiError = require("../../../error/ApiError");
const NcCapaService = require("../services/NcCapaService");

class NcCapaController {
  // ── NC ──
  async getNcList(req, res, next) {
    try {
      const result = await NcCapaService.getNCList(req.query);
      return res.json(result);
    } catch (e) { next(ApiError.badRequest(e.message)); }
  }

  async getNcOne(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));
      const nc = await NcCapaService.getNCDetail(id);
      if (!nc) return next(ApiError.notFound("NC не найдена"));
      return res.json(nc);
    } catch (e) { next(ApiError.badRequest(e.message)); }
  }

  async createNc(req, res, next) {
    try {
      const nc = await NcCapaService.createNC(req, req.body);
      return res.status(201).json(nc);
    } catch (e) { next(ApiError.badRequest(e.message)); }
  }

  async updateNc(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));
      const nc = await NcCapaService.updateNC(req, id, req.body);
      return res.json(nc);
    } catch (e) { next(ApiError.badRequest(e.message)); }
  }

  async closeNc(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));
      const nc = await NcCapaService.closeNC(req, id, req.body);
      return res.json(nc);
    } catch (e) { next(ApiError.badRequest(e.message)); }
  }

  // ── CAPA ──
  async getCapaList(req, res, next) {
    try {
      const result = await NcCapaService.getCAPAList(req.query);
      return res.json(result);
    } catch (e) { next(ApiError.badRequest(e.message)); }
  }

  async getCapaOne(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));
      const capa = await NcCapaService.getCAPADetail(id);
      if (!capa) return next(ApiError.notFound("CAPA не найдена"));
      return res.json(capa);
    } catch (e) { next(ApiError.badRequest(e.message)); }
  }

  async createCapa(req, res, next) {
    try {
      const capa = await NcCapaService.createCAPA(req, req.body);
      return res.status(201).json(capa);
    } catch (e) { next(ApiError.badRequest(e.message)); }
  }

  async updateCapaStatus(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));
      const capa = await NcCapaService.updateCAPAStatus(req, id, req.body);
      return res.json(capa);
    } catch (e) { next(ApiError.badRequest(e.message)); }
  }

  async addCapaAction(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));
      const action = await NcCapaService.addCapaAction(req, id, req.body);
      return res.status(201).json(action);
    } catch (e) { next(ApiError.badRequest(e.message)); }
  }

  async updateCapaAction(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));
      const action = await NcCapaService.updateCapaAction(req, id, req.body);
      return res.json(action);
    } catch (e) { next(ApiError.badRequest(e.message)); }
  }

  async verifyEffectiveness(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));
      const v = await NcCapaService.verifyCapaEffectiveness(req, id, req.body);
      return res.json(v);
    } catch (e) { next(ApiError.badRequest(e.message)); }
  }

  // ── Stats ──
  async getStats(req, res, next) {
    try {
      const stats = await NcCapaService.getStats();
      return res.json(stats);
    } catch (e) { next(ApiError.badRequest(e.message)); }
  }
}

module.exports = new NcCapaController();
