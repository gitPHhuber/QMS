const { ProcessValidation } = require("../models/ProcessValidation");
const sequelize = require("../../../db");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");

const getAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const where = {};

    if (status) where.status = status;

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await ProcessValidation.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("ProcessValidation getAll error:", e);
    next(ApiError.internal(e.message));
  }
};

const getOne = async (req, res, next) => {
  try {
    const pv = await ProcessValidation.findByPk(req.params.id);
    if (!pv) return next(ApiError.notFound("Валидация процесса не найдена"));
    res.json(pv);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Требуется авторизация"));

    const year = new Date().getFullYear();
    const [maxResult] = await sequelize.query(
      `SELECT MAX(CAST(SUBSTRING("validationNumber" FROM '(\\d+)$') AS INTEGER)) AS max_num FROM process_validations WHERE "validationNumber" LIKE 'PV-${year}-%'`
    );
    const maxNum = maxResult?.[0]?.max_num || 0;
    const validationNumber = `PV-${year}-${String(maxNum + 1).padStart(3, "0")}`;

    const pv = await ProcessValidation.create({
      ...req.body,
      validationNumber,
    });

    await logAudit({
      req,
      action: "VALIDATION_CREATE",
      entity: "ProcessValidation",
      entityId: pv.id,
      description: `Создана валидация процесса: ${validationNumber}`,
    });

    res.status(201).json(pv);
  } catch (e) {
    console.error("ProcessValidation create error:", e);
    next(ApiError.internal(e.message));
  }
};

const update = async (req, res, next) => {
  try {
    const pv = await ProcessValidation.findByPk(req.params.id);
    if (!pv) return next(ApiError.notFound("Валидация процесса не найдена"));

    await pv.update(req.body);

    await logAudit({
      req,
      action: "VALIDATION_UPDATE",
      entity: "ProcessValidation",
      entityId: pv.id,
      description: `Обновлена валидация: ${pv.validationNumber}`,
    });

    res.json(pv);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const getStats = async (req, res, next) => {
  try {
    const total = await ProcessValidation.count();
    const validated = await ProcessValidation.count({ where: { status: "VALIDATED" } });
    const revalidationDue = await ProcessValidation.count({ where: { status: "REVALIDATION_DUE" } });
    const failed = await ProcessValidation.count({ where: { status: "FAILED" } });

    // Find nearest revalidation date
    const { Op } = require("sequelize");
    const nearest = await ProcessValidation.findOne({
      where: {
        nextRevalidationDate: { [Op.ne]: null, [Op.gte]: new Date() },
      },
      order: [["nextRevalidationDate", "ASC"]],
      attributes: ["nextRevalidationDate"],
    });

    let nearestRevalidationDays = null;
    if (nearest?.nextRevalidationDate) {
      nearestRevalidationDays = Math.ceil(
        (new Date(nearest.nextRevalidationDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
    }

    res.json({ total, validated, revalidationDue, failed, nearestRevalidationDays });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

module.exports = { getAll, getOne, create, update, getStats };
