const sequelize = require("../../../db");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");

// ═══════════════════════════════════════════════════════════════
// Quality Control — Hold / Release / NC from operation
// ═══════════════════════════════════════════════════════════════

const hold = async (req, res, next) => {
  try {
    const models = require("../../../models");
    const { WorkOrderUnit } = models;
    if (!WorkOrderUnit) return next(ApiError.badRequest("WorkOrderUnit model not available"));

    const unit = await WorkOrderUnit.findByPk(req.params.unitId);
    if (!unit) return next(ApiError.notFound("Unit not found"));

    const { holdReason } = req.body;

    await unit.update({
      status: "ON_HOLD",
      holdReason: holdReason || null,
    });

    await logAudit({
      req,
      action: "MES_UNIT_HOLD",
      entity: "WorkOrderUnit",
      entityId: unit.id,
      description: `Unit ${unit.serialNumber} placed on hold. Reason: ${holdReason || "N/A"}`,
    });

    res.json(unit);
  } catch (e) {
    console.error("mesQuality hold error:", e);
    next(ApiError.internal(e.message));
  }
};

const release = async (req, res, next) => {
  try {
    const models = require("../../../models");
    const { WorkOrderUnit } = models;
    if (!WorkOrderUnit) return next(ApiError.badRequest("WorkOrderUnit model not available"));

    const unit = await WorkOrderUnit.findByPk(req.params.unitId);
    if (!unit) return next(ApiError.notFound("Unit not found"));
    if (unit.status !== "ON_HOLD") return next(ApiError.badRequest("Unit is not on hold"));

    // Determine the previous state based on context
    const previousStatus = unit.currentStepId ? "IN_PROGRESS" : "QC_PENDING";

    await unit.update({
      status: previousStatus,
      holdReason: null,
    });

    await logAudit({
      req,
      action: "MES_UNIT_RELEASE",
      entity: "WorkOrderUnit",
      entityId: unit.id,
      description: `Unit ${unit.serialNumber} released from hold. New status: ${previousStatus}`,
    });

    res.json(unit);
  } catch (e) {
    console.error("mesQuality release error:", e);
    next(ApiError.internal(e.message));
  }
};

const ncFromOperation = async (req, res, next) => {
  try {
    const models = require("../../../models");
    const { Nonconformity } = models;
    if (!Nonconformity) return next(ApiError.badRequest("Nonconformity model not available"));

    const { unitId, operationRecordId, stepName, description, severity } = req.body;

    const nc = await Nonconformity.create({
      title: `NC from operation: ${stepName || "Unknown step"}`,
      description: description || `Non-conformity detected during operation ${operationRecordId || ""}`,
      source: "PRODUCTION",
      severity: severity || "MINOR",
      status: "OPEN",
      reportedById: req.user?.id,
      reportedAt: new Date(),
    });

    // Link NC to unit if WorkOrderUnit is available
    if (unitId && models.WorkOrderUnit) {
      const unit = await models.WorkOrderUnit.findByPk(unitId);
      if (unit) {
        await unit.update({ ncId: nc.id });
      }
    }

    await logAudit({
      req,
      action: "MES_NC_FROM_OPERATION",
      entity: "Nonconformity",
      entityId: nc.id,
      description: `Created NC from operation: ${nc.title}`,
    });

    res.status(201).json({ id: nc.id, nc });
  } catch (e) {
    console.error("mesQuality ncFromOperation error:", e);
    next(ApiError.internal(e.message));
  }
};

const getHolds = async (req, res, next) => {
  try {
    const models = require("../../../models");
    const { WorkOrderUnit } = models;
    if (!WorkOrderUnit) return next(ApiError.badRequest("WorkOrderUnit model not available"));

    const includeOptions = [];

    // Include WorkOrder (ProductionTask) if available
    if (models.ProductionTask) {
      includeOptions.push({
        model: models.ProductionTask,
        as: "workOrder",
        attributes: ["id", "taskNumber", "productId", "status"],
        required: false,
      });
    }

    const units = await WorkOrderUnit.findAll({
      where: { status: "ON_HOLD" },
      include: includeOptions,
      order: [["updatedAt", "DESC"]],
    });

    res.json(units);
  } catch (e) {
    console.error("mesQuality getHolds error:", e);
    next(ApiError.internal(e.message));
  }
};

module.exports = {
  hold,
  release,
  ncFromOperation,
  getHolds,
};
