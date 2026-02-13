const { RiskRegister, RiskAssessment, RiskMitigation } = require("../models/Risk");
const { User, Capa } = require("../../../models/index");
const RiskMatrixService = require("../services/RiskMatrixService");
const RiskMonitoringService = require("../services/RiskMonitoringService");
const { logAudit } = require("../../core/utils/auditLogger");
const { Op } = require("sequelize");
const sequelize = require("../../../db");
const ApiError = require("../../../error/ApiError");

// Допустимые поля для обновления риска
const RISK_UPDATABLE_FIELDS = [
  "title", "description", "category", "ownerId",
  "initialProbability", "initialSeverity",
  "relatedEntity", "relatedEntityId", "isoClause",
];

// ═══════════════════════════════════════════════════════════════
// CRUD — Реестр рисков
// ═══════════════════════════════════════════════════════════════

const getAll = async (req, res, next) => {
  try {
    const { category, status, riskClass, ownerId, page = 1, limit = 50 } = req.query;
    const where = {};

    if (category) where.category = category;
    if (status) where.status = status;
    if (riskClass) where.initialRiskClass = riskClass;
    if (ownerId) where.ownerId = ownerId;

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;
    const { count, rows } = await RiskRegister.findAndCountAll({
      where,
      include: [
        { model: RiskAssessment, as: "assessments", limit: 1, order: [["assessmentDate", "DESC"]] },
        { model: RiskMitigation, as: "mitigations", include: [{ model: Capa, as: "capa", attributes: ["id", "number", "status", "title"] }] },
        { model: User, as: "owner", attributes: ["id", "name", "surname"] },
      ],
      order: [["initialRiskLevel", "DESC"], ["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("Risk getAll error:", e);
    next(ApiError.internal(e.message));
  }
};

const getOne = async (req, res, next) => {
  try {
    const includes = [
      { model: RiskAssessment, as: "assessments", order: [["assessmentDate", "DESC"]] },
      { model: RiskMitigation, as: "mitigations", order: [["createdAt", "ASC"]] },
      { model: User, as: "owner", attributes: ["id", "name", "surname"] },
    ];

    // Включаем связанные NC если модуль доступен
    try {
      const { Nonconformity } = require("../../qms-nc/models/NcCapa");
      includes.push({
        model: Nonconformity, as: "nonconformities",
        attributes: ["id", "number", "title", "classification", "status", "source", "dueDate"],
      });
    } catch { /* NC модуль не доступен */ }

    const risk = await RiskRegister.findByPk(req.params.id, { include: includes });


    if (!risk) return next(ApiError.notFound("Риск не найден"));
    res.json(risk);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Требуется авторизация"));

    const { title, description, category, initialProbability, initialSeverity, ownerId, relatedEntity, relatedEntityId, isoClause } = req.body;

    // Автогенерация номера через MAX для предотвращения коллизий
    const [maxResult] = await sequelize.query(
      `SELECT MAX(CAST(SUBSTRING("riskNumber" FROM '(\\d+)$') AS INTEGER)) AS max_num FROM risk_registers`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const riskNumber = RiskMatrixService.generateRiskNumber((maxResult?.max_num || 0) + 1);

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
      assessorId: req.user.id,
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
    next(ApiError.internal(e.message));
  }
};

const update = async (req, res, next) => {
  try {
    const risk = await RiskRegister.findByPk(req.params.id);
    if (!risk) return next(ApiError.notFound("Риск не найден"));

    // Whitelist полей — защита от mass assignment
    const updateData = {};
    for (const field of RISK_UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    // Если обновляется хотя бы одно поле оценки — пересчитываем
    const hasInitialProbability = updateData.initialProbability !== undefined;
    const hasInitialSeverity = updateData.initialSeverity !== undefined;
    if (hasInitialProbability || hasInitialSeverity) {
      const effectiveProbability = hasInitialProbability ? updateData.initialProbability : risk.initialProbability;
      const effectiveSeverity = hasInitialSeverity ? updateData.initialSeverity : risk.initialSeverity;
      const { level, riskClass } = RiskMatrixService.calculate(effectiveProbability, effectiveSeverity);
      updateData.initialRiskLevel = level;
      updateData.initialRiskClass = riskClass;
    }

    await risk.update(updateData);
    await logAudit(req, "risk.update", "risk_register", risk.id, updateData);
    res.json(risk);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Оценка риска (переоценка)
// ═══════════════════════════════════════════════════════════════

const addAssessment = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Требуется авторизация"));

    const { probability, severity, detectability, rationale, assessmentType } = req.body;
    const risk = await RiskRegister.findByPk(req.params.id);
    if (!risk) return next(ApiError.notFound("Риск не найден"));

    const { level, riskClass } = RiskMatrixService.calculate(probability, severity);
    const previousClass = assessmentType === "POST_MITIGATION" ? risk.residualRiskClass : risk.initialRiskClass;

    const assessment = await RiskAssessment.create({
      riskRegisterId: risk.id,
      assessorId: req.user.id,
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
      await RiskMatrixService.recalculateRisk(risk, {
        probability,
        severity,
        isResidual: true,
        actorUserId: req.user.id,
        source: "addAssessment",
      });
      risk.status = RiskMatrixService.isAcceptable(riskClass) ? "ACCEPTED" : "MITIGATED";
      await risk.save();
    }

    await RiskMonitoringService.notifyLevelChanged({
      risk,
      previousClass,
      nextClass: riskClass,
      source: "addAssessment",
      actorUserId: req.user.id,
    });

    await logAudit(req, "risk.assess", "risk_register", risk.id, { riskClass, level });
    res.status(201).json(assessment);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Меры снижения
// ═══════════════════════════════════════════════════════════════

// Допустимые поля для создания митигации
const MITIGATION_FIELDS = [
  "mitigationType", "description", "responsibleId", "dueDate", "priority", "capaId",
];

const addMitigation = async (req, res, next) => {
  try {
    const risk = await RiskRegister.findByPk(req.params.id);
    if (!risk) return next(ApiError.notFound("Риск не найден"));

    // Whitelist полей
    const safeData = {};
    for (const field of MITIGATION_FIELDS) {
      if (req.body[field] !== undefined) safeData[field] = req.body[field];
    }

    if (safeData.capaId !== undefined && safeData.capaId !== null) {
      const capa = await Capa.findByPk(safeData.capaId);
      if (!capa) return next(ApiError.badRequest(`CAPA с id=${safeData.capaId} не найдена`));
    }

    const mitigation = await RiskMitigation.create({
      riskRegisterId: risk.id,
      ...safeData,
      status: "PLANNED",
    });

    // Корректная логика: после добавления мер риск переходит в MITIGATING (не ASSESSED)
    if (risk.status === "IDENTIFIED" || risk.status === "ASSESSED") {
      risk.status = "ASSESSED";
      await risk.save();
    }

    await logAudit(req, "risk.mitigation.add", "risk_register", risk.id, { mitigationType: safeData.mitigationType });
    if (mitigation.capaId) {
      await logAudit(req, "risk.capa.link", "risk_mitigation", mitigation.id, { riskRegisterId: risk.id, capaId: mitigation.capaId });
    }
    res.status(201).json(mitigation);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const completeMitigation = async (req, res, next) => {
  try {
    const mitigation = await RiskMitigation.findByPk(req.params.mitigationId);
    if (!mitigation) return next(ApiError.notFound("Мера не найдена"));

    // Проверка текущего статуса
    if (mitigation.status !== "PLANNED") {
      return next(ApiError.badRequest(`Завершить можно только запланированную меру. Текущий статус: ${mitigation.status}`));
    }

    mitigation.status = "COMPLETED";
    mitigation.completedDate = new Date();
    await mitigation.save();

    await logAudit(req, "risk.mitigation.complete", "risk_mitigation", mitigation.id);
    res.json(mitigation);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const verifyMitigation = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Требуется авторизация"));

    const mitigation = await RiskMitigation.findByPk(req.params.mitigationId);
    if (!mitigation) return next(ApiError.notFound("Мера не найдена"));

    // Проверка текущего статуса: верифицировать можно только выполненную меру
    if (mitigation.status !== "COMPLETED") {
      return next(ApiError.badRequest(`Верифицировать можно только выполненную меру. Текущий статус: ${mitigation.status}`));
    }

    mitigation.status = "VERIFIED";
    mitigation.verifiedBy = req.user.id;
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
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Принятие остаточного риска
// ═══════════════════════════════════════════════════════════════

const acceptRisk = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Требуется авторизация"));

    const risk = await RiskRegister.findByPk(req.params.id);
    if (!risk) return next(ApiError.notFound("Риск не найден"));

    // ISO 14971: принятие риска только после оценки/митигации
    const allowedForAcceptance = ["ASSESSED", "MITIGATED", "MONITORING"];
    if (!allowedForAcceptance.includes(risk.status)) {
      return next(ApiError.badRequest(
        `Принять риск можно только в статусе ${allowedForAcceptance.join("/")}. Текущий: ${risk.status}`
      ));
    }

    if (!req.body.decision) {
      return next(ApiError.badRequest("Обоснование принятия (decision) обязательно"));
    }

    risk.status = "ACCEPTED";
    risk.acceptanceDecision = req.body.decision;
    risk.acceptedBy = req.user.id;
    risk.acceptedAt = new Date();
    await risk.save();

    await logAudit(req, "risk.accept", "risk_register", risk.id, { severity: "WARNING" });
    res.json(risk);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Матрица и статистика
// ═══════════════════════════════════════════════════════════════

const getMatrix = async (req, res, next) => {
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
    next(ApiError.internal(e.message));
  }
};

const getStats = async (req, res, next) => {
  try {
    // Оптимизация: один GROUP BY запрос вместо N+1 COUNT
    const [total, byClassRaw, byStatusRaw, overdue] = await Promise.all([
      RiskRegister.count(),
      RiskRegister.findAll({
        attributes: ["initialRiskClass", [sequelize.fn("COUNT", "*"), "count"]],
        where: { status: { [Op.ne]: "CLOSED" } },
        group: ["initialRiskClass"],
        raw: true,
      }),
      RiskRegister.findAll({
        attributes: ["status", [sequelize.fn("COUNT", "*"), "count"]],
        group: ["status"],
        raw: true,
      }),
      RiskRegister.count({
        where: { reviewDate: { [Op.lt]: new Date() }, status: { [Op.notIn]: ["CLOSED", "ACCEPTED"] } },
      }),
    ]);

    const byClass = {};
    for (const cls of ["LOW", "MEDIUM", "HIGH", "CRITICAL"]) byClass[cls] = 0;
    byClassRaw.forEach(r => { byClass[r.initialRiskClass] = parseInt(r.count); });

    const byStatus = {};
    for (const s of ["IDENTIFIED", "ASSESSED", "MITIGATED", "ACCEPTED", "CLOSED", "MONITORING"]) byStatus[s] = 0;
    byStatusRaw.forEach(r => { byStatus[r.status] = parseInt(r.count); });

    res.json({ total, byClass, byStatus, overdue });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// NC ↔ Risk: получение связанных NC (ISO 14971 интеграция)
// ═══════════════════════════════════════════════════════════════

const getLinkedNCs = async (req, res, next) => {
  try {
    const risk = await RiskRegister.findByPk(req.params.id);
    if (!risk) return next(ApiError.notFound("Риск не найден"));

    // Ленивая загрузка NC модели
    let Nonconformity;
    try {
      ({ Nonconformity } = require("../../qms-nc/models/NcCapa"));
    } catch {
      return next(ApiError.badRequest("Модуль NC не доступен"));
    }

    const ncs = await Nonconformity.findAll({
      where: { riskRegisterId: risk.id },
      include: [
        { model: User, as: "assignedTo", attributes: ["id", "name", "surname"] },
      ],
      attributes: ["id", "number", "title", "classification", "status", "source", "dueDate", "detectedAt"],
      order: [["detectedAt", "DESC"]],
    });

    res.json({ riskId: risk.id, riskNumber: risk.riskNumber, nonconformities: ncs });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

module.exports = {
  getAll, getOne, create, update,
  addAssessment,
  addMitigation, completeMitigation, verifyMitigation,
  acceptRisk,
  getMatrix, getStats,
  getLinkedNCs,
};
