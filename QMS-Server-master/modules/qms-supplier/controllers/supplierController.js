const { Supplier, SupplierEvaluation, SupplierAudit } = require("../models/Supplier");
const { User } = require("../../../models/index");
const SupplierScoringService = require("../services/SupplierScoringService");
const { logAudit } = require("../../core/utils/auditLogger");

// ═══════════════════════════════════════════════════════════════
// CRUD — Поставщики
// ═══════════════════════════════════════════════════════════════

const getAll = async (req, res, next) => {
  try {
    const { category, criticality, qualificationStatus, page = 1, limit = 50 } = req.query;
    const where = {};
    if (category) where.category = category;
    if (criticality) where.criticality = criticality;
    if (qualificationStatus) where.qualificationStatus = qualificationStatus;

    const offset = (page - 1) * limit;
    const { count, rows } = await Supplier.findAndCountAll({
      where,
      include: [
        { model: SupplierEvaluation, as: "evaluations", limit: 1, order: [["evaluationDate", "DESC"]] },
      ],
      order: [["name", "ASC"]],
      limit: parseInt(limit),
      offset,
    });
    res.json({ count, rows, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (e) {
    console.error("Supplier getAll error:", e);
    res.status(500).json({ error: e.message });
  }
};

const getOne = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const supplier = await Supplier.findByPk(id, {
      include: [
        { model: SupplierEvaluation, as: "evaluations", order: [["evaluationDate", "DESC"]] },
        { model: SupplierAudit, as: "audits", order: [["auditDate", "DESC"]] },
      ],
    });
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    res.json(supplier);
  } catch (e) {
    console.error("Supplier getOne error:", e);
    res.status(500).json({ error: e.message });
  }
};

const create = async (req, res, next) => {
  try {
    const count = await Supplier.count();
    const code = `SUP-${String(count + 1).padStart(3, "0")}`;

    const supplier = await Supplier.create({ ...req.body, code });
    await logAudit(req, "supplier.create", "supplier", supplier.id, { code, name: supplier.name });
    res.status(201).json(supplier);
  } catch (e) {
    console.error("Supplier create error:", e);
    res.status(500).json({ error: e.message });
  }
};

const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const supplier = await Supplier.findByPk(id);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });

    await supplier.update(req.body);
    await logAudit(req, "supplier.update", "supplier", supplier.id, req.body);
    res.json(supplier);
  } catch (e) {
    console.error("Supplier update error:", e);
    res.status(500).json({ error: e.message });
  }
};

const remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const supplier = await Supplier.findByPk(id);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });

    await supplier.update({ qualificationStatus: "DISQUALIFIED" });
    await logAudit(req, "supplier.delete", "supplier", supplier.id, { name: supplier.name });
    res.json({ message: "Supplier disqualified", id });
  } catch (e) {
    console.error("Supplier delete error:", e);
    res.status(500).json({ error: e.message });
  }
};

const getStats = async (req, res, next) => {
  try {
    const total = await Supplier.count();
    const qualified = await Supplier.count({ where: { qualificationStatus: "QUALIFIED" } });
    const pending = await Supplier.count({ where: { qualificationStatus: "PENDING" } });
    const suspended = await Supplier.count({ where: { qualificationStatus: "SUSPENDED" } });
    const disqualified = await Supplier.count({ where: { qualificationStatus: "DISQUALIFIED" } });
    const critical = await Supplier.count({ where: { criticality: "CRITICAL" } });

    res.json({ total, qualified, pending, suspended, disqualified, critical });
  } catch (e) {
    console.error("Supplier getStats error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Evaluation sub-CRUD
// ═══════════════════════════════════════════════════════════════

const addEvaluation = async (req, res, next) => {
  try {
    const supplierId = parseInt(req.params.id);
    if (isNaN(supplierId)) return res.status(400).json({ error: "Invalid ID" });

    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });

    const evaluation = await SupplierEvaluation.create({
      ...req.body,
      supplierId,
      evaluatorId: req.user?.id || 1,
    });

    // Recalculate total score
    const scores = [
      evaluation.qualityScore, evaluation.deliveryScore,
      evaluation.documentationScore, evaluation.communicationScore,
      evaluation.priceScore, evaluation.complianceScore,
    ].filter(s => s != null);

    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      evaluation.totalScore = Math.round(avg * 10) / 10;
      await evaluation.save();

      supplier.overallScore = Math.round(evaluation.totalScore * 10);
      await supplier.save();
    }

    await logAudit(req, "supplier.evaluate", "supplier_evaluation", evaluation.id, { supplierId });
    res.status(201).json(evaluation);
  } catch (e) {
    console.error("Supplier addEvaluation error:", e);
    res.status(500).json({ error: e.message });
  }
};

const getEvaluations = async (req, res, next) => {
  try {
    const supplierId = parseInt(req.params.id);
    if (isNaN(supplierId)) return res.status(400).json({ error: "Invalid ID" });

    const evaluations = await SupplierEvaluation.findAll({
      where: { supplierId },
      order: [["evaluationDate", "DESC"]],
    });
    res.json(evaluations);
  } catch (e) {
    console.error("Supplier getEvaluations error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Audit sub-CRUD
// ═══════════════════════════════════════════════════════════════

const addAudit = async (req, res, next) => {
  try {
    const supplierId = parseInt(req.params.id);
    if (isNaN(supplierId)) return res.status(400).json({ error: "Invalid ID" });

    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });

    const audit = await SupplierAudit.create({
      ...req.body,
      supplierId,
      auditorId: req.user?.id || 1,
    });

    await logAudit(req, "supplier.audit", "supplier", supplierId, { auditId: audit.id });
    res.status(201).json(audit);
  } catch (e) {
    console.error("Supplier addAudit error:", e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getAll, getOne, create, update, remove, getStats,
  addEvaluation, getEvaluations, addAudit,
};
