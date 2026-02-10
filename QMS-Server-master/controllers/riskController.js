const { RiskRegister, RiskAssessment, RiskMitigation } = require("../models/definitions/Risk");
const { User } = require("../models/definitions/General");
const RiskMatrixService = require("../services/RiskMatrixService");
const { logAudit } = require("../utils/auditLogger");
const { Op } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// CRUD — Реестр рисков
// ═══════════════════════════════════════════════════════════════

const getAll = async (req, res) => {
  try {
    const { category, status, riskClass, ownerId, page = 1, limit = 50 } = req.query;
    const where = {};

    if (category) where.category = category;
    if (status) where.status = status;
    if (riskClass) where.initialRiskClass = riskClass;
    if (ownerId) where.ownerId = ownerId;

    const offset = (page - 1) * limit;
    const { count, rows } = await RiskRegister.findAndCountAll({
      where,
      include: [
        { model: RiskAssessment, as: "assessments", limit: 1, order: [["assessmentDate", "DESC"]] },
        { model: RiskMitigation, as: "mitigations" },
        { model: User, as: "owner", attributes: ["id", "name", "surname"] },
      ],
      order: [["initialRiskLevel", "DESC"], ["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    res.json({ count, rows, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (e) {
    console.error("Risk getAll error:", e);
    res.status(500).json({ error: e.message });
  }
};

const getOne = async (req, res) => {
  try {
    const risk = await RiskRegister.findByPk(req.params.id, {
      include: [
        { model: RiskAssessment, as: "assessments", order: [["assessmentDate", "DESC"]] },
        { model: RiskMitigation, as: "mitigations", order: [["createdAt", "ASC"]] },
        { model: User, as: "owner", attributes: ["id", "name", "surname"] },
      ],
    });

    if (!risk) return res.status(404).json({ error: "Риск не найден" });
    res.json(risk);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const create = async (req, res) => {
  try {
    const { title, description, category, initialProbability, initialSeverity, ownerId, relatedEntity, relatedEntityId, isoClause } = req.body;

    // Автогенерация номера
    const count = await RiskRegister.count();
    const riskNumber = RiskMatrixService.generateRiskNumber(count + 1);

    // Авторасчёт уровня
    const { level, riskClass } = RiskMatrixService.calculate(initialProbability, initialSeverity);

    const risk = await RiskRegister.create({
      riskNumber,
      title,
      description,
      category,
      initialProbability,
      initialSeverity,
      initialRiskLevel: level,
      initialRiskClass: riskClass,
      ownerId,
      relatedEntity,
      relatedEntityId,
      isoClause,
      status: "IDENTIFIED",
    });

    // Первичная оценка
    await RiskAssessment.create({
      riskRegisterId: risk.id,
      assessorId: req.user?.id || 1,
      probability: initialProbability,
      severity: initialSeverity,
      riskLevel: level,
      riskClass,
      assessmentType: "INITIAL",
      rationale: `Первичная идентификация риска: ${title}`,
    });

    await logAudit(req, "risk.create", "risk_register", risk.id, { riskNumber, riskClass });
    res.status(201).json(risk);
  } catch (e) {
    console.error("Risk create error:", e);
    res.status(500).json({ error: e.message });
  }
};

const update = async (req, res) => {
  try {
    const risk = await RiskRegister.findByPk(req.params.id);
    if (!risk) return res.status(404).json({ error: "Риск не найден" });

    const updateData = { ...req.body };
    
    // Если обновляется оценка — пересчитываем
    if (updateData.initialProbability && updateData.initialSeverity) {
      const { level, riskClass } = RiskMatrixService.calculate(updateData.initialProbability, updateData.initialSeverity);
      updateData.initialRiskLevel = level;
      updateData.initialRiskClass = riskClass;
    }

    await risk.update(updateData);
    await logAudit(req, "risk.update", "risk_register", risk.id, updateData);
    res.json(risk);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Оценка риска (переоценка)
// ═══════════════════════════════════════════════════════════════

const addAssessment = async (req, res) => {
  try {
    const { probability, severity, detectability, rationale, assessmentType } = req.body;
    const risk = await RiskRegister.findByPk(req.params.id);
    if (!risk) return res.status(404).json({ error: "Риск не найден" });

    const { level, riskClass } = RiskMatrixService.calculate(probability, severity);

    const assessment = await RiskAssessment.create({
      riskRegisterId: risk.id,
      assessorId: req.user?.id || 1,
      probability,
      severity,
      detectability,
      riskLevel: level,
      riskClass,
      rationale,
      assessmentType: assessmentType || "PERIODIC",
    });

    // Обновляем остаточный риск если это POST_MITIGATION
    if (assessmentType === "POST_MITIGATION") {
      await RiskMatrixService.recalculateRisk(risk, { probability, severity, isResidual: true });
      risk.status = RiskMatrixService.isAcceptable(riskClass) ? "ACCEPTED" : "MITIGATED";
      await risk.save();
    }

    await logAudit(req, "risk.assess", "risk_register", risk.id, { riskClass, level });
    res.status(201).json(assessment);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Меры снижения
// ═══════════════════════════════════════════════════════════════

const addMitigation = async (req, res) => {
  try {
    const risk = await RiskRegister.findByPk(req.params.id);
    if (!risk) return res.status(404).json({ error: "Риск не найден" });

    const mitigation = await RiskMitigation.create({
      riskRegisterId: risk.id,
      ...req.body,
      status: "PLANNED",
    });

    if (risk.status === "IDENTIFIED") {
      risk.status = "ASSESSED";
      await risk.save();
    }

    await logAudit(req, "risk.mitigation.add", "risk_register", risk.id, { mitigationType: req.body.mitigationType });
    res.status(201).json(mitigation);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const completeMitigation = async (req, res) => {
  try {
    const mitigation = await RiskMitigation.findByPk(req.params.mitigationId);
    if (!mitigation) return res.status(404).json({ error: "Мера не найдена" });

    mitigation.status = "COMPLETED";
    mitigation.completedDate = new Date();
    await mitigation.save();

    await logAudit(req, "risk.mitigation.complete", "risk_mitigation", mitigation.id);
    res.json(mitigation);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const verifyMitigation = async (req, res) => {
  try {
    const mitigation = await RiskMitigation.findByPk(req.params.mitigationId);
    if (!mitigation) return res.status(404).json({ error: "Мера не найдена" });

    mitigation.status = "VERIFIED";
    mitigation.verifiedBy = req.user?.id || 1;
    mitigation.verifiedAt = new Date();
    mitigation.verificationNotes = req.body.notes;
    await mitigation.save();

    // Проверяем все ли меры верифицированы → переводим риск в MITIGATED
    const risk = await RiskRegister.findByPk(mitigation.riskRegisterId, {
      include: [{ model: RiskMitigation, as: "mitigations" }],
    });
    
    const allVerified = risk.mitigations.every(m => m.status === "VERIFIED");
    if (allVerified) {
      risk.status = "MITIGATED";
      await risk.save();
    }

    await logAudit(req, "risk.mitigation.verify", "risk_mitigation", mitigation.id);
    res.json(mitigation);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Принятие остаточного риска
// ═══════════════════════════════════════════════════════════════

const acceptRisk = async (req, res) => {
  try {
    const risk = await RiskRegister.findByPk(req.params.id);
    if (!risk) return res.status(404).json({ error: "Риск не найден" });

    risk.status = "ACCEPTED";
    risk.acceptanceDecision = req.body.decision;
    risk.acceptedBy = req.user?.id || 1;
    risk.acceptedAt = new Date();
    await risk.save();

    await logAudit(req, "risk.accept", "risk_register", risk.id, { severity: "WARNING" });
    res.json(risk);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Матрица и статистика
// ═══════════════════════════════════════════════════════════════

const getMatrix = async (req, res) => {
  try {
    const matrix = RiskMatrixService.getMatrix();
    const labels = RiskMatrixService.getScaleLabels();

    // Считаем количество рисков в каждой ячейке
    const risks = await RiskRegister.findAll({
      attributes: ["initialProbability", "initialSeverity"],
      where: { status: { [Op.notIn]: ["CLOSED"] } },
    });

    const cellCounts = {};
    risks.forEach(r => {
      const key = `${r.initialProbability}-${r.initialSeverity}`;
      cellCounts[key] = (cellCounts[key] || 0) + 1;
    });

    res.json({ matrix, labels, cellCounts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getStats = async (req, res) => {
  try {
    const total = await RiskRegister.count();
    const byClass = {};
    for (const cls of ["LOW", "MEDIUM", "HIGH", "CRITICAL"]) {
      byClass[cls] = await RiskRegister.count({ where: { initialRiskClass: cls, status: { [Op.ne]: "CLOSED" } } });
    }
    const byStatus = {};
    for (const s of ["IDENTIFIED", "ASSESSED", "MITIGATED", "ACCEPTED", "CLOSED", "MONITORING"]) {
      byStatus[s] = await RiskRegister.count({ where: { status: s } });
    }

    const overdue = await RiskRegister.count({
      where: { reviewDate: { [Op.lt]: new Date() }, status: { [Op.notIn]: ["CLOSED", "ACCEPTED"] } },
    });

    res.json({ total, byClass, byStatus, overdue });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getAll, getOne, create, update,
  addAssessment,
  addMitigation, completeMitigation, verifyMitigation,
  acceptRisk,
  getMatrix, getStats,
};
