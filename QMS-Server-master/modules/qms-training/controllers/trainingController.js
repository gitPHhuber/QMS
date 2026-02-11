const { TrainingPlan, TrainingRecord, CompetencyMatrix } = require("../models/Training");
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

module.exports = {
  getPlans, getPlanOne, createPlan, updatePlan,
  getRecords, createRecord, updateRecord,
  getCompetency, createCompetency, updateCompetency,
  getStats,
};
