const {
  AuditPlan, AuditSchedule, AuditFinding,
  AuditChecklist, AuditChecklistItem, AuditChecklistResponse,
  CHECKLIST_ITEM_STATUSES,
} = require("../models/InternalAudit");
const { User } = require("../../../models/index");
const { logAudit } = require("../../core/utils/auditLogger");
const NcCapaService = require("../../qms-nc/services/NcCapaService");

// Ленивая загрузка DMS (модуль может быть отключён)
let _DocumentService = null;
function getDocumentService() {
  if (_DocumentService === undefined) return null;
  if (_DocumentService) return _DocumentService;
  try {
    _DocumentService = require("../../qms-dms/services/DocumentService");
    return _DocumentService;
  } catch {
    _DocumentService = undefined;
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// Внутренняя логика автосоздания CAPA из finding (переиспользуется)
// ═══════════════════════════════════════════════════════════════

async function _autoCreateCapaForFinding(req, finding) {
  const isNcFinding = ["MAJOR_NC", "MINOR_NC"].includes(finding.type);
  if (!isNcFinding) return null;
  if (finding.nonconformityId || finding.capaId) return null;

  const schedule = await AuditSchedule.findByPk(finding.auditScheduleId, {
    attributes: ["id", "auditNumber", "title"],
  });

  const classificationMap = { MAJOR_NC: "CRITICAL", MINOR_NC: "MAJOR" };
  const classification = classificationMap[finding.type];

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
    assignedToId: finding.responsibleId || (req.body && req.body.assignedToId),
    dueDate: finding.dueDate || (req.body && req.body.dueDate),
  });

  // 2. Создаём CAPA привязанную к NC
  const capa = await NcCapaService.createCAPA(req, {
    type: "CORRECTIVE",
    title: `[Аудит → CAPA] ${finding.findingNumber}: ${finding.description?.substring(0, 200)}`,
    description: `Корректирующее действие по результатам аудита ${auditRef}.\n\nFinding: ${finding.findingNumber}\nТип: ${finding.type}\nПункт ISO: ${finding.isoClause || "—"}\n\nОписание: ${finding.description}`,
    priority,
    nonconformityId: nc.id,
    assignedToId: finding.responsibleId || (req.body && req.body.assignedToId),
    dueDate: finding.dueDate || (req.body && req.body.dueDate),
    effectivenessCheckDays: (req.body && req.body.effectivenessCheckDays) || 90,
  });

  // 3. Обновляем finding — связываем с NC/CAPA
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

  return { nc, capa };
}

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
        {
          model: AuditChecklistResponse, as: "checklistResponses",
          include: [
            { model: AuditChecklistItem, as: "checklistItem", include: [{ model: AuditChecklist, as: "checklist" }] },
            { model: AuditFinding, as: "finding" },
          ],
        },
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
// AuditFinding CRUD — с автосозданием CAPA для MAJOR_NC/MINOR_NC
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

    // Автосоздание NC + CAPA для findings типа MAJOR_NC / MINOR_NC (ISO 8.5.2)
    let autoCapaResult = null;
    if (["MAJOR_NC", "MINOR_NC"].includes(finding.type)) {
      try {
        autoCapaResult = await _autoCreateCapaForFinding(req, finding);
      } catch (capaErr) {
        console.error("Auto-CAPA creation failed (finding saved without CAPA):", capaErr);
      }
    }

    const response = { finding: finding.toJSON() };
    if (autoCapaResult) {
      response.autoCreated = {
        nonconformity: { id: autoCapaResult.nc.id, number: autoCapaResult.nc.number, classification: autoCapaResult.nc.classification },
        capa: { id: autoCapaResult.capa.id, number: autoCapaResult.capa.number, type: autoCapaResult.capa.type, priority: autoCapaResult.capa.priority },
      };
    }

    res.status(201).json(response);
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
    const totalChecklists = await AuditChecklist.count({ where: { isActive: true } });

    res.json({ totalPlans, totalAudits, completedAudits, inProgressAudits, overdueAudits, openFindings, totalFindings, totalChecklists });
  } catch (e) {
    console.error("InternalAudit getStats error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Автосоздание CAPA из audit finding (ISO 8.5.2) — ручной вызов
// ═══════════════════════════════════════════════════════════════

const createCapaFromFinding = async (req, res) => {
  try {
    const findingId = parseInt(req.params.id);
    if (isNaN(findingId)) return res.status(400).json({ error: "Invalid finding ID" });

    const finding = await AuditFinding.findByPk(findingId);
    if (!finding) return res.status(404).json({ error: "Finding not found" });

    if (finding.nonconformityId || finding.capaId) {
      return res.status(400).json({
        error: "Finding уже связан с NC/CAPA",
        nonconformityId: finding.nonconformityId,
        capaId: finding.capaId,
      });
    }

    const isNcFinding = ["MAJOR_NC", "MINOR_NC"].includes(finding.type);
    if (!isNcFinding) {
      return res.status(400).json({
        error: `Автосоздание CAPA доступно только для типов MAJOR_NC/MINOR_NC. Текущий тип: ${finding.type}`,
      });
    }

    const result = await _autoCreateCapaForFinding(req, finding);

    res.status(201).json({
      finding: finding.toJSON(),
      nonconformity: { id: result.nc.id, number: result.nc.number, classification: result.nc.classification },
      capa: { id: result.capa.id, number: result.capa.number, type: result.capa.type, priority: result.capa.priority },
    });
  } catch (e) {
    console.error("createCapaFromFinding error:", e);
    res.status(e.message?.includes("не найден") ? 400 : 500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Чек-листы ISO 13485 — шаблоны
// ═══════════════════════════════════════════════════════════════

/**
 * Получить все шаблоны чек-листов.
 */
const getChecklists = async (req, res) => {
  try {
    const { isoClause, isActive } = req.query;
    const where = {};
    if (isoClause) where.isoClause = isoClause;
    if (isActive !== undefined) where.isActive = isActive === "true";

    const checklists = await AuditChecklist.findAll({
      where,
      include: [{ model: AuditChecklistItem, as: "items", order: [["order", "ASC"]] }],
      order: [["isoClause", "ASC"]],
    });
    res.json(checklists);
  } catch (e) {
    console.error("getChecklists error:", e);
    res.status(500).json({ error: e.message });
  }
};

/**
 * Получить чек-лист для конкретного раздела ISO.
 */
const getChecklistByClause = async (req, res) => {
  try {
    const { clause } = req.params;
    const checklist = await AuditChecklist.findOne({
      where: { isoClause: clause, isActive: true },
      include: [{ model: AuditChecklistItem, as: "items", order: [["order", "ASC"]] }],
    });
    if (!checklist) return res.status(404).json({ error: `Чек-лист для раздела ${clause} не найден` });
    res.json(checklist);
  } catch (e) {
    console.error("getChecklistByClause error:", e);
    res.status(500).json({ error: e.message });
  }
};

/**
 * Создать пользовательский чек-лист (с пунктами).
 */
const createChecklist = async (req, res) => {
  try {
    const { isoClause, title, description, items } = req.body;
    if (!isoClause || !title) {
      return res.status(400).json({ error: "isoClause и title обязательны" });
    }

    const checklist = await AuditChecklist.create({ isoClause, title, description });

    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        await AuditChecklistItem.create({
          checklistId: checklist.id,
          order: i + 1,
          requirement: items[i].requirement,
          guidance: items[i].guidance || null,
          isoReference: items[i].isoReference || null,
        });
      }
    }

    const result = await AuditChecklist.findByPk(checklist.id, {
      include: [{ model: AuditChecklistItem, as: "items" }],
    });

    await logAudit({
      req,
      action: "AUDIT_PLAN_CREATE",
      entity: "AuditChecklist",
      entityId: checklist.id,
      description: `Создан чек-лист аудита: ${isoClause} "${title}"`,
      metadata: { isoClause, itemCount: items?.length || 0 },
    });

    res.status(201).json(result);
  } catch (e) {
    console.error("createChecklist error:", e);
    res.status(500).json({ error: e.message });
  }
};

/**
 * Предзаполнить базу шаблонами чек-листов ISO 13485.
 * POST /api/internal-audits/checklists/seed
 */
const seedChecklists = async (req, res) => {
  try {
    const CHECKLISTS = require("../seeds/iso13485Checklists");

    const existingCount = await AuditChecklist.count();
    if (existingCount > 0) {
      return res.status(400).json({
        error: "Чек-листы уже существуют. Удалите существующие перед повторным заполнением.",
        existingCount,
      });
    }

    let totalItems = 0;
    const created = [];

    for (const tmpl of CHECKLISTS) {
      const checklist = await AuditChecklist.create({
        isoClause: tmpl.isoClause,
        title: tmpl.title,
        description: tmpl.description,
      });

      for (let i = 0; i < tmpl.items.length; i++) {
        await AuditChecklistItem.create({
          checklistId: checklist.id,
          order: i + 1,
          requirement: tmpl.items[i].requirement,
          guidance: tmpl.items[i].guidance || null,
          isoReference: tmpl.items[i].isoReference || null,
        });
        totalItems++;
      }

      created.push({ id: checklist.id, isoClause: tmpl.isoClause, title: tmpl.title, items: tmpl.items.length });
    }

    await logAudit({
      req,
      action: "AUDIT_PLAN_CREATE",
      entity: "AuditChecklist",
      entityId: null,
      description: `Предзаполнение чек-листов ISO 13485: ${created.length} разделов, ${totalItems} пунктов`,
      metadata: { sections: created.length, totalItems },
    });

    res.status(201).json({
      message: `Создано ${created.length} чек-листов с ${totalItems} пунктами`,
      checklists: created,
    });
  } catch (e) {
    console.error("seedChecklists error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Ответы на чек-лист в рамках аудита
// ═══════════════════════════════════════════════════════════════

/**
 * Получить ответы на чек-лист для конкретного аудита.
 */
const getChecklistResponses = async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    if (isNaN(scheduleId)) return res.status(400).json({ error: "Invalid ID" });

    const schedule = await AuditSchedule.findByPk(scheduleId);
    if (!schedule) return res.status(404).json({ error: "Audit not found" });

    const responses = await AuditChecklistResponse.findAll({
      where: { auditScheduleId: scheduleId },
      include: [
        {
          model: AuditChecklistItem, as: "checklistItem",
          include: [{ model: AuditChecklist, as: "checklist", attributes: ["id", "isoClause", "title"] }],
        },
        { model: AuditFinding, as: "finding", attributes: ["id", "findingNumber", "type", "status"] },
      ],
      order: [[{ model: AuditChecklistItem, as: "checklistItem" }, "order", "ASC"]],
    });

    res.json(responses);
  } catch (e) {
    console.error("getChecklistResponses error:", e);
    res.status(500).json({ error: e.message });
  }
};

/**
 * Инициализировать чек-лист для аудита — создать пустые ответы по выбранным разделам.
 * POST /api/internal-audits/schedules/:id/checklist-init
 * Body: { checklistIds: [1, 2, 3] } — ID шаблонов чек-листов
 */
const initChecklistForAudit = async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    if (isNaN(scheduleId)) return res.status(400).json({ error: "Invalid ID" });

    const schedule = await AuditSchedule.findByPk(scheduleId);
    if (!schedule) return res.status(404).json({ error: "Audit not found" });

    const { checklistIds } = req.body;
    if (!checklistIds || !checklistIds.length) {
      return res.status(400).json({ error: "checklistIds обязателен (массив ID шаблонов)" });
    }

    // Загружаем пункты выбранных чек-листов
    const items = await AuditChecklistItem.findAll({
      where: { checklistId: checklistIds },
      order: [["checklistId", "ASC"], ["order", "ASC"]],
    });

    if (!items.length) {
      return res.status(400).json({ error: "Выбранные чек-листы не содержат пунктов" });
    }

    // Проверяем что не инициализированы повторно
    const existingCount = await AuditChecklistResponse.count({
      where: { auditScheduleId: scheduleId, checklistItemId: items.map(i => i.id) },
    });
    if (existingCount > 0) {
      return res.status(400).json({
        error: "Чек-лист для этого аудита уже инициализирован. Удалите существующие ответы перед повторной инициализацией.",
        existingResponses: existingCount,
      });
    }

    const responses = [];
    for (const item of items) {
      const resp = await AuditChecklistResponse.create({
        auditScheduleId: scheduleId,
        checklistItemId: item.id,
        status: CHECKLIST_ITEM_STATUSES.NOT_CHECKED,
        auditorId: req.user.id,
      });
      responses.push(resp);
    }

    await logAudit({
      req,
      action: "AUDIT_CONDUCT",
      entity: "AuditSchedule",
      entityId: scheduleId,
      description: `Инициализирован чек-лист аудита: ${responses.length} пунктов из ${checklistIds.length} разделов`,
      metadata: { checklistIds, itemCount: responses.length },
    });

    res.status(201).json({
      message: `Создано ${responses.length} пунктов чек-листа для аудита`,
      count: responses.length,
    });
  } catch (e) {
    console.error("initChecklistForAudit error:", e);
    res.status(500).json({ error: e.message });
  }
};

/**
 * Обновить ответ на пункт чек-листа.
 * PUT /api/internal-audits/checklist-responses/:id
 */
const updateChecklistResponse = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const response = await AuditChecklistResponse.findByPk(id);
    if (!response) return res.status(404).json({ error: "Checklist response not found" });

    const { status, evidence, notes, findingId } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (evidence !== undefined) updates.evidence = evidence;
    if (notes !== undefined) updates.notes = notes;
    if (findingId !== undefined) updates.findingId = findingId;
    updates.auditorId = req.user.id;

    await response.update(updates);
    res.json(response);
  } catch (e) {
    console.error("updateChecklistResponse error:", e);
    res.status(500).json({ error: e.message });
  }
};

/**
 * Массовое обновление ответов на чек-лист.
 * PUT /api/internal-audits/schedules/:id/checklist-responses
 * Body: { responses: [{ id, status, evidence, notes }] }
 */
const bulkUpdateChecklistResponses = async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    if (isNaN(scheduleId)) return res.status(400).json({ error: "Invalid ID" });

    const { responses } = req.body;
    if (!responses || !responses.length) {
      return res.status(400).json({ error: "responses обязателен (массив обновлений)" });
    }

    let updated = 0;
    for (const item of responses) {
      const resp = await AuditChecklistResponse.findOne({
        where: { id: item.id, auditScheduleId: scheduleId },
      });
      if (resp) {
        const updates = {};
        if (item.status) updates.status = item.status;
        if (item.evidence !== undefined) updates.evidence = item.evidence;
        if (item.notes !== undefined) updates.notes = item.notes;
        if (item.findingId !== undefined) updates.findingId = item.findingId;
        updates.auditorId = req.user.id;

        await resp.update(updates);
        updated++;
      }
    }

    await logAudit({
      req,
      action: "AUDIT_CONDUCT",
      entity: "AuditSchedule",
      entityId: scheduleId,
      description: `Обновлено ${updated} ответов чек-листа аудита`,
      metadata: { updated, total: responses.length },
    });

    res.json({ message: `Обновлено ${updated} из ${responses.length} ответов`, updated });
  } catch (e) {
    console.error("bulkUpdateChecklistResponses error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Рассылка отчёта аудита через DMS workflow (СТО-8.2.4)
// ═══════════════════════════════════════════════════════════════

/**
 * Создаёт документ отчёта аудита в DMS и рассылает через workflow.
 * POST /api/internal-audits/schedules/:id/distribute-report
 * Body: { userIds: [1, 2, 3], approvalChain: [{userId, role, dueDate}] }
 */
const distributeAuditReport = async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    if (isNaN(scheduleId)) return res.status(400).json({ error: "Invalid ID" });

    const schedule = await AuditSchedule.findByPk(scheduleId, {
      include: [
        { model: AuditPlan, as: "auditPlan", attributes: ["id", "title", "year"] },
        { model: AuditFinding, as: "findings" },
      ],
    });
    if (!schedule) return res.status(404).json({ error: "Audit not found" });

    if (schedule.status !== "COMPLETED") {
      return res.status(400).json({ error: "Рассылка отчёта возможна только для завершённых аудитов (статус COMPLETED)" });
    }

    const DocumentService = getDocumentService();
    if (!DocumentService) {
      return res.status(400).json({ error: "Модуль DMS не доступен. Рассылка отчётов через ЭДО невозможна." });
    }

    const { userIds, approvalChain } = req.body;
    if (!userIds || !userIds.length) {
      return res.status(400).json({ error: "userIds обязателен (массив ID получателей отчёта)" });
    }

    // 1. Создаём документ отчёта аудита в DMS
    const findingsSummary = schedule.findings && schedule.findings.length > 0
      ? `\nНесоответствия: ${schedule.findings.filter(f => ["MAJOR_NC", "MINOR_NC"].includes(f.type)).length} (MAJOR: ${schedule.findings.filter(f => f.type === "MAJOR_NC").length}, MINOR: ${schedule.findings.filter(f => f.type === "MINOR_NC").length})\nНаблюдения: ${schedule.findings.filter(f => f.type === "OBSERVATION").length}`
      : "\nНесоответствий не выявлено.";

    const { document, version } = await DocumentService.createDocument(req, {
      title: `Отчёт по внутреннему аудиту ${schedule.auditNumber}`,
      type: "RECORD",
      category: "Внутренние аудиты",
      description: `Отчёт по результатам внутреннего аудита ${schedule.auditNumber} "${schedule.title}".\nОбласть: ${schedule.scope || "—"}\nПункты ISO: ${schedule.isoClause || "—"}\nЗаключение: ${schedule.conclusion || "—"}${findingsSummary}`,
      isoSection: "8.2.4",
      tags: ["audit-report", schedule.auditNumber],
    });

    // 2. Обновляем reportUrl в аудите → ссылка на документ DMS
    await schedule.update({ reportUrl: `/documents/${document.id}` });

    // 3. Если указана цепочка согласования — отправляем на согласование
    if (approvalChain && approvalChain.length > 0) {
      await DocumentService.submitForReview(req, version.id, approvalChain);
    }

    // 4. Если документ уже approved/effective — рассылаем (иначе рассылка будет после согласования)
    let distributions = null;
    if (!approvalChain || approvalChain.length === 0) {
      // Без согласования — делаем effective и рассылаем напрямую
      await DocumentService.makeEffective(req, version.id);
      distributions = await DocumentService.distribute(req, version.id, userIds);
    }

    await logAudit({
      req,
      action: "AUDIT_REPORT_APPROVE",
      entity: "AuditSchedule",
      entityId: scheduleId,
      description: `Отчёт аудита ${schedule.auditNumber} создан в DMS (${document.code}) и направлен на рассылку`,
      metadata: {
        documentId: document.id,
        documentCode: document.code,
        versionId: version.id,
        recipientCount: userIds.length,
        hasApprovalChain: !!(approvalChain && approvalChain.length),
      },
    });

    res.status(201).json({
      message: "Отчёт аудита создан в DMS и направлен на рассылку",
      document: { id: document.id, code: document.code, title: document.title },
      version: { id: version.id, version: version.version, status: version.status },
      distributed: !!distributions,
      recipientCount: userIds.length,
      approvalChainLength: approvalChain?.length || 0,
    });
  } catch (e) {
    console.error("distributeAuditReport error:", e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getPlans, getPlanOne, createPlan, updatePlan,
  getSchedules, getScheduleOne, createSchedule, updateSchedule,
  addFinding, updateFinding, getStats,
  createCapaFromFinding,
  // Чек-листы
  getChecklists, getChecklistByClause, createChecklist, seedChecklists,
  getChecklistResponses, initChecklistForAudit, updateChecklistResponse, bulkUpdateChecklistResponses,
  // Рассылка отчётов через DMS
  distributeAuditReport,
};
