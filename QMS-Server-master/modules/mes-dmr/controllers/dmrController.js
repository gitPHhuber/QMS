const models = require("../../../models");
const { DeviceMasterRecord, BOMItem, ProcessRoute, ProcessRouteStep, StepChecklist, Product, User } = models;
const sequelize = require("../../../db");
const { Op } = require("sequelize");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");

// ═══════════════════════════════════════════════════════════════
// DMR CRUD
// ═══════════════════════════════════════════════════════════════

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, productId, search } = req.query;
    const where = {};

    if (status) where.status = status;
    if (productId) where.productId = productId;
    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }

    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const include = [];
    if (Product) include.push({ model: Product, as: 'product' });
    if (User) include.push({ model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] });

    const { count, rows } = await DeviceMasterRecord.findAndCountAll({
      where,
      include,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ rows, count, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("DMR getAll error:", e);
    next(ApiError.internal(e.message));
  }
};

const getOne = async (req, res, next) => {
  try {
    const include = [];

    if (Product) include.push({ model: Product, as: 'product' });
    if (User) {
      include.push({ model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] });
      include.push({ model: User, as: 'approvedBy', attributes: ['id', 'firstName', 'lastName', 'email'] });
    }

    include.push({
      model: BOMItem,
      as: 'bomItems',
      order: [['itemNumber', 'ASC']],
    });

    include.push({
      model: ProcessRoute,
      as: 'routes',
      include: [
        {
          model: ProcessRouteStep,
          as: 'steps',
          include: [
            {
              model: StepChecklist,
              as: 'checklist',
            },
          ],
        },
      ],
    });

    const dmr = await DeviceMasterRecord.findByPk(req.params.id, {
      include,
      order: [
        [{ model: BOMItem, as: 'bomItems' }, 'itemNumber', 'ASC'],
        [{ model: ProcessRoute, as: 'routes' }, { model: ProcessRouteStep, as: 'steps' }, 'stepOrder', 'ASC'],
        [{ model: ProcessRoute, as: 'routes' }, { model: ProcessRouteStep, as: 'steps' }, { model: StepChecklist, as: 'checklist' }, 'itemOrder', 'ASC'],
      ],
    });

    if (!dmr) return next(ApiError.notFound("DMR not found"));
    res.json(dmr);
  } catch (e) {
    console.error("DMR getOne error:", e);
    next(ApiError.internal(e.message));
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const { productId, title } = req.body;
    if (!productId) return next(ApiError.badRequest("productId is required"));
    if (!title) return next(ApiError.badRequest("title is required"));

    // Validate product exists
    if (Product) {
      const product = await Product.findByPk(productId);
      if (!product) return next(ApiError.notFound("Product not found"));
    }

    // Auto-generate dmrNumber
    const year = new Date().getFullYear();
    const count = await DeviceMasterRecord.count({
      where: { dmrNumber: { [Op.like]: `DMR-${year}-%` } },
    });
    const dmrNumber = `DMR-${year}-${String(count + 1).padStart(3, '0')}`;

    const dmr = await DeviceMasterRecord.create({
      ...req.body,
      dmrNumber,
      createdById: req.user.id,
    });

    await logAudit({
      req,
      action: "DMR_CREATE",
      entity: "DeviceMasterRecord",
      entityId: dmr.id,
      description: `Created DMR: ${dmrNumber}`,
    });

    res.status(201).json(dmr);
  } catch (e) {
    console.error("DMR create error:", e);
    next(ApiError.internal(e.message));
  }
};

const update = async (req, res, next) => {
  try {
    const dmr = await DeviceMasterRecord.findByPk(req.params.id);
    if (!dmr) return next(ApiError.notFound("DMR not found"));
    if (dmr.status !== "DRAFT") {
      return next(ApiError.badRequest("Only DRAFT DMRs can be edited"));
    }

    await dmr.update(req.body);

    await logAudit({
      req,
      action: "DMR_UPDATE",
      entity: "DeviceMasterRecord",
      entityId: dmr.id,
      description: `Updated DMR: ${dmr.dmrNumber}`,
    });

    res.json(dmr);
  } catch (e) {
    console.error("DMR update error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Status transitions
// ═══════════════════════════════════════════════════════════════

const submitReview = async (req, res, next) => {
  try {
    const dmr = await DeviceMasterRecord.findByPk(req.params.id);
    if (!dmr) return next(ApiError.notFound("DMR not found"));
    if (dmr.status !== "DRAFT") {
      return next(ApiError.badRequest("Only DRAFT DMRs can be submitted for review"));
    }

    await dmr.update({ status: "REVIEW" });

    await logAudit({
      req,
      action: "DMR_SUBMIT_REVIEW",
      entity: "DeviceMasterRecord",
      entityId: dmr.id,
      description: `Submitted DMR for review: ${dmr.dmrNumber}`,
    });

    res.json(dmr);
  } catch (e) {
    console.error("DMR submitReview error:", e);
    next(ApiError.internal(e.message));
  }
};

const approve = async (req, res, next) => {
  try {
    const dmr = await DeviceMasterRecord.findByPk(req.params.id);
    if (!dmr) return next(ApiError.notFound("DMR not found"));
    if (dmr.status !== "REVIEW") {
      return next(ApiError.badRequest("Only DMRs in REVIEW status can be approved"));
    }

    const now = new Date();
    await dmr.update({
      status: "APPROVED",
      approvedById: req.user.id,
      approvedAt: now,
      effectiveDate: req.body.effectiveDate || now.toISOString().split("T")[0],
    });

    await logAudit({
      req,
      action: "DMR_APPROVE",
      entity: "DeviceMasterRecord",
      entityId: dmr.id,
      description: `Approved DMR: ${dmr.dmrNumber}`,
    });

    res.json(dmr);
  } catch (e) {
    console.error("DMR approve error:", e);
    next(ApiError.internal(e.message));
  }
};

const obsolete = async (req, res, next) => {
  try {
    const dmr = await DeviceMasterRecord.findByPk(req.params.id);
    if (!dmr) return next(ApiError.notFound("DMR not found"));
    if (dmr.status !== "APPROVED") {
      return next(ApiError.badRequest("Only APPROVED DMRs can be marked obsolete"));
    }

    await dmr.update({ status: "OBSOLETE" });

    await logAudit({
      req,
      action: "DMR_OBSOLETE",
      entity: "DeviceMasterRecord",
      entityId: dmr.id,
      description: `Marked DMR as obsolete: ${dmr.dmrNumber}`,
    });

    res.json(dmr);
  } catch (e) {
    console.error("DMR obsolete error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Clone & Versions
// ═══════════════════════════════════════════════════════════════

const clone = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const original = await DeviceMasterRecord.findByPk(req.params.id, {
      include: [
        { model: BOMItem, as: 'bomItems' },
        {
          model: ProcessRoute,
          as: 'routes',
          include: [
            {
              model: ProcessRouteStep,
              as: 'steps',
              include: [{ model: StepChecklist, as: 'checklist' }],
            },
          ],
        },
      ],
      transaction: t,
    });

    if (!original) {
      await t.rollback();
      return next(ApiError.notFound("DMR not found"));
    }

    // Generate new dmrNumber
    const year = new Date().getFullYear();
    const count = await DeviceMasterRecord.count({
      where: { dmrNumber: { [Op.like]: `DMR-${year}-%` } },
      transaction: t,
    });
    const dmrNumber = `DMR-${year}-${String(count + 1).padStart(3, '0')}`;

    // Increment version
    const versionParts = original.version.split(".");
    const majorVersion = parseInt(versionParts[0]) || 1;
    const newVersion = `${majorVersion + 1}.0`;

    // Clone DMR
    const newDmr = await DeviceMasterRecord.create({
      dmrNumber,
      productId: original.productId,
      version: newVersion,
      title: original.title,
      description: original.description,
      status: "DRAFT",
      previousVersionId: original.id,
      changeRequestId: req.body.changeRequestId || null,
      createdById: req.user.id,
      notes: original.notes,
    }, { transaction: t });

    // Clone BOM items
    if (original.bomItems && original.bomItems.length > 0) {
      for (const item of original.bomItems) {
        await BOMItem.create({
          dmrId: newDmr.id,
          itemNumber: item.itemNumber,
          partNumber: item.partNumber,
          description: item.description,
          category: item.category,
          quantityPer: item.quantityPer,
          unit: item.unit,
          requiresLotTracking: item.requiresLotTracking,
          requiresSerialTracking: item.requiresSerialTracking,
          approvedSupplierId: item.approvedSupplierId,
          alternatePartNumbers: item.alternatePartNumbers,
          specifications: item.specifications,
          notes: item.notes,
        }, { transaction: t });
      }
    }

    // Clone routes, steps, and checklists
    if (original.routes && original.routes.length > 0) {
      for (const route of original.routes) {
        const newRoute = await ProcessRoute.create({
          dmrId: newDmr.id,
          routeCode: route.routeCode,
          name: route.name,
          description: route.description,
          version: route.version,
          isActive: route.isActive,
          estimatedCycleTime: route.estimatedCycleTime,
          createdById: req.user.id,
        }, { transaction: t });

        if (route.steps && route.steps.length > 0) {
          for (const step of route.steps) {
            const newStep = await ProcessRouteStep.create({
              routeId: newRoute.id,
              stepOrder: step.stepOrder,
              stepCode: step.stepCode,
              name: step.name,
              description: step.description,
              stepType: step.stepType,
              workInstructions: step.workInstructions,
              documentIds: step.documentIds,
              requiredEquipmentIds: step.requiredEquipmentIds,
              requiredTrainingIds: step.requiredTrainingIds,
              estimatedDuration: step.estimatedDuration,
              isInspectionGate: step.isInspectionGate,
              requiresDualSignoff: step.requiresDualSignoff,
              isGoNoGo: step.isGoNoGo,
              isSpecialProcess: step.isSpecialProcess,
              processValidationId: step.processValidationId,
              notes: step.notes,
            }, { transaction: t });

            if (step.checklist && step.checklist.length > 0) {
              for (const check of step.checklist) {
                await StepChecklist.create({
                  stepId: newStep.id,
                  itemOrder: check.itemOrder,
                  question: check.question,
                  responseType: check.responseType,
                  nominalValue: check.nominalValue,
                  lowerLimit: check.lowerLimit,
                  upperLimit: check.upperLimit,
                  unit: check.unit,
                  options: check.options,
                  isMandatory: check.isMandatory,
                  isAutoHold: check.isAutoHold,
                  notes: check.notes,
                }, { transaction: t });
              }
            }
          }
        }
      }
    }

    await t.commit();

    await logAudit({
      req,
      action: "DMR_CLONE",
      entity: "DeviceMasterRecord",
      entityId: newDmr.id,
      description: `Cloned DMR ${original.dmrNumber} → ${dmrNumber} (v${newVersion})`,
    });

    res.status(201).json(newDmr);
  } catch (e) {
    await t.rollback();
    console.error("DMR clone error:", e);
    next(ApiError.internal(e.message));
  }
};

const getVersions = async (req, res, next) => {
  try {
    const dmr = await DeviceMasterRecord.findByPk(req.params.id);
    if (!dmr) return next(ApiError.notFound("DMR not found"));

    const versions = [dmr];
    let currentId = dmr.previousVersionId;

    while (currentId) {
      const prev = await DeviceMasterRecord.findByPk(currentId);
      if (!prev) break;
      versions.push(prev);
      currentId = prev.previousVersionId;
    }

    res.json(versions);
  } catch (e) {
    console.error("DMR getVersions error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// BOM sub-CRUD
// ═══════════════════════════════════════════════════════════════

const addBomItem = async (req, res, next) => {
  try {
    const dmrId = parseInt(req.params.id);
    const dmr = await DeviceMasterRecord.findByPk(dmrId);
    if (!dmr) return next(ApiError.notFound("DMR not found"));
    if (dmr.status !== "DRAFT") {
      return next(ApiError.badRequest("BOM items can only be added to DRAFT DMRs"));
    }

    const item = await BOMItem.create({
      ...req.body,
      dmrId,
    });

    await logAudit({
      req,
      action: "DMR_BOM_ADD",
      entity: "BOMItem",
      entityId: item.id,
      description: `Added BOM item to DMR ${dmr.dmrNumber}: ${item.partNumber}`,
    });

    res.status(201).json(item);
  } catch (e) {
    console.error("DMR addBomItem error:", e);
    next(ApiError.internal(e.message));
  }
};

const updateBomItem = async (req, res, next) => {
  try {
    const bomId = parseInt(req.params.bomId);
    const item = await BOMItem.findByPk(bomId);
    if (!item) return next(ApiError.notFound("BOM item not found"));

    const dmr = await DeviceMasterRecord.findByPk(item.dmrId);
    if (!dmr) return next(ApiError.notFound("DMR not found"));
    if (dmr.status !== "DRAFT") {
      return next(ApiError.badRequest("BOM items can only be updated on DRAFT DMRs"));
    }

    await item.update(req.body);

    await logAudit({
      req,
      action: "DMR_BOM_UPDATE",
      entity: "BOMItem",
      entityId: item.id,
      description: `Updated BOM item: ${item.partNumber}`,
    });

    res.json(item);
  } catch (e) {
    console.error("DMR updateBomItem error:", e);
    next(ApiError.internal(e.message));
  }
};

const deleteBomItem = async (req, res, next) => {
  try {
    const bomId = parseInt(req.params.bomId);
    const item = await BOMItem.findByPk(bomId);
    if (!item) return next(ApiError.notFound("BOM item not found"));

    const dmr = await DeviceMasterRecord.findByPk(item.dmrId);
    if (!dmr) return next(ApiError.notFound("DMR not found"));
    if (dmr.status !== "DRAFT") {
      return next(ApiError.badRequest("BOM items can only be deleted from DRAFT DMRs"));
    }

    await item.destroy();

    await logAudit({
      req,
      action: "DMR_BOM_DELETE",
      entity: "BOMItem",
      entityId: bomId,
      description: `Deleted BOM item from DMR ${dmr.dmrNumber}: ${item.partNumber}`,
    });

    res.json({ message: "BOM item deleted" });
  } catch (e) {
    console.error("DMR deleteBomItem error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Route sub-CRUD
// ═══════════════════════════════════════════════════════════════

const addRoute = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const dmrId = parseInt(req.params.id);
    const dmr = await DeviceMasterRecord.findByPk(dmrId);
    if (!dmr) return next(ApiError.notFound("DMR not found"));
    if (dmr.status !== "DRAFT") {
      return next(ApiError.badRequest("Routes can only be added to DRAFT DMRs"));
    }

    const route = await ProcessRoute.create({
      ...req.body,
      dmrId,
      createdById: req.user.id,
    });

    await logAudit({
      req,
      action: "DMR_ROUTE_ADD",
      entity: "ProcessRoute",
      entityId: route.id,
      description: `Added route to DMR ${dmr.dmrNumber}: ${route.name}`,
    });

    res.status(201).json(route);
  } catch (e) {
    console.error("DMR addRoute error:", e);
    next(ApiError.internal(e.message));
  }
};

const updateRoute = async (req, res, next) => {
  try {
    const routeId = parseInt(req.params.routeId);
    const route = await ProcessRoute.findByPk(routeId);
    if (!route) return next(ApiError.notFound("Route not found"));

    const dmr = await DeviceMasterRecord.findByPk(route.dmrId);
    if (!dmr) return next(ApiError.notFound("DMR not found"));
    if (dmr.status !== "DRAFT") {
      return next(ApiError.badRequest("Routes can only be updated on DRAFT DMRs"));
    }

    await route.update(req.body);

    await logAudit({
      req,
      action: "DMR_ROUTE_UPDATE",
      entity: "ProcessRoute",
      entityId: route.id,
      description: `Updated route: ${route.name}`,
    });

    res.json(route);
  } catch (e) {
    console.error("DMR updateRoute error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Step sub-CRUD
// ═══════════════════════════════════════════════════════════════

const addStep = async (req, res, next) => {
  try {
    const routeId = parseInt(req.params.routeId);
    const route = await ProcessRoute.findByPk(routeId);
    if (!route) return next(ApiError.notFound("Route not found"));

    const dmr = await DeviceMasterRecord.findByPk(route.dmrId);
    if (!dmr) return next(ApiError.notFound("DMR not found"));
    if (dmr.status !== "DRAFT") {
      return next(ApiError.badRequest("Steps can only be added to DRAFT DMRs"));
    }

    const step = await ProcessRouteStep.create({
      ...req.body,
      routeId,
    });

    await logAudit({
      req,
      action: "DMR_STEP_ADD",
      entity: "ProcessRouteStep",
      entityId: step.id,
      description: `Added step to route ${route.name}: ${step.name}`,
    });

    res.status(201).json(step);
  } catch (e) {
    console.error("DMR addStep error:", e);
    next(ApiError.internal(e.message));
  }
};

const updateStep = async (req, res, next) => {
  try {
    const stepId = parseInt(req.params.stepId);
    const step = await ProcessRouteStep.findByPk(stepId);
    if (!step) return next(ApiError.notFound("Step not found"));

    const route = await ProcessRoute.findByPk(step.routeId);
    if (!route) return next(ApiError.notFound("Route not found"));

    const dmr = await DeviceMasterRecord.findByPk(route.dmrId);
    if (!dmr) return next(ApiError.notFound("DMR not found"));
    if (dmr.status !== "DRAFT") {
      return next(ApiError.badRequest("Steps can only be updated on DRAFT DMRs"));
    }

    await step.update(req.body);

    await logAudit({
      req,
      action: "DMR_STEP_UPDATE",
      entity: "ProcessRouteStep",
      entityId: step.id,
      description: `Updated step: ${step.name}`,
    });

    res.json(step);
  } catch (e) {
    console.error("DMR updateStep error:", e);
    next(ApiError.internal(e.message));
  }
};

const deleteStep = async (req, res, next) => {
  try {
    const stepId = parseInt(req.params.stepId);
    const step = await ProcessRouteStep.findByPk(stepId);
    if (!step) return next(ApiError.notFound("Step not found"));

    const route = await ProcessRoute.findByPk(step.routeId);
    if (!route) return next(ApiError.notFound("Route not found"));

    const dmr = await DeviceMasterRecord.findByPk(route.dmrId);
    if (!dmr) return next(ApiError.notFound("DMR not found"));
    if (dmr.status !== "DRAFT") {
      return next(ApiError.badRequest("Steps can only be deleted from DRAFT DMRs"));
    }

    await step.destroy();

    await logAudit({
      req,
      action: "DMR_STEP_DELETE",
      entity: "ProcessRouteStep",
      entityId: stepId,
      description: `Deleted step from route ${route.name}: ${step.name}`,
    });

    res.json({ message: "Step deleted" });
  } catch (e) {
    console.error("DMR deleteStep error:", e);
    next(ApiError.internal(e.message));
  }
};

const reorderSteps = async (req, res, next) => {
  try {
    const stepId = parseInt(req.params.stepId);
    const step = await ProcessRouteStep.findByPk(stepId);
    if (!step) return next(ApiError.notFound("Step not found"));

    const route = await ProcessRoute.findByPk(step.routeId);
    if (!route) return next(ApiError.notFound("Route not found"));

    const dmr = await DeviceMasterRecord.findByPk(route.dmrId);
    if (!dmr) return next(ApiError.notFound("DMR not found"));
    if (dmr.status !== "DRAFT") {
      return next(ApiError.badRequest("Steps can only be reordered on DRAFT DMRs"));
    }

    const { steps } = req.body; // Array of { stepId, stepOrder }
    if (!Array.isArray(steps)) {
      return next(ApiError.badRequest("steps array is required"));
    }

    const t = await sequelize.transaction();
    try {
      for (const item of steps) {
        await ProcessRouteStep.update(
          { stepOrder: item.stepOrder },
          { where: { id: item.stepId }, transaction: t }
        );
      }
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    const updatedSteps = await ProcessRouteStep.findAll({
      where: { routeId: route.id },
      order: [['stepOrder', 'ASC']],
    });

    res.json(updatedSteps);
  } catch (e) {
    console.error("DMR reorderSteps error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Checklist sub-CRUD
// ═══════════════════════════════════════════════════════════════

const addChecklist = async (req, res, next) => {
  try {
    const stepId = parseInt(req.params.stepId);
    const step = await ProcessRouteStep.findByPk(stepId);
    if (!step) return next(ApiError.notFound("Step not found"));

    const route = await ProcessRoute.findByPk(step.routeId);
    if (!route) return next(ApiError.notFound("Route not found"));

    const dmr = await DeviceMasterRecord.findByPk(route.dmrId);
    if (!dmr) return next(ApiError.notFound("DMR not found"));
    if (dmr.status !== "DRAFT") {
      return next(ApiError.badRequest("Checklist items can only be added to DRAFT DMRs"));
    }

    const checkItem = await StepChecklist.create({
      ...req.body,
      stepId,
    });

    await logAudit({
      req,
      action: "DMR_CHECKLIST_ADD",
      entity: "StepChecklist",
      entityId: checkItem.id,
      description: `Added checklist item to step ${step.name}: ${checkItem.question}`,
    });

    res.status(201).json(checkItem);
  } catch (e) {
    console.error("DMR addChecklist error:", e);
    next(ApiError.internal(e.message));
  }
};

const updateChecklist = async (req, res, next) => {
  try {
    const checkId = parseInt(req.params.checkId);
    const checkItem = await StepChecklist.findByPk(checkId);
    if (!checkItem) return next(ApiError.notFound("Checklist item not found"));

    const step = await ProcessRouteStep.findByPk(checkItem.stepId);
    if (!step) return next(ApiError.notFound("Step not found"));

    const route = await ProcessRoute.findByPk(step.routeId);
    if (!route) return next(ApiError.notFound("Route not found"));

    const dmr = await DeviceMasterRecord.findByPk(route.dmrId);
    if (!dmr) return next(ApiError.notFound("DMR not found"));
    if (dmr.status !== "DRAFT") {
      return next(ApiError.badRequest("Checklist items can only be updated on DRAFT DMRs"));
    }

    await checkItem.update(req.body);

    await logAudit({
      req,
      action: "DMR_CHECKLIST_UPDATE",
      entity: "StepChecklist",
      entityId: checkItem.id,
      description: `Updated checklist item: ${checkItem.question}`,
    });

    res.json(checkItem);
  } catch (e) {
    console.error("DMR updateChecklist error:", e);
    next(ApiError.internal(e.message));
  }
};

const deleteChecklist = async (req, res, next) => {
  try {
    const checkId = parseInt(req.params.checkId);
    const checkItem = await StepChecklist.findByPk(checkId);
    if (!checkItem) return next(ApiError.notFound("Checklist item not found"));

    const step = await ProcessRouteStep.findByPk(checkItem.stepId);
    if (!step) return next(ApiError.notFound("Step not found"));

    const route = await ProcessRoute.findByPk(step.routeId);
    if (!route) return next(ApiError.notFound("Route not found"));

    const dmr = await DeviceMasterRecord.findByPk(route.dmrId);
    if (!dmr) return next(ApiError.notFound("DMR not found"));
    if (dmr.status !== "DRAFT") {
      return next(ApiError.badRequest("Checklist items can only be deleted from DRAFT DMRs"));
    }

    await checkItem.destroy();

    await logAudit({
      req,
      action: "DMR_CHECKLIST_DELETE",
      entity: "StepChecklist",
      entityId: checkId,
      description: `Deleted checklist item from step ${step.name}: ${checkItem.question}`,
    });

    res.json({ message: "Checklist item deleted" });
  } catch (e) {
    console.error("DMR deleteChecklist error:", e);
    next(ApiError.internal(e.message));
  }
};

module.exports = {
  getAll,
  getOne,
  create,
  update,
  submitReview,
  approve,
  obsolete,
  clone,
  getVersions,
  addBomItem,
  updateBomItem,
  deleteBomItem,
  addRoute,
  updateRoute,
  addStep,
  updateStep,
  deleteStep,
  reorderSteps,
  addChecklist,
  updateChecklist,
  deleteChecklist,
};
