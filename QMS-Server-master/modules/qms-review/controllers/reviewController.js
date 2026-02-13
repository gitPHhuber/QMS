const { ManagementReview, ReviewAction } = require("../models/ManagementReview");
const { User } = require("../../../models/index");
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

const getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const riskWindowDays = 30;
    const riskWindowDate = new Date(now);
    riskWindowDate.setDate(riskWindowDate.getDate() + riskWindowDays);

    // Methodology (fallback without a dedicated quality-objectives model):
    // 1) Objective-like entities from outputData.qualityObjectives (if present in management reviews).
    // 2) Review actions are treated as objective execution artifacts.
    // 3) Status rules:
    //    - achieved: objective.status === ACHIEVED or progress >= 100 OR action.status === COMPLETED.
    //    - overdue: objective.targetDate/deadline < now and not achieved OR action.status === OVERDUE.
    //    - atRisk: not achieved/overdue and objective/action deadline within next 30 days OR objective.status === AT_RISK.
    const [reviews, actions] = await Promise.all([
      ManagementReview.findAll({
        attributes: ["id", "outputData"],
        where: {
          status: { [Op.in]: ["PLANNED", "IN_PROGRESS", "COMPLETED", "APPROVED"] },
        },
      }),
      ReviewAction.findAll({
        attributes: ["id", "status", "deadline", "completedAt"],
      }),
    ]);

    let achieved = 0;
    let atRisk = 0;
    let overdue = 0;

    for (const review of reviews) {
      const objectives = Array.isArray(review?.outputData?.qualityObjectives)
        ? review.outputData.qualityObjectives
        : [];

      for (const objective of objectives) {
        const status = String(objective?.status || "").toUpperCase();
        const progress = Number(objective?.progress || objective?.progressPct || 0);
        const deadlineRaw = objective?.targetDate || objective?.deadline;
        const deadline = deadlineRaw ? new Date(deadlineRaw) : null;

        const isAchieved = status === "ACHIEVED" || progress >= 100;
        const isOverdue = !isAchieved && deadline instanceof Date && !isNaN(deadline) && deadline < now;
        const isAtRiskByDate = !isAchieved && !isOverdue && deadline instanceof Date && !isNaN(deadline) && deadline <= riskWindowDate;
        const isAtRisk = status === "AT_RISK" || isAtRiskByDate;

        if (isOverdue) overdue += 1;
        else if (isAchieved) achieved += 1;
        else if (isAtRisk) atRisk += 1;
      }
    }

    for (const action of actions) {
      const status = String(action.status || "").toUpperCase();
      const deadline = action.deadline ? new Date(action.deadline) : null;
      const isCompleted = status === "COMPLETED" || Boolean(action.completedAt);
      const isOverdue = status === "OVERDUE" || (!isCompleted && deadline instanceof Date && !isNaN(deadline) && deadline < now);
      const isAtRisk = !isCompleted && !isOverdue && deadline instanceof Date && !isNaN(deadline) && deadline <= riskWindowDate;

      if (isOverdue) overdue += 1;
      else if (isCompleted) achieved += 1;
      else if (isAtRisk) atRisk += 1;
    }

    const total = achieved + atRisk + overdue;

    res.json({
      qualityObjectivesStatus: {
        achieved,
        atRisk,
        overdue,
        total,
        methodology: {
          source: "derived_from_management_reviews_and_review_actions",
          riskWindowDays,
        },
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
