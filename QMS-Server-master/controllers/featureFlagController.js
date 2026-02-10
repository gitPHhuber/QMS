const { FeatureFlag } = require("../models/index");
const { moduleManager } = require("../config/modules");
const ApiError = require("../error/ApiError");

class FeatureFlagController {

  async getAll(req, res, next) {
    try {
      const flags = await FeatureFlag.findAll({ order: [["code", "ASC"]] });
      return res.json(flags);
    } catch (e) {
      next(ApiError.internal(e.message));
    }
  }

  async getOne(req, res, next) {
    try {
      const flag = await FeatureFlag.findByPk(req.params.id);
      if (!flag) return next(ApiError.notFound("Flag not found"));
      return res.json(flag);
    } catch (e) {
      next(ApiError.internal(e.message));
    }
  }

  async create(req, res, next) {
    try {
      const { code, name, description, enabled, scope, metadata } = req.body;
      if (!code || !name) {
        return next(ApiError.badRequest("code and name are required"));
      }

      const existing = await FeatureFlag.findOne({ where: { code } });
      if (existing) {
        return next(ApiError.badRequest(`Flag "${code}" already exists`));
      }

      const flag = await FeatureFlag.create({
        code,
        name,
        description: description || null,
        enabled: enabled ?? false,
        scope: scope || "module",
        metadata: metadata || null,
      });

      await moduleManager.loadFlags();
      return res.status(201).json(flag);
    } catch (e) {
      next(ApiError.internal(e.message));
    }
  }

  async update(req, res, next) {
    try {
      const flag = await FeatureFlag.findByPk(req.params.id);
      if (!flag) return next(ApiError.notFound("Flag not found"));

      const { name, description, enabled, scope, metadata } = req.body;
      await flag.update({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(enabled !== undefined && { enabled }),
        ...(scope !== undefined && { scope }),
        ...(metadata !== undefined && { metadata }),
      });

      await moduleManager.loadFlags();
      return res.json(flag);
    } catch (e) {
      next(ApiError.internal(e.message));
    }
  }

  async toggle(req, res, next) {
    try {
      const flag = await FeatureFlag.findByPk(req.params.id);
      if (!flag) return next(ApiError.notFound("Flag not found"));

      await flag.update({ enabled: !flag.enabled });
      await moduleManager.loadFlags();

      return res.json(flag);
    } catch (e) {
      next(ApiError.internal(e.message));
    }
  }

  async remove(req, res, next) {
    try {
      const flag = await FeatureFlag.findByPk(req.params.id);
      if (!flag) return next(ApiError.notFound("Flag not found"));

      await flag.destroy();
      await moduleManager.loadFlags();

      return res.json({ message: `Flag "${flag.code}" deleted` });
    } catch (e) {
      next(ApiError.internal(e.message));
    }
  }
}

module.exports = new FeatureFlagController();
