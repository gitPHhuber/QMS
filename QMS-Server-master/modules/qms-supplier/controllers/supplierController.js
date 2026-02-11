const { Supplier, SupplierEvaluation, SupplierAudit } = require("../models/Supplier");
const { User } = require("../../../models/index");
const SupplierScoringService = require("../services/SupplierScoringService");
const { logAudit } = require("../../core/utils/auditLogger");
const sequelize = require("../../../db");
const ApiError = require("../../../error/ApiError");

// Допустимые поля для создания/обновления поставщика
const SUPPLIER_CREATABLE_FIELDS = [
  "name", "category", "criticality", "contactPerson", "email", "phone",
  "address", "inn", "description", "qualificationStatus", "certifications",
];
const SUPPLIER_UPDATABLE_FIELDS = [
  "name", "category", "criticality", "contactPerson", "email", "phone",
  "address", "description", "qualificationStatus", "certifications",
];

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

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;
    const { count, rows } = await Supplier.findAndCountAll({
      where,
      include: [
        { model: SupplierEvaluation, as: "evaluations", limit: 1, order: [["evaluationDate", "DESC"]] },
      ],
      order: [["name", "ASC"]],
      limit: limitNum,
      offset,
    });
    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("Supplier getAll error:", e);
    next(ApiError.internal(e.message));
  }
};

const getOne = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(ApiError.badRequest("Invalid ID"));

    const supplier = await Supplier.findByPk(id, {
      include: [
        { model: SupplierEvaluation, as: "evaluations", order: [["evaluationDate", "DESC"]] },
        { model: SupplierAudit, as: "audits", order: [["auditDate", "DESC"]] },
      ],
    });
    if (!supplier) return next(ApiError.notFound("Поставщик не найден"));
    res.json(supplier);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const create = async (req, res, next) => {
  try {
    // Генерация кода через MAX для предотвращения коллизий
    const [maxResult] = await sequelize.query(
      `SELECT MAX(CAST(SUBSTRING(code FROM '(\\d+)$') AS INTEGER)) AS max_num FROM suppliers`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const code = `SUP-${String((maxResult?.max_num || 0) + 1).padStart(3, "0")}`;

    // Whitelist полей
    const safeData = {};
    for (const field of SUPPLIER_CREATABLE_FIELDS) {
      if (req.body[field] !== undefined) safeData[field] = req.body[field];
    }

    const supplier = await Supplier.create({ ...safeData, code });
    await logAudit(req, "supplier.create", "supplier", supplier.id, { code, name: supplier.name });
    res.status(201).json(supplier);
  } catch (e) {
    console.error("Supplier create error:", e);
    next(ApiError.internal(e.message));
  }
};

const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(ApiError.badRequest("Invalid ID"));

    const supplier = await Supplier.findByPk(id);
    if (!supplier) return next(ApiError.notFound("Поставщик не найден"));

    // Whitelist полей — защита от mass assignment
    const safeData = {};
    for (const field of SUPPLIER_UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) safeData[field] = req.body[field];
    }

    await supplier.update(safeData);
    await logAudit(req, "supplier.update", "supplier", supplier.id, safeData);
    res.json(supplier);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(ApiError.badRequest("Invalid ID"));

    const supplier = await Supplier.findByPk(id);
    if (!supplier) return next(ApiError.notFound("Поставщик не найден"));

    await supplier.update({ qualificationStatus: "DISQUALIFIED" });
    await logAudit(req, "supplier.delete", "supplier", supplier.id, { name: supplier.name });
    res.json({ message: "Supplier disqualified", id });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const getStats = async (req, res, next) => {
  try {
    // Оптимизация: GROUP BY вместо N+1 COUNT
    const [total, byStatusRaw, critical] = await Promise.all([
      Supplier.count(),
      Supplier.findAll({
        attributes: ["qualificationStatus", [sequelize.fn("COUNT", "*"), "count"]],
        group: ["qualificationStatus"],
        raw: true,
      }),
      Supplier.count({ where: { criticality: "CRITICAL" } }),
    ]);

    const statusMap = {};
    byStatusRaw.forEach(r => { statusMap[r.qualificationStatus] = parseInt(r.count); });

    res.json({
      total,
      qualified: statusMap.QUALIFIED || 0,
      pending: statusMap.PENDING || 0,
      suspended: statusMap.SUSPENDED || 0,
      disqualified: statusMap.DISQUALIFIED || 0,
      critical,
    });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Evaluation sub-CRUD
// ═══════════════════════════════════════════════════════════════

const addEvaluation = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Требуется авторизация"));

    const supplierId = parseInt(req.params.id);
    if (isNaN(supplierId)) return next(ApiError.badRequest("Invalid ID"));

    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) return next(ApiError.notFound("Поставщик не найден"));

    const evaluation = await SupplierEvaluation.create({
      ...req.body,
      supplierId,
      evaluatorId: req.user.id,
    });

    // Используем SupplierScoringService для ВЗВЕШЕННОГО расчёта (ISO 13485 §7.4.1)
    const scoreData = {
      qualityScore: evaluation.qualityScore,
      deliveryScore: evaluation.deliveryScore,
      documentationScore: evaluation.documentationScore,
      communicationScore: evaluation.communicationScore,
      priceScore: evaluation.priceScore,
      complianceScore: evaluation.complianceScore,
    };

    const totalScore = SupplierScoringService.calculateScore(scoreData);
    const decision = SupplierScoringService.determineDecision(totalScore);
    const nextEvaluationDate = SupplierScoringService.getNextEvaluationDate(supplier.criticality);

    evaluation.totalScore = totalScore;
    evaluation.decision = decision;
    await evaluation.save();

    // Обновляем поставщика
    supplier.overallScore = totalScore;
    supplier.nextEvaluationDate = nextEvaluationDate;
    await supplier.save();

    await logAudit(req, "supplier.evaluate", "supplier_evaluation", evaluation.id, { supplierId, totalScore, decision });
    res.status(201).json(evaluation);
  } catch (e) {
    console.error("Supplier addEvaluation error:", e);
    next(ApiError.internal(e.message));
  }
};

const getEvaluations = async (req, res, next) => {
  try {
    const supplierId = parseInt(req.params.id);
    if (isNaN(supplierId)) return next(ApiError.badRequest("Invalid ID"));

    const evaluations = await SupplierEvaluation.findAll({
      where: { supplierId },
      order: [["evaluationDate", "DESC"]],
    });
    res.json(evaluations);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Audit sub-CRUD
// ═══════════════════════════════════════════════════════════════

const addAudit = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Требуется авторизация"));

    const supplierId = parseInt(req.params.id);
    if (isNaN(supplierId)) return next(ApiError.badRequest("Invalid ID"));

    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) return next(ApiError.notFound("Поставщик не найден"));

    const audit = await SupplierAudit.create({
      ...req.body,
      supplierId,
      auditorId: req.user.id,
    });

    await logAudit(req, "supplier.audit", "supplier", supplierId, { auditId: audit.id });
    res.status(201).json(audit);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

module.exports = {
  getAll, getOne, create, update, remove, getStats,
  addEvaluation, getEvaluations, addAudit,
};
