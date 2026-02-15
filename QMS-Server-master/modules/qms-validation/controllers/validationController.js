const { ProcessValidation } = require("../models/ProcessValidation");
const { ValidationProtocolTemplate, ValidationChecklist, ValidationChecklistItem } = require("../models/ValidationProtocol");
const sequelize = require("../../../db");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");

const getAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const where = {};

    if (status) where.status = status;

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await ProcessValidation.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("ProcessValidation getAll error:", e);
    next(ApiError.internal(e.message));
  }
};

const getOne = async (req, res, next) => {
  try {
    const pv = await ProcessValidation.findByPk(req.params.id);
    if (!pv) return next(ApiError.notFound("Валидация процесса не найдена"));
    res.json(pv);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Требуется авторизация"));

    const year = new Date().getFullYear();
    const [maxResult] = await sequelize.query(
      `SELECT MAX(CAST(SUBSTRING("validationNumber" FROM '(\\d+)$') AS INTEGER)) AS max_num FROM process_validations WHERE "validationNumber" LIKE 'PV-${year}-%'`
    );
    const maxNum = maxResult?.[0]?.max_num || 0;
    const validationNumber = `PV-${year}-${String(maxNum + 1).padStart(3, "0")}`;

    const pv = await ProcessValidation.create({
      ...req.body,
      validationNumber,
    });

    await logAudit({
      req,
      action: "VALIDATION_CREATE",
      entity: "ProcessValidation",
      entityId: pv.id,
      description: `Создана валидация процесса: ${validationNumber}`,
    });

    res.status(201).json(pv);
  } catch (e) {
    console.error("ProcessValidation create error:", e);
    next(ApiError.internal(e.message));
  }
};

const update = async (req, res, next) => {
  try {
    const pv = await ProcessValidation.findByPk(req.params.id);
    if (!pv) return next(ApiError.notFound("Валидация процесса не найдена"));

    await pv.update(req.body);

    await logAudit({
      req,
      action: "VALIDATION_UPDATE",
      entity: "ProcessValidation",
      entityId: pv.id,
      description: `Обновлена валидация: ${pv.validationNumber}`,
    });

    res.json(pv);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const getStats = async (req, res, next) => {
  try {
    const total = await ProcessValidation.count();
    const validated = await ProcessValidation.count({ where: { status: "VALIDATED" } });
    const revalidationDue = await ProcessValidation.count({ where: { status: "REVALIDATION_DUE" } });
    const failed = await ProcessValidation.count({ where: { status: "FAILED" } });

    // Find nearest revalidation date
    const { Op } = require("sequelize");
    const nearest = await ProcessValidation.findOne({
      where: {
        nextRevalidationDate: { [Op.ne]: null, [Op.gte]: new Date() },
      },
      order: [["nextRevalidationDate", "ASC"]],
      attributes: ["nextRevalidationDate"],
    });

    let nearestRevalidationDays = null;
    if (nearest?.nextRevalidationDate) {
      nearestRevalidationDays = Math.ceil(
        (new Date(nearest.nextRevalidationDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
    }

    res.json({ total, validated, revalidationDue, failed, nearestRevalidationDays });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// ValidationProtocolTemplate CRUD
// ═══════════════════════════════════════════════════════════════

const getTemplates = async (req, res, next) => {
  try {
    const { phase, status, page = 1, limit = 50 } = req.query;
    const where = {};
    if (phase) where.phase = phase;
    if (status) where.status = status;

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await ValidationProtocolTemplate.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("ValidationProtocolTemplate getTemplates error:", e);
    next(ApiError.internal(e.message));
  }
};

const getTemplateOne = async (req, res, next) => {
  try {
    const template = await ValidationProtocolTemplate.findByPk(req.params.id, {
      include: [{ model: ValidationChecklist, as: "checklists" }],
    });
    if (!template) return next(ApiError.notFound("Protocol template not found"));
    res.json(template);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const createTemplate = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    // Auto-number VPT-NNN
    const [maxResult] = await sequelize.query(
      `SELECT MAX(CAST(SUBSTRING("templateNumber" FROM '(\\d+)$') AS INTEGER)) AS max_num FROM validation_protocol_templates WHERE "templateNumber" LIKE 'VPT-%'`
    );
    const maxNum = maxResult?.[0]?.max_num || 0;
    const templateNumber = `VPT-${String(maxNum + 1).padStart(3, "0")}`;

    const template = await ValidationProtocolTemplate.create({
      ...req.body,
      templateNumber,
      createdById: req.body.createdById || req.user.id,
    });

    await logAudit({
      req,
      action: "VALIDATION_TEMPLATE_CREATE",
      entity: "ValidationProtocolTemplate",
      entityId: template.id,
      description: `Created validation protocol template: ${templateNumber}`,
    });

    res.status(201).json(template);
  } catch (e) {
    console.error("ValidationProtocolTemplate createTemplate error:", e);
    next(ApiError.internal(e.message));
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const template = await ValidationProtocolTemplate.findByPk(req.params.id);
    if (!template) return next(ApiError.notFound("Protocol template not found"));

    await template.update(req.body);

    await logAudit({
      req,
      action: "VALIDATION_TEMPLATE_UPDATE",
      entity: "ValidationProtocolTemplate",
      entityId: template.id,
      description: `Updated validation protocol template: ${template.templateNumber}`,
    });

    res.json(template);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// ValidationChecklist operations
// ═══════════════════════════════════════════════════════════════

const getChecklists = async (req, res, next) => {
  try {
    const processValidationId = parseInt(req.params.id);
    if (isNaN(processValidationId)) return next(ApiError.badRequest("Invalid process validation ID"));

    const { phase, status } = req.query;
    const where = { processValidationId };
    if (phase) where.phase = phase;
    if (status) where.status = status;

    const checklists = await ValidationChecklist.findAll({
      where,
      include: [
        { model: ValidationChecklistItem, as: "items", order: [["sortOrder", "ASC"]] },
        { model: ValidationProtocolTemplate, as: "template", attributes: ["id", "templateNumber", "title"] },
      ],
      order: [["createdAt", "ASC"]],
    });

    res.json(checklists);
  } catch (e) {
    console.error("ValidationChecklist getChecklists error:", e);
    next(ApiError.internal(e.message));
  }
};

const createChecklistFromTemplate = async (req, res, next) => {
  try {
    const processValidationId = parseInt(req.params.id);
    if (isNaN(processValidationId)) return next(ApiError.badRequest("Invalid process validation ID"));

    const pv = await ProcessValidation.findByPk(processValidationId);
    if (!pv) return next(ApiError.notFound("Process validation not found"));

    const { templateId } = req.body;
    if (!templateId) return next(ApiError.badRequest("templateId is required"));

    const template = await ValidationProtocolTemplate.findByPk(templateId);
    if (!template) return next(ApiError.notFound("Protocol template not found"));

    // Create checklist from template
    const checklist = await ValidationChecklist.create({
      processValidationId,
      templateId: template.id,
      phase: template.phase,
      title: template.title || `${template.phase} Checklist - ${template.templateNumber}`,
      status: "NOT_STARTED",
    });

    // Create items from template's checklistTemplate JSON
    const templateItems = template.checklistTemplate || [];
    for (let i = 0; i < templateItems.length; i++) {
      const tItem = templateItems[i];
      await ValidationChecklistItem.create({
        checklistId: checklist.id,
        sortOrder: tItem.sortOrder != null ? tItem.sortOrder : i,
        title: tItem.title || `Check item ${i + 1}`,
        description: tItem.description || null,
        acceptanceCriteria: tItem.acceptanceCriteria || "N/A",
        isMandatory: tItem.isMandatory != null ? tItem.isMandatory : true,
        result: "PENDING",
      });
    }

    // Reload with items
    const result = await ValidationChecklist.findByPk(checklist.id, {
      include: [{ model: ValidationChecklistItem, as: "items" }],
    });

    await logAudit({
      req,
      action: "VALIDATION_CHECKLIST_CREATE",
      entity: "ValidationChecklist",
      entityId: checklist.id,
      description: `Created ${template.phase} checklist from template ${template.templateNumber} for PV #${processValidationId}`,
    });

    res.status(201).json(result);
  } catch (e) {
    console.error("ValidationChecklist createChecklistFromTemplate error:", e);
    next(ApiError.internal(e.message));
  }
};

const updateChecklistItem = async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.itemId);
    if (isNaN(itemId)) return next(ApiError.badRequest("Invalid item ID"));

    const item = await ValidationChecklistItem.findByPk(itemId);
    if (!item) return next(ApiError.notFound("Checklist item not found"));

    await item.update(req.body);

    await logAudit({
      req,
      action: "VALIDATION_CHECKLIST_ITEM_UPDATE",
      entity: "ValidationChecklistItem",
      entityId: item.id,
      description: `Updated checklist item: ${item.title}`,
    });

    res.json(item);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const completeChecklist = async (req, res, next) => {
  try {
    const clId = parseInt(req.params.clId);
    if (isNaN(clId)) return next(ApiError.badRequest("Invalid checklist ID"));

    const checklist = await ValidationChecklist.findByPk(clId, {
      include: [{ model: ValidationChecklistItem, as: "items" }],
    });
    if (!checklist) return next(ApiError.notFound("Checklist not found"));

    // Determine overall result: if any mandatory item FAIL => FAILED, else if all done => PASSED
    const items = checklist.items || [];
    const mandatoryItems = items.filter(i => i.isMandatory);
    const hasFailed = mandatoryItems.some(i => i.result === "FAIL");
    const allResolved = items.every(i => i.result !== "PENDING");

    if (!allResolved) {
      return next(ApiError.badRequest("Not all checklist items have been evaluated"));
    }

    const newStatus = hasFailed ? "FAILED" : "PASSED";

    await checklist.update({
      status: newStatus,
      executedById: req.body.executedById || req.user?.id,
      executedAt: new Date(),
      reviewedById: req.body.reviewedById || null,
      reviewedAt: req.body.reviewedById ? new Date() : null,
      notes: req.body.notes || checklist.notes,
    });

    await logAudit({
      req,
      action: "VALIDATION_CHECKLIST_COMPLETE",
      entity: "ValidationChecklist",
      entityId: checklist.id,
      description: `Completed ${checklist.phase} checklist with status: ${newStatus}`,
    });

    res.json(checklist);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

module.exports = {
  getAll, getOne, create, update, getStats,
  getTemplates, getTemplateOne, createTemplate, updateTemplate,
  getChecklists, createChecklistFromTemplate, updateChecklistItem, completeChecklist,
};
