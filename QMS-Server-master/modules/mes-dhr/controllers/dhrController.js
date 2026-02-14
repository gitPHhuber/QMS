const { DeviceHistoryRecord, DhrMaterialTrace, DhrProcessStep } = require("../models/Dhr");
const sequelize = require("../../../db");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");

// ═══════════════════════════════════════════════════════════════
// DHR CRUD
// ═══════════════════════════════════════════════════════════════

const getAll = async (req, res, next) => {
  try {
    const { productId, status, lotNumber, serialNumber, page = 1, limit = 50 } = req.query;
    const where = {};

    if (productId) where.productId = productId;
    if (status) where.status = status;
    if (lotNumber) where.lotNumber = lotNumber;
    if (serialNumber) where.serialNumber = serialNumber;

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await DeviceHistoryRecord.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("DHR getAll error:", e);
    next(ApiError.internal(e.message));
  }
};

const getOne = async (req, res, next) => {
  try {
    const dhr = await DeviceHistoryRecord.findByPk(req.params.id, {
      include: [
        { model: DhrMaterialTrace, as: "materials" },
        { model: DhrProcessStep, as: "steps", order: [["stepOrder", "ASC"]] },
      ],
    });
    if (!dhr) return next(ApiError.notFound("DHR not found"));
    res.json(dhr);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const year = new Date().getFullYear();
    const [maxResult] = await sequelize.query(
      `SELECT MAX(CAST(SUBSTRING("dhrNumber" FROM '(\\d+)$') AS INTEGER)) AS max_num FROM device_history_records WHERE "dhrNumber" LIKE 'DHR-${year}-%'`
    );
    const maxNum = maxResult?.[0]?.max_num || 0;
    const dhrNumber = `DHR-${year}-${String(maxNum + 1).padStart(3, "0")}`;

    const dhr = await DeviceHistoryRecord.create({
      ...req.body,
      dhrNumber,
    });

    await logAudit({
      req,
      action: "DHR_CREATE",
      entity: "DeviceHistoryRecord",
      entityId: dhr.id,
      description: `Created DHR: ${dhrNumber}`,
    });

    res.status(201).json(dhr);
  } catch (e) {
    console.error("DHR create error:", e);
    next(ApiError.internal(e.message));
  }
};

const update = async (req, res, next) => {
  try {
    const dhr = await DeviceHistoryRecord.findByPk(req.params.id);
    if (!dhr) return next(ApiError.notFound("DHR not found"));

    await dhr.update(req.body);

    await logAudit({
      req,
      action: "DHR_UPDATE",
      entity: "DeviceHistoryRecord",
      entityId: dhr.id,
      description: `Updated DHR: ${dhr.dhrNumber}`,
    });

    res.json(dhr);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Material Trace sub-CRUD
// ═══════════════════════════════════════════════════════════════

const addMaterial = async (req, res, next) => {
  try {
    const dhrId = parseInt(req.params.id);
    const dhr = await DeviceHistoryRecord.findByPk(dhrId);
    if (!dhr) return next(ApiError.notFound("DHR not found"));

    const material = await DhrMaterialTrace.create({
      ...req.body,
      dhrId,
    });

    await logAudit({
      req,
      action: "DHR_MATERIAL_ADD",
      entity: "DhrMaterialTrace",
      entityId: material.id,
      description: `Added material to DHR ${dhr.dhrNumber}: ${material.description}`,
    });

    res.status(201).json(material);
  } catch (e) {
    console.error("DHR addMaterial error:", e);
    next(ApiError.internal(e.message));
  }
};

const updateMaterial = async (req, res, next) => {
  try {
    const matId = parseInt(req.params.matId);
    const material = await DhrMaterialTrace.findByPk(matId);
    if (!material) return next(ApiError.notFound("Material trace not found"));

    await material.update(req.body);

    await logAudit({
      req,
      action: "DHR_MATERIAL_UPDATE",
      entity: "DhrMaterialTrace",
      entityId: material.id,
      description: `Updated material trace: ${material.description}`,
    });

    res.json(material);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Process Step sub-CRUD
// ═══════════════════════════════════════════════════════════════

const addStep = async (req, res, next) => {
  try {
    const dhrId = parseInt(req.params.id);
    const dhr = await DeviceHistoryRecord.findByPk(dhrId);
    if (!dhr) return next(ApiError.notFound("DHR not found"));

    const step = await DhrProcessStep.create({
      ...req.body,
      dhrId,
    });

    await logAudit({
      req,
      action: "DHR_STEP_ADD",
      entity: "DhrProcessStep",
      entityId: step.id,
      description: `Added process step to DHR ${dhr.dhrNumber}: ${step.stepName}`,
    });

    res.status(201).json(step);
  } catch (e) {
    console.error("DHR addStep error:", e);
    next(ApiError.internal(e.message));
  }
};

const updateStep = async (req, res, next) => {
  try {
    const stepId = parseInt(req.params.stepId);
    const step = await DhrProcessStep.findByPk(stepId);
    if (!step) return next(ApiError.notFound("Process step not found"));

    await step.update(req.body);

    await logAudit({
      req,
      action: "DHR_STEP_UPDATE",
      entity: "DhrProcessStep",
      entityId: step.id,
      description: `Updated process step: ${step.stepName}`,
    });

    res.json(step);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Statistics
// ═══════════════════════════════════════════════════════════════

const getStats = async (req, res, next) => {
  try {
    const total = await DeviceHistoryRecord.count();

    const byStatus = await DeviceHistoryRecord.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    const byProduct = await DeviceHistoryRecord.findAll({
      attributes: [
        "productId",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["productId"],
      raw: true,
    });

    res.json({ total, byStatus, byProduct });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Forward Trace — full traceability chain
// ═══════════════════════════════════════════════════════════════

const getTraceForward = async (req, res, next) => {
  try {
    const dhr = await DeviceHistoryRecord.findByPk(req.params.id, {
      include: [
        { model: DhrMaterialTrace, as: "materials" },
        { model: DhrProcessStep, as: "steps", order: [["stepOrder", "ASC"]] },
      ],
    });
    if (!dhr) return next(ApiError.notFound("DHR not found"));

    // Build trace chain
    const trace = {
      dhr: {
        id: dhr.id,
        dhrNumber: dhr.dhrNumber,
        productId: dhr.productId,
        serialNumber: dhr.serialNumber,
        lotNumber: dhr.lotNumber,
        batchSize: dhr.batchSize,
        status: dhr.status,
        productionStartDate: dhr.productionStartDate,
        productionEndDate: dhr.productionEndDate,
        dmrVersion: dhr.dmrVersion,
      },
      materials: dhr.materials.map((m) => ({
        id: m.id,
        materialType: m.materialType,
        description: m.description,
        partNumber: m.partNumber,
        lotNumber: m.lotNumber,
        serialNumber: m.serialNumber,
        supplierId: m.supplierId,
        supplierName: m.supplierName,
        quantity: m.quantity,
        unit: m.unit,
      })),
      suppliers: [
        ...new Set(
          dhr.materials
            .filter((m) => m.supplierName)
            .map((m) => JSON.stringify({ id: m.supplierId, name: m.supplierName }))
        ),
      ].map((s) => JSON.parse(s)),
      steps: dhr.steps.map((s) => ({
        id: s.id,
        stepOrder: s.stepOrder,
        stepName: s.stepName,
        result: s.result,
        operatorId: s.operatorId,
        equipmentId: s.equipmentId,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        measurements: s.measurements,
        linkedNcId: s.linkedNcId,
      })),
    };

    res.json(trace);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

module.exports = {
  getAll,
  getOne,
  create,
  update,
  addMaterial,
  updateMaterial,
  addStep,
  updateStep,
  getStats,
  getTraceForward,
};
