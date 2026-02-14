const { CustomerRequirement } = require("../models/CustomerRequirement");
const sequelize = require("../../../db");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");

// ═══════════════════════════════════════════════════════════════
// Customer Requirements CRUD
// ═══════════════════════════════════════════════════════════════

const getAll = async (req, res, next) => {
  try {
    const { productId, status, source, priority, page = 1, limit = 50 } = req.query;
    const where = {};

    if (productId) where.productId = productId;
    if (status) where.status = status;
    if (source) where.source = source;
    if (priority) where.priority = priority;

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await CustomerRequirement.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("CustomerRequirement getAll error:", e);
    next(ApiError.internal(e.message));
  }
};

const getOne = async (req, res, next) => {
  try {
    const cr = await CustomerRequirement.findByPk(req.params.id);
    if (!cr) return next(ApiError.notFound("Customer requirement not found"));
    res.json(cr);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const year = new Date().getFullYear();
    const [maxResult] = await sequelize.query(
      `SELECT MAX(CAST(SUBSTRING("requirementNumber" FROM '(\\d+)$') AS INTEGER)) AS max_num FROM customer_requirements WHERE "requirementNumber" LIKE 'CRQ-${year}-%'`
    );
    const maxNum = maxResult?.[0]?.max_num || 0;
    const requirementNumber = `CRQ-${year}-${String(maxNum + 1).padStart(3, "0")}`;

    const cr = await CustomerRequirement.create({
      ...req.body,
      requirementNumber,
    });

    await logAudit({
      req,
      action: "CUSTOMER_REQUIREMENT_CREATE",
      entity: "CustomerRequirement",
      entityId: cr.id,
      description: `Created customer requirement: ${requirementNumber}`,
    });

    res.status(201).json(cr);
  } catch (e) {
    console.error("CustomerRequirement create error:", e);
    next(ApiError.internal(e.message));
  }
};

const update = async (req, res, next) => {
  try {
    const cr = await CustomerRequirement.findByPk(req.params.id);
    if (!cr) return next(ApiError.notFound("Customer requirement not found"));

    await cr.update(req.body);

    await logAudit({
      req,
      action: "CUSTOMER_REQUIREMENT_UPDATE",
      entity: "CustomerRequirement",
      entityId: cr.id,
      description: `Updated customer requirement: ${cr.requirementNumber}`,
    });

    res.json(cr);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Statistics
// ═══════════════════════════════════════════════════════════════

const getStats = async (req, res, next) => {
  try {
    const total = await CustomerRequirement.count();

    const byStatus = await CustomerRequirement.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    const bySource = await CustomerRequirement.findAll({
      attributes: [
        "source",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["source"],
      raw: true,
    });

    const byPriority = await CustomerRequirement.findAll({
      attributes: [
        "priority",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["priority"],
      raw: true,
    });

    res.json({ total, byStatus, bySource, byPriority });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

module.exports = { getAll, getOne, create, update, getStats };
