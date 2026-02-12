const { AuditPlan, AuditSchedule, AuditFinding } = require("../models/InternalAudit");
const { User } = require("../../../models/index");
const { logAudit } = require("../../core/utils/auditLogger");
const NcCapaService = require("../../qms-nc/services/NcCapaService");

// ═══════════════════════════════════════════════════════════════
// AuditPlan CRUD
// ═══════════════════════════════════════════════════════════════

const getPlans = async (req, res) => {
  try {
    const { year, status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (year) where.year = year;
    if (status) where.status = status;

    const offset = (page - 1) * limit;
    const { count, rows } = await AuditPlan.findAndCountAll({
      where,
      include: [{ model: AuditSchedule, as: "audits" }],
      order: [["year", "DESC"]],
      limit: parseInt(limit),
      offset,
    });
    res.json({ count, rows, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (e) {
    console.error("AuditPlan getPlans error:", e);
    res.status(500).json({ error: e.message });
  }
};

const getPlanOne = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const plan = await AuditPlan.findByPk(id, {
      include: [{
        model: AuditSchedule, as: "audits",
        include: [{ model: AuditFinding, as: "findings" }],
      }],
    });
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    res.json(plan);
  } catch (e) {
    console.error("AuditPlan getPlanOne error:", e);
    res.status(500).json({ error: e.message });
  }
};

const createPlan = async (req, res) => {
  try {
    const plan = await AuditPlan.create(req.body);
    await logAudit(req, "audit.plan.create", "audit_plan", plan.id, { title: plan.title, year: plan.year });
    res.status(201).json(plan);
  } catch (e) {
    console.error("AuditPlan createPlan error:", e);
    res.status(500).json({ error: e.message });
  }
};

const updatePlan = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const plan = await AuditPlan.findByPk(id);
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    await plan.update(req.body);
    await logAudit(req, "audit.plan.update", "audit_plan", plan.id, req.body);
    res.json(plan);
  } catch (e) {
    console.error("AuditPlan updatePlan error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// AuditSchedule CRUD
// ═══════════════════════════════════════════════════════════════

const getSchedules = async (req, res) => {
  try {
    const { planId, status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (planId) where.auditPlanId = planId;
    if (status) where.status = status;

    const offset = (page - 1) * limit;
    const { count, rows } = await AuditSchedule.findAndCountAll({
      where,
      include: [
        { model: AuditFinding, as: "findings" },
        { model: AuditPlan, as: "auditPlan", attributes: ["id", "title", "year"] },
      ],
      order: [["plannedDate", "ASC"]],
      limit: parseInt(limit),
      offset,
    });
    res.json({ count, rows, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (e) {
    console.error("AuditSchedule getSchedules error:", e);
    res.status(500).json({ error: e.message });
  }
};

const getScheduleOne = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const schedule = await AuditSchedule.findByPk(id, {
      include: [
        { model: AuditFinding, as: "findings" },
        { model: AuditPlan, as: "auditPlan" },
      ],
    });
    if (!schedule) return res.status(404).json({ error: "Audit not found" });
    res.json(schedule);
  } catch (e) {
    console.error("AuditSchedule getScheduleOne error:", e);
    res.status(500).json({ error: e.message });
  }
};

const createSchedule = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const count = await AuditSchedule.count();
    const auditNumber = `IA-${year}-${String(count + 1).padStart(3, "0")}`;

    const schedule = await AuditSchedule.create({ ...req.body, auditNumber });
    await logAudit(req, "audit.schedule.create", "internal_audit", schedule.id, { auditNumber });
    res.status(201).json(schedule);
  } catch (e) {
    console.error("AuditSchedule createSchedule error:", e);
    res.status(500).json({ error: e.message });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const schedule = await AuditSchedule.findByPk(id);
    if (!schedule) return res.status(404).json({ error: "Audit not found" });

    await schedule.update(req.body);
    await logAudit(req, "audit.schedule.update", "internal_audit", schedule.id, req.body);
    res.json(schedule);
  } catch (e) {
    console.error("AuditSchedule updateSchedule error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// AuditFinding CRUD
// ═══════════════════════════════════════════════════════════════

const addFinding = async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.scheduleId);
    if (isNaN(scheduleId)) return res.status(400).json({ error: "Invalid ID" });

    const schedule = await AuditSchedule.findByPk(scheduleId);
    if (!schedule) return res.status(404).json({ error: "Audit not found" });

    const year = new Date().getFullYear();
    const count = await AuditFinding.count();
    const findingNumber = `AF-${year}-${String(count + 1).padStart(3, "0")}`;

    const finding = await AuditFinding.create({
      ...req.body,
      auditScheduleId: scheduleId,
      findingNumber,
    });

    await logAudit(req, "audit.finding.create", "audit_finding", finding.id, { findingNumber, scheduleId });
    res.status(201).json(finding);
  } catch (e) {
    console.error("AuditFinding addFinding error:", e);
    res.status(500).json({ error: e.message });
  }
};

const updateFinding = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const finding = await AuditFinding.findByPk(id);
    if (!finding) return res.status(404).json({ error: "Finding not found" });

    await finding.update(req.body);
    await logAudit(req, "audit.finding.update", "audit_finding", finding.id, req.body);
    res.json(finding);
  } catch (e) {
    console.error("AuditFinding updateFinding error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Statistics
// ═══════════════════════════════════════════════════════════════

const getStats = async (req, res) => {
  try {
    const totalPlans = await AuditPlan.count();
    const totalAudits = await AuditSchedule.count();
    const completedAudits = await AuditSchedule.count({ where: { status: "COMPLETED" } });
    const inProgressAudits = await AuditSchedule.count({ where: { status: "IN_PROGRESS" } });
    const overdueAudits = await AuditSchedule.count({ where: { status: "OVERDUE" } });
    const openFindings = await AuditFinding.count({ where: { status: "OPEN" } });
    const totalFindings = await AuditFinding.count();

    res.json({ totalPlans, totalAudits, completedAudits, inProgressAudits, overdueAudits, openFindings, totalFindings });
  } catch (e) {
    console.error("InternalAudit getStats error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Автосоздание CAPA из audit finding (ISO 8.5.2)
// ═══════════════════════════════════════════════════════════════

const createCapaFromFinding = async (req, res) => {
  try {
    const findingId = parseInt(req.params.id);
    if (isNaN(findingId)) return res.status(400).json({ error: "Invalid finding ID" });

    const finding = await AuditFinding.findByPk(findingId);
    if (!finding) return res.status(404).json({ error: "Finding not found" });

    // Загружаем связанный audit schedule для формирования описания
    const schedule = await AuditSchedule.findByPk(finding.auditScheduleId, {
      attributes: ["id", "auditNumber", "title"],
    });

    // Проверяем что finding ещё не привязан к NC/CAPA
    if (finding.nonconformityId || finding.capaId) {
      return res.status(400).json({
        error: "Finding уже связан с NC/CAPA",
        nonconformityId: finding.nonconformityId,
        capaId: finding.capaId,
      });
    }

    // Только findings типа NC (MAJOR_NC, MINOR_NC) генерируют CAPA
    const isNcFinding = ["MAJOR_NC", "MINOR_NC"].includes(finding.type);
    if (!isNcFinding) {
      return res.status(400).json({
        error: `Автосоздание CAPA доступно только для типов MAJOR_NC/MINOR_NC. Текущий тип: ${finding.type}`,
      });
    }

    // Маппинг типа finding → classification NC
    const classificationMap = { MAJOR_NC: "CRITICAL", MINOR_NC: "MAJOR" };
    const classification = classificationMap[finding.type];

    // Маппинг типа finding → приоритет CAPA
    const priorityMap = { MAJOR_NC: "URGENT", MINOR_NC: "HIGH" };
    const priority = priorityMap[finding.type];

    const auditRef = schedule
      ? `${schedule.auditNumber} "${schedule.title}"`
      : `audit schedule #${finding.auditScheduleId}`;

    // 1. Создаём NC
    const nc = await NcCapaService.createNC(req, {
      title: `[Аудит] ${finding.findingNumber}: ${finding.description?.substring(0, 200)}`,
      description: `Несоответствие выявлено при внутреннем аудите ${auditRef}.\n\nОписание: ${finding.description}\n\nОбъективные свидетельства: ${finding.evidence || "—"}\n\nПункт ISO: ${finding.isoClause || "—"}`,
      source: "INTERNAL_AUDIT",
      classification,
      capaRequired: true,
      assignedToId: finding.responsibleId || req.body.assignedToId,
      dueDate: finding.dueDate || req.body.dueDate,
    });

    // 2. Создаём CAPA привязанную к NC
    const capa = await NcCapaService.createCAPA(req, {
      type: "CORRECTIVE",
      title: `[Аудит → CAPA] ${finding.findingNumber}: ${finding.description?.substring(0, 200)}`,
      description: `Корректирующее действие по результатам аудита ${auditRef}.\n\nFinding: ${finding.findingNumber}\nТип: ${finding.type}\nПункт ISO: ${finding.isoClause || "—"}\n\nОписание: ${finding.description}`,
      priority,
      nonconformityId: nc.id,
      assignedToId: finding.responsibleId || req.body.assignedToId,
      dueDate: finding.dueDate || req.body.dueDate,
      effectivenessCheckDays: req.body.effectivenessCheckDays || 90,
    });

    // 3. Обновляем finding — связываем с NC/CAPA и меняем статус
    await finding.update({
      nonconformityId: nc.id,
      capaId: capa.id,
      status: "ACTION_REQUIRED",
      followUpStatus: "IN_PROGRESS",
    });

    await logAudit({
      req,
      action: "AUDIT_FINDING_CREATE",
      entity: "AuditFinding",
      entityId: finding.id,
      description: `Автосоздание NC ${nc.number} и CAPA ${capa.number} из finding ${finding.findingNumber}`,
      metadata: {
        findingId: finding.id,
        findingNumber: finding.findingNumber,
        ncId: nc.id,
        ncNumber: nc.number,
        capaId: capa.id,
        capaNumber: capa.number,
      },
    });

    res.status(201).json({
      finding: finding.toJSON(),
      nonconformity: { id: nc.id, number: nc.number, classification: nc.classification },
      capa: { id: capa.id, number: capa.number, type: capa.type, priority: capa.priority },
    });
  } catch (e) {
    console.error("createCapaFromFinding error:", e);
    res.status(e.message?.includes("не найден") ? 400 : 500).json({ error: e.message });
  }
};

module.exports = {
  getPlans, getPlanOne, createPlan, updatePlan,
  getSchedules, getScheduleOne, createSchedule, updateSchedule,
  addFinding, updateFinding, getStats,
  createCapaFromFinding,
};
