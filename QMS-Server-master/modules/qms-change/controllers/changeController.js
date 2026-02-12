const { ChangeRequest } = require("../models/ChangeRequest");
const sequelize = require("../../../db");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");

const getAll = async (req, res, next) => {
  try {
    const { status, type, priority, category, page = 1, limit = 50 } = req.query;
    const where = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await ChangeRequest.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("ChangeRequest getAll error:", e);
    next(ApiError.internal(e.message));
  }
};

const getOne = async (req, res, next) => {
  try {
    const cr = await ChangeRequest.findByPk(req.params.id);
    if (!cr) return next(ApiError.notFound("Запрос на изменение не найден"));
    res.json(cr);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Требуется авторизация"));

    const year = new Date().getFullYear();
    const [maxResult] = await sequelize.query(
      `SELECT MAX(CAST(SUBSTRING("changeNumber" FROM '(\\d+)$') AS INTEGER)) AS max_num FROM change_requests WHERE "changeNumber" LIKE 'ECR-${year}-%'`
    );
    const maxNum = maxResult?.[0]?.max_num || 0;
    const changeNumber = `ECR-${year}-${String(maxNum + 1).padStart(3, "0")}`;

    const cr = await ChangeRequest.create({
      ...req.body,
      changeNumber,
      initiatorId: req.body.initiatorId || req.user.id,
    });

    await logAudit({
      req,
      action: "CHANGE_REQUEST_CREATE",
      entity: "ChangeRequest",
      entityId: cr.id,
      description: `Создан запрос на изменение: ${changeNumber}`,
    });

    res.status(201).json(cr);
  } catch (e) {
    console.error("ChangeRequest create error:", e);
    next(ApiError.internal(e.message));
  }
};

const update = async (req, res, next) => {
  try {
    const cr = await ChangeRequest.findByPk(req.params.id);
    if (!cr) return next(ApiError.notFound("Запрос на изменение не найден"));

    await cr.update(req.body);

    await logAudit({
      req,
      action: "CHANGE_REQUEST_UPDATE",
      entity: "ChangeRequest",
      entityId: cr.id,
      description: `Обновлён запрос на изменение: ${cr.changeNumber}`,
    });

    res.json(cr);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const getStats = async (req, res, next) => {
  try {
    const total = await ChangeRequest.count();
    const pendingApproval = await ChangeRequest.count({
      where: { status: ["SUBMITTED", "IMPACT_REVIEW"] },
    });
    const inProgress = await ChangeRequest.count({
      where: { status: ["IN_PROGRESS", "VERIFICATION"] },
    });
    const rejected = await ChangeRequest.count({ where: { status: "REJECTED" } });

    const completedCRs = await ChangeRequest.findAll({
      where: { status: "COMPLETED", completedDate: { [require("sequelize").Op.ne]: null } },
      attributes: ["createdAt", "completedDate"],
    });

    let avgImplementDays = 0;
    if (completedCRs.length > 0) {
      const totalDays = completedCRs.reduce((sum, cr) => {
        const diff = (new Date(cr.completedDate) - new Date(cr.createdAt)) / (1000 * 60 * 60 * 24);
        return sum + diff;
      }, 0);
      avgImplementDays = Math.round(totalDays / completedCRs.length);
    }

    res.json({ total, pendingApproval, inProgress, rejected, avgImplementDays });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

module.exports = { getAll, getOne, create, update, getStats };
