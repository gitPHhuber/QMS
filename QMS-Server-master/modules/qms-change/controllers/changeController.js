const { ChangeRequest } = require("../models/ChangeRequest");
const { ChangeImpactItem } = require("../models/ChangeImpactItem");
const sequelize = require("../../../db");
const { Op } = require("sequelize");
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

// ═══════════════════════════════════════════════════════════════
// ChangeImpactItem CRUD
// ═══════════════════════════════════════════════════════════════

const getImpactItems = async (req, res, next) => {
  try {
    const changeRequestId = parseInt(req.params.id);
    if (isNaN(changeRequestId)) return next(ApiError.badRequest("Invalid change request ID"));

    const cr = await ChangeRequest.findByPk(changeRequestId);
    if (!cr) return next(ApiError.notFound("Change request not found"));

    const items = await ChangeImpactItem.findAll({
      where: { changeRequestId },
      order: [["createdAt", "ASC"]],
    });

    res.json(items);
  } catch (e) {
    console.error("ChangeImpactItem getImpactItems error:", e);
    next(ApiError.internal(e.message));
  }
};

const addImpactItem = async (req, res, next) => {
  try {
    const changeRequestId = parseInt(req.params.id);
    if (isNaN(changeRequestId)) return next(ApiError.badRequest("Invalid change request ID"));

    const cr = await ChangeRequest.findByPk(changeRequestId);
    if (!cr) return next(ApiError.notFound("Change request not found"));

    const item = await ChangeImpactItem.create({
      ...req.body,
      changeRequestId,
      assessedById: req.body.assessedById || req.user?.id,
      assessedAt: new Date(),
    });

    await logAudit({
      req,
      action: "CHANGE_REQUEST_UPDATE",
      entity: "ChangeImpactItem",
      entityId: item.id,
      description: `Added impact item (${item.impactArea}) to change request ${cr.changeNumber}`,
    });

    res.status(201).json(item);
  } catch (e) {
    console.error("ChangeImpactItem addImpactItem error:", e);
    next(ApiError.internal(e.message));
  }
};

const updateImpactItem = async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.itemId);
    if (isNaN(itemId)) return next(ApiError.badRequest("Invalid impact item ID"));

    const item = await ChangeImpactItem.findByPk(itemId);
    if (!item) return next(ApiError.notFound("Impact item not found"));

    await item.update(req.body);

    await logAudit({
      req,
      action: "CHANGE_REQUEST_UPDATE",
      entity: "ChangeImpactItem",
      entityId: item.id,
      description: `Updated impact item (${item.impactArea}) for change request #${item.changeRequestId}`,
    });

    res.json(item);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const deleteImpactItem = async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.itemId);
    if (isNaN(itemId)) return next(ApiError.badRequest("Invalid impact item ID"));

    const item = await ChangeImpactItem.findByPk(itemId);
    if (!item) return next(ApiError.notFound("Impact item not found"));

    const impactArea = item.impactArea;
    const changeRequestId = item.changeRequestId;
    await item.destroy();

    await logAudit({
      req,
      action: "CHANGE_REQUEST_UPDATE",
      entity: "ChangeImpactItem",
      entityId: itemId,
      description: `Deleted impact item (${impactArea}) from change request #${changeRequestId}`,
    });

    res.json({ message: "Impact item deleted", id: itemId });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Analytics
// ═══════════════════════════════════════════════════════════════

const getAnalytics = async (req, res, next) => {
  try {
    // Distribution by type
    const typeDistribution = await ChangeRequest.findAll({
      attributes: [
        "type",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["type"],
      raw: true,
    });

    // Distribution by status
    const statusDistribution = await ChangeRequest.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    // Distribution by category
    const categoryDistribution = await ChangeRequest.findAll({
      attributes: [
        "category",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["category"],
      raw: true,
    });

    // Monthly trend (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyTrend = await sequelize.query(
      `SELECT
         TO_CHAR("createdAt", 'YYYY-MM') AS month,
         COUNT(*) AS count
       FROM change_requests
       WHERE "createdAt" >= :startDate
       GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
       ORDER BY month ASC`,
      {
        replacements: { startDate: twelveMonthsAgo },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Average implementation time (completed CRs)
    const completedCRs = await ChangeRequest.findAll({
      where: {
        status: "COMPLETED",
        completedDate: { [Op.ne]: null },
      },
      attributes: ["createdAt", "completedDate"],
      raw: true,
    });

    let avgImplementationDays = 0;
    if (completedCRs.length > 0) {
      const totalDays = completedCRs.reduce((sum, cr) => {
        const diff = (new Date(cr.completedDate) - new Date(cr.createdAt)) / (1000 * 60 * 60 * 24);
        return sum + diff;
      }, 0);
      avgImplementationDays = Math.round(totalDays / completedCRs.length);
    }

    // Regulatory impact stats
    const regulatoryImpactStats = await ChangeRequest.findAll({
      attributes: [
        "regulatoryDossierImpact",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: {
        regulatoryDossierImpact: { [Op.ne]: null },
      },
      group: ["regulatoryDossierImpact"],
      raw: true,
    });

    const totalWithRegImpact = await ChangeRequest.count({
      where: { regulatoryImpact: true },
    });

    res.json({
      typeDistribution,
      statusDistribution,
      categoryDistribution,
      monthlyTrend,
      avgImplementationDays,
      completedCount: completedCRs.length,
      regulatoryImpactStats,
      totalWithRegulatoryImpact: totalWithRegImpact,
    });
  } catch (e) {
    console.error("ChangeRequest getAnalytics error:", e);
    next(ApiError.internal(e.message));
  }
};

module.exports = {
  getAll, getOne, create, update, getStats,
  getImpactItems, addImpactItem, updateImpactItem, deleteImpactItem,
  getAnalytics,
};
