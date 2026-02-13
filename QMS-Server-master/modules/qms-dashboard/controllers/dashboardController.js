/**
 * dashboardController.js — REST API для дашборда QMS и целей качества
 */

const ApiError = require("../../../error/ApiError");
const DashboardService = require("../services/DashboardService");
const { QualityObjective, QO_STATUSES, QO_CATEGORIES } = require("../models/QualityObjective");
const sequelize = require("../../../db");

const service = new DashboardService();

const handleError = (e, next) => {
  if (e instanceof ApiError) return next(e);
  if (e.message && !e.message.includes("Cannot") && !e.message.includes("ECONNREFUSED")) {
    return next(ApiError.badRequest(e.message));
  }
  console.error("DashboardController error:", e);
  return next(ApiError.internal("Внутренняя ошибка сервера"));
};

// Допустимые поля для обновления
const QO_UPDATABLE_FIELDS = [
  "title", "description", "metric", "targetValue", "currentValue", "unit",
  "status", "category", "responsibleId", "isoClause", "progress",
  "dueDate", "periodFrom", "periodTo",
];

class DashboardController {

  // ── Агрегированные данные ──

  async getSummary(req, res, next) {
    try {
      const data = await service.getSummary();
      return res.json(data);
    } catch (e) { handleError(e, next); }
  }

  async getTrends(req, res, next) {
    try {
      const data = await service.getTrends();
      return res.json(data);
    } catch (e) { handleError(e, next); }
  }

  // ── Quality Objectives CRUD ──

  async getObjectives(req, res, next) {
    try {
      const { status, category, page = 1, limit = 50 } = req.query;
      const where = {};
      if (status) where.status = status;
      if (category) where.category = category;

      const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
      const allModels = require("../../../models/index");
      const User = allModels.User;

      const result = await QualityObjective.findAndCountAll({
        where,
        include: User ? [{ model: User, as: "responsible", attributes: ["id", "name", "surname"] }] : [],
        order: [["dueDate", "ASC"]],
        limit: parseInt(limit, 10),
        offset,
      });

      return res.json({
        rows: result.rows,
        count: result.count,
        page: parseInt(page, 10),
        totalPages: Math.ceil(result.count / parseInt(limit, 10)),
      });
    } catch (e) { handleError(e, next); }
  }

  async getObjectiveOne(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));

      const allModels = require("../../../models/index");
      const User = allModels.User;

      const qo = await QualityObjective.findByPk(id, {
        include: User ? [{ model: User, as: "responsible", attributes: ["id", "name", "surname"] }] : [],
      });
      if (!qo) return next(ApiError.notFound("Цель качества не найдена"));
      return res.json(qo);
    } catch (e) { handleError(e, next); }
  }

  async createObjective(req, res, next) {
    const t = await sequelize.transaction({ isolationLevel: "SERIALIZABLE" });
    try {
      const { title, metric, targetValue, category } = req.body;
      if (!title) throw new Error("Поле title обязательно");
      if (!metric) throw new Error("Поле metric обязательно");
      if (targetValue == null) throw new Error("Поле targetValue обязательно");
      if (!category || !Object.values(QO_CATEGORIES).includes(category)) {
        throw new Error("Некорректная категория");
      }

      // Автонумерация QO-YYYY-NNN
      const year = new Date().getFullYear();
      const [maxResult] = await sequelize.query(
        `SELECT MAX(CAST(SUBSTRING(number FROM '(\\d+)$') AS INTEGER)) AS max_num
         FROM quality_objectives
         WHERE number LIKE 'QO-${year}-%'`,
        { transaction: t, type: sequelize.QueryTypes.SELECT }
      );
      const num = (maxResult?.max_num || 0) + 1;
      const number = `QO-${year}-${String(num).padStart(3, "0")}`;

      const qo = await QualityObjective.create({
        number,
        title,
        description: req.body.description,
        metric,
        targetValue,
        currentValue: req.body.currentValue,
        unit: req.body.unit,
        status: QO_STATUSES.ACTIVE,
        category,
        responsibleId: req.body.responsibleId,
        managementReviewId: req.body.managementReviewId,
        isoClause: req.body.isoClause,
        progress: req.body.progress || 0,
        dueDate: req.body.dueDate,
        periodFrom: req.body.periodFrom,
        periodTo: req.body.periodTo,
      }, { transaction: t });

      await t.commit();
      return res.status(201).json(qo);
    } catch (e) {
      await t.rollback();
      handleError(e, next);
    }
  }

  async updateObjective(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));

      const qo = await QualityObjective.findByPk(id);
      if (!qo) return next(ApiError.notFound("Цель качества не найдена"));

      const updates = {};
      for (const field of QO_UPDATABLE_FIELDS) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      // Автоматическое вычисление прогресса если обновлены значения
      if (updates.currentValue !== undefined && qo.targetValue) {
        const current = updates.currentValue;
        const target = updates.targetValue !== undefined ? updates.targetValue : qo.targetValue;
        if (target !== 0) {
          updates.progress = Math.min(100, Math.max(0, Math.round((current / target) * 100)));
        }
      }

      await qo.update(updates);
      return res.json(qo);
    } catch (e) { handleError(e, next); }
  }

  async deleteObjective(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return next(ApiError.badRequest("Некорректный ID"));

      const qo = await QualityObjective.findByPk(id);
      if (!qo) return next(ApiError.notFound("Цель качества не найдена"));

      // Мягкое удаление — переводим в CANCELLED
      await qo.update({ status: QO_STATUSES.CANCELLED });
      return res.json({ message: "Цель отменена", id });
    } catch (e) { handleError(e, next); }
  }
}

module.exports = new DashboardController();
