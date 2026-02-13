const { ManagementReview, ReviewAction } = require("../models/ManagementReview");
const { User } = require("../../../models/index");
const { Nonconformity, Capa } = require("../../qms-nc/models/NcCapa");
const { logAudit } = require("../../core/utils/auditLogger");
const { Op } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// ManagementReview CRUD
// ═══════════════════════════════════════════════════════════════

const getAll = async (req, res) => {
  try {
    const { year, status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (year) {
      where.reviewDate = {
        [Op.gte]: new Date(`${year}-01-01`),
        [Op.lte]: new Date(`${year}-12-31`),
      };
    }
    if (status) where.status = status;

    const offset = (page - 1) * limit;
    const { count, rows } = await ManagementReview.findAndCountAll({
      where,
      include: [{ model: ReviewAction, as: "actions" }],
      order: [["reviewDate", "DESC"]],
      limit: parseInt(limit),
      offset,
    });
    res.json({ count, rows, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (e) {
    console.error("ManagementReview getAll error:", e);
    res.status(500).json({ error: e.message });
  }
};

const getOne = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const review = await ManagementReview.findByPk(id, {
      include: [{ model: ReviewAction, as: "actions" }],
    });
    if (!review) return res.status(404).json({ error: "Review not found" });
    res.json(review);
  } catch (e) {
    console.error("ManagementReview getOne error:", e);
    res.status(500).json({ error: e.message });
  }
};

const create = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const count = await ManagementReview.count();
    const reviewNumber = `MR-${year}-${String(count + 1).padStart(2, "0")}`;

    const review = await ManagementReview.create({
      ...req.body,
      reviewNumber,
      chairpersonId: req.body.chairpersonId || req.user?.id || 1,
    });
    await logAudit(req, "management_review.create", "management_review", review.id, { reviewNumber });
    res.status(201).json(review);
  } catch (e) {
    console.error("ManagementReview create error:", e);
    res.status(500).json({ error: e.message });
  }
};

const update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const review = await ManagementReview.findByPk(id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    await review.update(req.body);
    await logAudit(req, "management_review.update", "management_review", review.id, req.body);
    res.json(review);
  } catch (e) {
    console.error("ManagementReview update error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// ReviewAction sub-CRUD
// ═══════════════════════════════════════════════════════════════

const addAction = async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    if (isNaN(reviewId)) return res.status(400).json({ error: "Invalid ID" });

    const review = await ManagementReview.findByPk(reviewId);
    if (!review) return res.status(404).json({ error: "Review not found" });

    const action = await ReviewAction.create({
      ...req.body,
      managementReviewId: reviewId,
    });
    await logAudit(req, "management_review.action.create", "management_review", reviewId, {
      actionId: action.id,
      description: action.description,
    });
    res.status(201).json(action);
  } catch (e) {
    console.error("ReviewAction addAction error:", e);
    res.status(500).json({ error: e.message });
  }
};

const updateAction = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const action = await ReviewAction.findByPk(id);
    if (!action) return res.status(404).json({ error: "Action not found" });

    // Auto-set completedAt when status changes to COMPLETED
    if (req.body.status === "COMPLETED" && !action.completedAt) {
      req.body.completedAt = new Date();
    }

    await action.update(req.body);
    await logAudit(req, "management_review.action.update", "management_review", action.managementReviewId, {
      actionId: action.id,
    });
    res.json(action);
  } catch (e) {
    console.error("ReviewAction updateAction error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Statistics
// ═══════════════════════════════════════════════════════════════

const getStats = async (req, res) => {
  try {
    const totalReviews = await ManagementReview.count();
    const completed = await ManagementReview.count({ where: { status: "COMPLETED" } });
    const approved = await ManagementReview.count({ where: { status: "APPROVED" } });
    const planned = await ManagementReview.count({ where: { status: "PLANNED" } });
    const totalActions = await ReviewAction.count();
    const openActions = await ReviewAction.count({ where: { status: "OPEN" } });
    const overdueActions = await ReviewAction.count({ where: { status: "OVERDUE" } });

    res.json({ totalReviews, completed, approved, planned, totalActions, openActions, overdueActions });
  } catch (e) {
    console.error("ManagementReview getStats error:", e);
    res.status(500).json({ error: e.message });
  }
};

/**
 * Dashboard payload for widgets.
 *
 * Shape:
 * {
 *   summary: {
 *     nonconformityTrend: { total, averagePerMonth },
 *     processKpi: {
 *       NC_CLOSURE_RATE: { formula, value, numerator, denominator, unit },
 *       CAPA_EFFECTIVENESS_RATE: { formula, value, numerator, denominator, unit },
 *       REVIEW_ACTION_COMPLETION_RATE: { formula, value, numerator, denominator, unit }
 *     },
 *     qualityGoalsStatus: { ACHIEVED, AT_RISK, OVERDUE, total }
 *   },
 *   series: {
 *     nonconformityTrend: [{ month, count }],
 *     processKpi: [{ code, formula, value, numerator, denominator, unit }],
 *     qualityGoalsStatus: [{ status, count }]
 *   }
 * }
 */
const getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const nonconformities = await Nonconformity.findAll({
      attributes: ["detectedAt", "status"],
      where: {
        detectedAt: { [Op.gte]: startMonth },
      },
      raw: true,
    });

    const nonconformityTrend = [];
    const monthIndexToLabel = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      nonconformityTrend.push({ month: monthIndexToLabel(d), count: 0 });
    }

    const trendMap = new Map(nonconformityTrend.map((x) => [x.month, x]));
    for (const nc of nonconformities) {
      const d = new Date(nc.detectedAt);
      if (!(d instanceof Date) || isNaN(d)) continue;
      const key = monthIndexToLabel(d);
      if (trendMap.has(key)) trendMap.get(key).count += 1;
    }

    const [totalNc, closedNc, capaVerified, capaEffective, totalReviewActions, completedReviewActions, latestReview] = await Promise.all([
      Nonconformity.count(),
      Nonconformity.count({ where: { status: "CLOSED" } }),
      Capa.count({ where: { status: { [Op.in]: ["EFFECTIVE", "INEFFECTIVE"] } } }),
      Capa.count({ where: { status: "EFFECTIVE" } }),
      ReviewAction.count(),
      ReviewAction.count({ where: { status: "COMPLETED" } }),
      ManagementReview.findOne({
        where: { outputData: { [Op.ne]: null } },
        attributes: ["outputData", "reviewDate", "createdAt"],
        order: [["reviewDate", "DESC"], ["createdAt", "DESC"]],
      }),
    ]);

    const rate = (numerator, denominator) => (denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(2)) : 0);

    const processKpi = {
      NC_CLOSURE_RATE: {
        formula: "(closed NC / total NC) * 100",
        numerator: closedNc,
        denominator: totalNc,
        value: rate(closedNc, totalNc),
        unit: "%",
      },
      CAPA_EFFECTIVENESS_RATE: {
        formula: "(effective CAPA / verified CAPA) * 100",
        numerator: capaEffective,
        denominator: capaVerified,
        value: rate(capaEffective, capaVerified),
        unit: "%",
      },
      REVIEW_ACTION_COMPLETION_RATE: {
        formula: "(completed review actions / total review actions) * 100",
        numerator: completedReviewActions,
        denominator: totalReviewActions,
        value: rate(completedReviewActions, totalReviewActions),
        unit: "%",
      },
    };

    const qualityGoalsStatus = { ACHIEVED: 0, AT_RISK: 0, OVERDUE: 0, total: 0 };
    const objectives = Array.isArray(latestReview?.outputData?.qualityObjectives)
      ? latestReview.outputData.qualityObjectives
      : [];

    for (const objective of objectives) {
      const status = String(objective?.status || "").toUpperCase();
      if (status === "ACHIEVED") qualityGoalsStatus.ACHIEVED += 1;
      else if (status === "AT_RISK") qualityGoalsStatus.AT_RISK += 1;
      else if (status === "OVERDUE") qualityGoalsStatus.OVERDUE += 1;
    }
    qualityGoalsStatus.total = qualityGoalsStatus.ACHIEVED + qualityGoalsStatus.AT_RISK + qualityGoalsStatus.OVERDUE;

    const totalTrendNc = nonconformityTrend.reduce((acc, x) => acc + x.count, 0);

    res.json({
      summary: {
        nonconformityTrend: {
          total: totalTrendNc,
          averagePerMonth: Number((totalTrendNc / 12).toFixed(2)),
        },
        processKpi,
        qualityGoalsStatus,
      },
      series: {
        nonconformityTrend,
        processKpi: Object.entries(processKpi).map(([code, value]) => ({ code, ...value })),
        qualityGoalsStatus: [
          { status: "ACHIEVED", count: qualityGoalsStatus.ACHIEVED },
          { status: "AT_RISK", count: qualityGoalsStatus.AT_RISK },
          { status: "OVERDUE", count: qualityGoalsStatus.OVERDUE },
        ],
      },
    });
  } catch (e) {
    console.error("ManagementReview getDashboard error:", e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getAll, getOne, create, update,
  addAction, updateAction, getStats, getDashboard,
};
