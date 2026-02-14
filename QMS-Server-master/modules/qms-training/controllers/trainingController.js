const { TrainingPlan, TrainingRecord, CompetencyMatrix, TrainingPlanItem } = require("../models/Training");
const { User } = require("../../../models/index");
const { logAudit } = require("../../core/utils/auditLogger");

// ═══════════════════════════════════════════════════════════════
// TrainingPlan CRUD
// ═══════════════════════════════════════════════════════════════

const getPlans = async (req, res) => {
  try {
    const { year, status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (year) where.year = year;
    if (status) where.status = status;

    const offset = (page - 1) * limit;
    const { count, rows } = await TrainingPlan.findAndCountAll({
      where,
      include: [{ model: TrainingRecord, as: "records" }],
      order: [["year", "DESC"]],
      limit: parseInt(limit),
      offset,
    });
    res.json({ count, rows, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (e) {
    console.error("TrainingPlan getPlans error:", e);
    res.status(500).json({ error: e.message });
  }
};

const getPlanOne = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const plan = await TrainingPlan.findByPk(id, {
      include: [{
        model: TrainingRecord, as: "records",
        include: [{ model: User, as: "trainee", attributes: ["id", "name", "surname"] }],
      }],
    });
    if (!plan) return res.status(404).json({ error: "Training plan not found" });
    res.json(plan);
  } catch (e) {
    console.error("TrainingPlan getPlanOne error:", e);
    res.status(500).json({ error: e.message });
  }
};

const createPlan = async (req, res) => {
  try {
    const plan = await TrainingPlan.create(req.body);
    await logAudit(req, "training.plan.create", "training_record", plan.id, { title: plan.title });
    res.status(201).json(plan);
  } catch (e) {
    console.error("TrainingPlan createPlan error:", e);
    res.status(500).json({ error: e.message });
  }
};

const updatePlan = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const plan = await TrainingPlan.findByPk(id);
    if (!plan) return res.status(404).json({ error: "Training plan not found" });

    await plan.update(req.body);
    await logAudit(req, "training.plan.update", "training_record", plan.id, req.body);
    res.json(plan);
  } catch (e) {
    console.error("TrainingPlan updatePlan error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// TrainingRecord CRUD
// ═══════════════════════════════════════════════════════════════

const getRecords = async (req, res) => {
  try {
    const { userId, type, status, trainingPlanId, page = 1, limit = 50 } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (trainingPlanId) where.trainingPlanId = trainingPlanId;

    const offset = (page - 1) * limit;
    const { count, rows } = await TrainingRecord.findAndCountAll({
      where,
      include: [
        { model: User, as: "trainee", attributes: ["id", "name", "surname"] },
        { model: TrainingPlan, as: "trainingPlan", attributes: ["id", "title", "year"] },
      ],
      order: [["trainingDate", "DESC"]],
      limit: parseInt(limit),
      offset,
    });
    res.json({ count, rows, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (e) {
    console.error("TrainingRecord getRecords error:", e);
    res.status(500).json({ error: e.message });
  }
};

const createRecord = async (req, res) => {
  try {
    const record = await TrainingRecord.create({
      ...req.body,
      status: req.body.status || "PLANNED",
    });
    await logAudit(req, "training.record.create", "training_record", record.id, { title: record.title });
    res.status(201).json(record);
  } catch (e) {
    console.error("TrainingRecord createRecord error:", e);
    res.status(500).json({ error: e.message });
  }
};

const updateRecord = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const record = await TrainingRecord.findByPk(id);
    if (!record) return res.status(404).json({ error: "Training record not found" });

    await record.update(req.body);
    await logAudit(req, "training.record.update", "training_record", record.id, req.body);
    res.json(record);
  } catch (e) {
    console.error("TrainingRecord updateRecord error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// CompetencyMatrix CRUD
// ═══════════════════════════════════════════════════════════════

const getCompetency = async (req, res) => {
  try {
    const { userId, page = 1, limit = 50 } = req.query;
    const where = {};
    if (userId) where.userId = userId;

    const offset = (page - 1) * limit;
    const { count, rows } = await CompetencyMatrix.findAndCountAll({
      where,
      include: [{ model: User, as: "user", attributes: ["id", "name", "surname"] }],
      order: [["processName", "ASC"]],
      limit: parseInt(limit),
      offset,
    });
    res.json({ count, rows, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (e) {
    console.error("CompetencyMatrix getCompetency error:", e);
    res.status(500).json({ error: e.message });
  }
};

const createCompetency = async (req, res) => {
  try {
    const entry = await CompetencyMatrix.create(req.body);
    await logAudit(req, "training.competency.create", "training_record", entry.id, {
      userId: entry.userId,
      processName: entry.processName,
    });
    res.status(201).json(entry);
  } catch (e) {
    console.error("CompetencyMatrix createCompetency error:", e);
    res.status(500).json({ error: e.message });
  }
};

const updateCompetency = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const entry = await CompetencyMatrix.findByPk(id);
    if (!entry) return res.status(404).json({ error: "Competency entry not found" });

    await entry.update(req.body);
    await logAudit(req, "training.competency.update", "training_record", entry.id, req.body);
    res.json(entry);
  } catch (e) {
    console.error("CompetencyMatrix updateCompetency error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Statistics
// ═══════════════════════════════════════════════════════════════

const getStats = async (req, res) => {
  try {
    const totalPlans = await TrainingPlan.count();
    const totalRecords = await TrainingRecord.count();
    const completed = await TrainingRecord.count({ where: { status: "COMPLETED" } });
    const planned = await TrainingRecord.count({ where: { status: "PLANNED" } });
    const failed = await TrainingRecord.count({ where: { status: "FAILED" } });
    const expired = await TrainingRecord.count({ where: { status: "EXPIRED" } });
    const competencyEntries = await CompetencyMatrix.count();

    res.json({ totalPlans, totalRecords, completed, planned, failed, expired, competencyEntries });
  } catch (e) {
    console.error("Training getStats error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// TrainingPlanItem CRUD
// ═══════════════════════════════════════════════════════════════

const getPlanItems = async (req, res) => {
  try {
    const { trainingPlanId, status, type, page = 1, limit = 50 } = req.query;
    const where = {};
    if (trainingPlanId) where.trainingPlanId = trainingPlanId;
    if (status) where.status = status;
    if (type) where.type = type;

    const offset = (page - 1) * limit;
    const { count, rows } = await TrainingPlanItem.findAndCountAll({
      where,
      include: [
        { model: TrainingPlan, as: "trainingPlan", attributes: ["id", "title", "year"] },
      ],
      order: [["scheduledMonth", "ASC"]],
      limit: parseInt(limit),
      offset,
    });
    res.json({ count, rows, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (e) {
    console.error("TrainingPlanItem getPlanItems error:", e);
    res.status(500).json({ error: e.message });
  }
};

const createPlanItem = async (req, res) => {
  try {
    const item = await TrainingPlanItem.create(req.body);
    await logAudit({
      req,
      action: "TRAINING_PLAN_ITEM_CREATE",
      entity: "TrainingPlanItem",
      entityId: item.id,
      description: `Created training plan item: ${item.title}`,
    });
    res.status(201).json(item);
  } catch (e) {
    console.error("TrainingPlanItem createPlanItem error:", e);
    res.status(500).json({ error: e.message });
  }
};

const updatePlanItem = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const item = await TrainingPlanItem.findByPk(id);
    if (!item) return res.status(404).json({ error: "Training plan item not found" });

    await item.update(req.body);
    await logAudit({
      req,
      action: "TRAINING_PLAN_ITEM_UPDATE",
      entity: "TrainingPlanItem",
      entityId: item.id,
      description: `Updated training plan item: ${item.title}`,
    });
    res.json(item);
  } catch (e) {
    console.error("TrainingPlanItem updatePlanItem error:", e);
    res.status(500).json({ error: e.message });
  }
};

const deletePlanItem = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const item = await TrainingPlanItem.findByPk(id);
    if (!item) return res.status(404).json({ error: "Training plan item not found" });

    const title = item.title;
    await item.destroy();
    await logAudit({
      req,
      action: "TRAINING_PLAN_ITEM_DELETE",
      entity: "TrainingPlanItem",
      entityId: id,
      description: `Deleted training plan item: ${title}`,
    });
    res.json({ message: "Training plan item deleted", id });
  } catch (e) {
    console.error("TrainingPlanItem deletePlanItem error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Gap Analysis
// ═══════════════════════════════════════════════════════════════

const LEVEL_VALUES = { NONE: 0, AWARENESS: 1, TRAINED: 2, COMPETENT: 3, EXPERT: 4 };

const getGapAnalysis = async (req, res) => {
  try {
    const { userId, processName } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (processName) where.processName = processName;

    const entries = await CompetencyMatrix.findAll({
      where,
      include: [{ model: User, as: "user", attributes: ["id", "name", "surname"] }],
      order: [["processName", "ASC"]],
    });

    const gaps = [];
    let totalEntries = 0;
    let compliantCount = 0;
    let criticalGaps = 0;

    for (const entry of entries) {
      totalEntries++;
      const currentVal = LEVEL_VALUES[entry.level] || 0;
      const requiredVal = LEVEL_VALUES[entry.requiredLevel] || 0;
      const gapSize = requiredVal - currentVal;

      if (gapSize > 0) {
        gaps.push({
          userId: entry.userId,
          userName: entry.user ? `${entry.user.name} ${entry.user.surname}` : `User #${entry.userId}`,
          processName: entry.processName,
          currentLevel: entry.level,
          requiredLevel: entry.requiredLevel,
          gapSize,
        });
        if (gapSize >= 3) criticalGaps++;
      } else {
        compliantCount++;
      }
    }

    const compliancePercent = totalEntries > 0
      ? Math.round((compliantCount / totalEntries) * 10000) / 100
      : 100;

    res.json({
      gaps,
      totalGaps: gaps.length,
      compliancePercent,
      criticalGaps,
    });
  } catch (e) {
    console.error("Training getGapAnalysis error:", e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getPlans, getPlanOne, createPlan, updatePlan,
  getRecords, createRecord, updateRecord,
  getCompetency, createCompetency, updateCompetency,
  getStats,
  getPlanItems, createPlanItem, updatePlanItem, deletePlanItem,
  getGapAnalysis,
};
