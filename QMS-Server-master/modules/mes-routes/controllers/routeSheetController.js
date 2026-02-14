const models = require("../../../models");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");
const OperationService = require("../services/OperationService");
const { Op } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

/**
 * Standard includes for OperationRecord queries.
 */
function operationIncludes() {
  const includes = [];

  if (models.ChecklistResponse) {
    includes.push({ model: models.ChecklistResponse, as: "responses" });
  }
  if (models.ProcessRouteStep) {
    includes.push({ model: models.ProcessRouteStep, as: "routeStep" });
  }
  if (models.User) {
    includes.push(
      { model: models.User, as: "operator", attributes: ["id", "name", "email"] },
      { model: models.User, as: "inspector", attributes: ["id", "name", "email"] }
    );
  }

  return includes;
}

// ═══════════════════════════════════════════════════════════════
// GET — Route-sheet queries
// ═══════════════════════════════════════════════════════════════

/**
 * GET /by-serial/:serialNumber
 * Find all operations for a unit identified by serial number.
 */
const getBySerial = async (req, res, next) => {
  try {
    const { serialNumber } = req.params;

    if (!models.WorkOrderUnit) {
      return next(ApiError.internal("WorkOrderUnit model not available"));
    }

    const unit = await models.WorkOrderUnit.findOne({
      where: { serialNumber },
    });
    if (!unit) return next(ApiError.notFound("Unit not found for serial number: " + serialNumber));

    const operations = await models.OperationRecord.findAll({
      where: { unitId: unit.id },
      order: [["stepOrder", "ASC"]],
      include: operationIncludes(),
    });

    res.json({ unit, operations });
  } catch (e) {
    console.error("RouteSheet getBySerial error:", e);
    next(ApiError.internal(e.message));
  }
};

/**
 * GET /by-unit/:unitId
 * Find all operations for a given unit id.
 */
const getByUnit = async (req, res, next) => {
  try {
    const unitId = parseInt(req.params.unitId);

    let unit = null;
    if (models.WorkOrderUnit) {
      unit = await models.WorkOrderUnit.findByPk(unitId);
      if (!unit) return next(ApiError.notFound("Unit not found"));
    }

    const operations = await models.OperationRecord.findAll({
      where: { unitId },
      order: [["stepOrder", "ASC"]],
      include: operationIncludes(),
    });

    res.json({ unit, operations });
  } catch (e) {
    console.error("RouteSheet getByUnit error:", e);
    next(ApiError.internal(e.message));
  }
};

/**
 * GET /operations/:id
 * Get a single operation with all includes.
 */
const getOperation = async (req, res, next) => {
  try {
    const operation = await models.OperationRecord.findByPk(req.params.id, {
      include: operationIncludes(),
    });
    if (!operation) return next(ApiError.notFound("Operation not found"));
    res.json(operation);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

/**
 * GET /active
 * Find all operations currently in progress for the authenticated user.
 */
const getActive = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const operations = await models.OperationRecord.findAll({
      where: {
        operatorId: req.user.id,
        status: "IN_PROGRESS",
      },
      order: [["startedAt", "DESC"]],
      include: operationIncludes(),
    });

    res.json(operations);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

/**
 * GET /workstation/:sectionId
 * Find operations for units assigned to a given section / workstation.
 */
const getWorkstation = async (req, res, next) => {
  try {
    const sectionId = parseInt(req.params.sectionId);

    if (!models.WorkOrderUnit) {
      return next(ApiError.internal("WorkOrderUnit model not available"));
    }

    // Find units assigned to this section
    const units = await models.WorkOrderUnit.findAll({
      where: { sectionId },
      attributes: ["id"],
    });

    const unitIds = units.map((u) => u.id);
    if (unitIds.length === 0) return res.json([]);

    const operations = await models.OperationRecord.findAll({
      where: {
        unitId: { [Op.in]: unitIds },
        status: { [Op.in]: ["PENDING", "IN_PROGRESS"] },
      },
      order: [["stepOrder", "ASC"]],
      include: operationIncludes(),
    });

    res.json(operations);
  } catch (e) {
    console.error("RouteSheet getWorkstation error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// POST — Operation lifecycle
// ═══════════════════════════════════════════════════════════════

/**
 * POST /operations/:id/start
 * Start an operation: verify status, check gate, check equipment calibration.
 */
const startOperation = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const operation = await models.OperationRecord.findByPk(req.params.id, {
      include: models.ProcessRouteStep
        ? [{ model: models.ProcessRouteStep, as: "routeStep" }]
        : [],
    });
    if (!operation) return next(ApiError.notFound("Operation not found"));

    if (operation.status !== "PENDING") {
      return next(ApiError.badRequest(`Cannot start operation with status: ${operation.status}`));
    }

    // Gate check: if previous step has isGoNoGo, it must be COMPLETED
    const gateResult = await OperationService.checkGate(operation.unitId, operation.stepOrder);
    if (!gateResult.ok) {
      return next(
        ApiError.badRequest(
          `Gate check failed: step "${gateResult.blockingStep.stepName}" (order ${gateResult.blockingStep.stepOrder}) must be completed first`
        )
      );
    }

    // Check equipment calibration if route step has requiredEquipmentIds
    if (operation.routeStep && operation.routeStep.requiredEquipmentIds && models.Equipment) {
      const equipmentIds = Array.isArray(operation.routeStep.requiredEquipmentIds)
        ? operation.routeStep.requiredEquipmentIds
        : [];

      for (const eqId of equipmentIds) {
        const equipment = await models.Equipment.findByPk(eqId);
        if (equipment && equipment.calibrationStatus !== "VALID") {
          return next(
            ApiError.badRequest(
              `Equipment #${eqId} (${equipment.name || ""}) calibration is not valid: ${equipment.calibrationStatus}`
            )
          );
        }
      }
    }

    // Update operation
    await operation.update({
      status: "IN_PROGRESS",
      operatorId: req.user.id,
      startedAt: new Date(),
      equipmentId: req.body.equipmentId || operation.equipmentId,
      equipmentCalibrationOk: req.body.equipmentCalibrationOk != null
        ? req.body.equipmentCalibrationOk
        : operation.equipmentCalibrationOk,
    });

    // Update unit status and currentStepId
    if (models.WorkOrderUnit) {
      const unit = await models.WorkOrderUnit.findByPk(operation.unitId);
      if (unit) {
        await unit.update({
          status: "IN_PROGRESS",
          currentStepId: operation.routeStepId,
        });
      }
    }

    await logAudit({
      req,
      action: "OPERATION_START",
      entity: "OperationRecord",
      entityId: operation.id,
      description: `Started operation "${operation.stepName}" (step ${operation.stepOrder}) for unit #${operation.unitId}`,
      metadata: {
        unitId: operation.unitId,
        workOrderId: operation.workOrderId,
        stepOrder: operation.stepOrder,
        operatorId: req.user.id,
      },
    });

    // Reload with full includes
    const updated = await models.OperationRecord.findByPk(operation.id, {
      include: operationIncludes(),
    });

    res.json(updated);
  } catch (e) {
    console.error("RouteSheet startOperation error:", e);
    next(ApiError.internal(e.message));
  }
};

/**
 * POST /operations/:id/respond
 * Accept an array of checklist responses for an operation.
 */
const respond = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const operation = await models.OperationRecord.findByPk(req.params.id);
    if (!operation) return next(ApiError.notFound("Operation not found"));

    if (operation.status !== "IN_PROGRESS") {
      return next(ApiError.badRequest("Operation must be IN_PROGRESS to record responses"));
    }

    const { responses } = req.body;
    if (!Array.isArray(responses) || responses.length === 0) {
      return next(ApiError.badRequest("Request body must contain a non-empty 'responses' array"));
    }

    const createdResponses = [];

    for (const resp of responses) {
      const { checklistItemId, responseValue, numericValue, booleanValue, photoUrl, notes } = resp;

      if (!checklistItemId) {
        return next(ApiError.badRequest("Each response must include checklistItemId"));
      }

      // Find the checklist item to get question text and tolerance limits
      let question = `Checklist item #${checklistItemId}`;
      let responseType = "TEXT";
      let withinTolerance = null;

      if (models.StepChecklist) {
        const checklistItem = await models.StepChecklist.findByPk(checklistItemId);
        if (checklistItem) {
          question = checklistItem.question || checklistItem.label || question;
          responseType = checklistItem.responseType || checklistItem.type || "TEXT";

          // Evaluate tolerance for NUMERIC type
          if (
            responseType === "NUMERIC" &&
            numericValue !== null &&
            numericValue !== undefined
          ) {
            const lower = checklistItem.lowerLimit != null ? checklistItem.lowerLimit : null;
            const upper = checklistItem.upperLimit != null ? checklistItem.upperLimit : null;
            withinTolerance = OperationService.evaluateTolerance(numericValue, lower, upper);
          }
        }
      }

      const record = await models.ChecklistResponse.create({
        operationId: operation.id,
        checklistItemId,
        question,
        responseType,
        responseValue: responseValue != null ? String(responseValue) : null,
        numericValue: numericValue != null ? parseFloat(numericValue) : null,
        booleanValue: booleanValue != null ? Boolean(booleanValue) : null,
        withinTolerance,
        photoUrl: photoUrl || null,
        respondedById: req.user.id,
        respondedAt: new Date(),
        notes: notes || null,
      });

      createdResponses.push(record);
    }

    res.status(201).json(createdResponses);
  } catch (e) {
    console.error("RouteSheet respond error:", e);
    next(ApiError.internal(e.message));
  }
};

/**
 * POST /operations/:id/complete
 * Complete an operation: verify checklist, check auto-hold, write DHR, advance unit.
 */
const completeOperation = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const operation = await models.OperationRecord.findByPk(req.params.id, {
      include: operationIncludes(),
    });
    if (!operation) return next(ApiError.notFound("Operation not found"));

    if (operation.status !== "IN_PROGRESS") {
      return next(ApiError.badRequest(`Cannot complete operation with status: ${operation.status}`));
    }

    // Verify all mandatory checklist items have responses
    if (models.StepChecklist) {
      const mandatoryItems = await models.StepChecklist.findAll({
        where: {
          stepId: operation.routeStepId,
          isMandatory: true,
        },
      });

      if (mandatoryItems.length > 0) {
        const respondedItemIds = (operation.responses || []).map((r) => r.checklistItemId);
        const missingItems = mandatoryItems.filter(
          (item) => !respondedItemIds.includes(item.id)
        );

        if (missingItems.length > 0) {
          const missingNames = missingItems.map((m) => m.question || m.label || `#${m.id}`).join(", ");
          return next(
            ApiError.badRequest(`Mandatory checklist items not answered: ${missingNames}`)
          );
        }
      }
    }

    // Check for auto-hold conditions (RED tolerance with isAutoHold)
    let autoHeld = false;
    let ncRecord = null;
    const redResponses = (operation.responses || []).filter(
      (r) => r.withinTolerance === "RED"
    );

    if (redResponses.length > 0 && models.StepChecklist) {
      // Check if any of the RED items have isAutoHold
      const redItemIds = redResponses.map((r) => r.checklistItemId);
      const autoHoldItems = await models.StepChecklist.findAll({
        where: {
          id: { [Op.in]: redItemIds },
          isAutoHold: true,
        },
      });

      if (autoHoldItems.length > 0) {
        autoHeld = true;

        // Set unit to ON_HOLD
        if (models.WorkOrderUnit) {
          const unit = await models.WorkOrderUnit.findByPk(operation.unitId);
          if (unit) {
            await unit.update({
              status: "ON_HOLD",
              holdReason: `Auto-hold: out-of-tolerance at step "${operation.stepName}"`,
            });

            // Create NC if Nonconformity model available
            ncRecord = await OperationService.createAutoNC(operation, unit, redResponses);
          }
        }

        await logAudit({
          req,
          action: "MES_AUTO_HOLD",
          entity: "OperationRecord",
          entityId: operation.id,
          description: `Auto-hold triggered at step "${operation.stepName}" for unit #${operation.unitId} — ${redResponses.length} out-of-tolerance response(s)`,
          metadata: {
            unitId: operation.unitId,
            redResponseCount: redResponses.length,
            ncId: ncRecord ? ncRecord.id : null,
          },
        });
      }
    }

    // Calculate duration
    const now = new Date();
    const durationSeconds = operation.startedAt
      ? Math.round((now.getTime() - new Date(operation.startedAt).getTime()) / 1000)
      : null;

    // Update operation
    await operation.update({
      status: "COMPLETED",
      result: autoHeld ? "FAIL" : "PASS",
      completedAt: now,
      durationSeconds,
      ncId: ncRecord ? ncRecord.id : operation.ncId,
      operatorSignatureId: req.body.operatorSignatureId || operation.operatorSignatureId,
      notes: req.body.notes || operation.notes,
    });

    // Write DHR record
    await OperationService.recordToDHR(operation, "OPERATION_COMPLETE");

    // Advance unit to next step (unless auto-held)
    if (!autoHeld) {
      const routeId = operation.routeStep ? operation.routeStep.routeId : null;
      const advanceResult = await OperationService.advanceUnit(
        operation.unitId,
        operation.routeStepId,
        routeId
      );

      if (advanceResult.isLast && models.WorkOrderUnit) {
        // Last step — unit goes to QC_PENDING (already set by advanceUnit)
      }
    }

    await logAudit({
      req,
      action: "OPERATION_COMPLETE",
      entity: "OperationRecord",
      entityId: operation.id,
      description: `Completed operation "${operation.stepName}" (step ${operation.stepOrder}) for unit #${operation.unitId} — result: ${autoHeld ? "FAIL" : "PASS"}`,
      metadata: {
        unitId: operation.unitId,
        workOrderId: operation.workOrderId,
        stepOrder: operation.stepOrder,
        result: autoHeld ? "FAIL" : "PASS",
        durationSeconds,
        autoHeld,
      },
    });

    // Reload with full includes
    const updated = await models.OperationRecord.findByPk(operation.id, {
      include: operationIncludes(),
    });

    res.json(updated);
  } catch (e) {
    console.error("RouteSheet completeOperation error:", e);
    next(ApiError.internal(e.message));
  }
};

/**
 * POST /operations/:id/fail
 * Fail an operation: require comment, create NC, hold unit, write DHR.
 */
const failOperation = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const operation = await models.OperationRecord.findByPk(req.params.id, {
      include: operationIncludes(),
    });
    if (!operation) return next(ApiError.notFound("Operation not found"));

    const { comment, notes } = req.body;
    if (!comment && !notes) {
      return next(ApiError.badRequest("A comment is required when failing an operation"));
    }

    const failComment = comment || notes;

    // Calculate duration
    const now = new Date();
    const durationSeconds = operation.startedAt
      ? Math.round((now.getTime() - new Date(operation.startedAt).getTime()) / 1000)
      : null;

    // Create NC if Nonconformity model available
    let ncRecord = null;
    let unit = null;
    if (models.WorkOrderUnit) {
      unit = await models.WorkOrderUnit.findByPk(operation.unitId);
    }

    if (models.Nonconformity) {
      try {
        ncRecord = await models.Nonconformity.create({
          source: "MES_OPERATION_FAIL",
          title: `Operation failed: "${operation.stepName}" for unit #${operation.unitId}`,
          description: failComment,
          classification: "MAJOR",
          status: "OPEN",
          reportedById: req.user.id,
          productId: unit ? unit.productId || null : null,
          workOrderId: operation.workOrderId,
          unitId: operation.unitId,
          operationRecordId: operation.id,
        });
      } catch (ncErr) {
        console.error("RouteSheet failOperation NC create error:", ncErr.message);
      }
    }

    // Update operation
    await operation.update({
      status: "FAILED",
      result: "FAIL",
      completedAt: now,
      durationSeconds,
      ncId: ncRecord ? ncRecord.id : operation.ncId,
      notes: failComment,
    });

    // Set unit to ON_HOLD
    if (unit) {
      await unit.update({
        status: "ON_HOLD",
        holdReason: `Operation failed: "${operation.stepName}" — ${failComment}`,
      });
    }

    // Write DHR record
    await OperationService.recordToDHR(operation, "OPERATION_FAIL");

    await logAudit({
      req,
      action: "OPERATION_FAIL",
      entity: "OperationRecord",
      entityId: operation.id,
      description: `Failed operation "${operation.stepName}" (step ${operation.stepOrder}) for unit #${operation.unitId}: ${failComment}`,
      metadata: {
        unitId: operation.unitId,
        workOrderId: operation.workOrderId,
        stepOrder: operation.stepOrder,
        durationSeconds,
        ncId: ncRecord ? ncRecord.id : null,
        comment: failComment,
      },
    });

    // Reload with full includes
    const updated = await models.OperationRecord.findByPk(operation.id, {
      include: operationIncludes(),
    });

    res.json(updated);
  } catch (e) {
    console.error("RouteSheet failOperation error:", e);
    next(ApiError.internal(e.message));
  }
};

/**
 * POST /operations/:id/hold
 * Put an operation and its unit on hold.
 */
const holdOperation = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const operation = await models.OperationRecord.findByPk(req.params.id);
    if (!operation) return next(ApiError.notFound("Operation not found"));

    await operation.update({
      status: "ON_HOLD",
      notes: req.body.reason || req.body.notes || operation.notes,
    });

    // Set unit to ON_HOLD
    if (models.WorkOrderUnit) {
      const unit = await models.WorkOrderUnit.findByPk(operation.unitId);
      if (unit) {
        await unit.update({
          status: "ON_HOLD",
          holdReason: req.body.reason || `Operation "${operation.stepName}" placed on hold`,
        });
      }
    }

    await logAudit({
      req,
      action: "OPERATION_HOLD",
      entity: "OperationRecord",
      entityId: operation.id,
      description: `Placed operation "${operation.stepName}" on hold for unit #${operation.unitId}`,
      metadata: {
        unitId: operation.unitId,
        workOrderId: operation.workOrderId,
        reason: req.body.reason || null,
      },
    });

    const updated = await models.OperationRecord.findByPk(operation.id, {
      include: operationIncludes(),
    });

    res.json(updated);
  } catch (e) {
    console.error("RouteSheet holdOperation error:", e);
    next(ApiError.internal(e.message));
  }
};

/**
 * POST /operations/:id/inspect
 * Record inspection for an operation gate.
 * Inspector must be different from the operator.
 */
const inspect = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const operation = await models.OperationRecord.findByPk(req.params.id);
    if (!operation) return next(ApiError.notFound("Operation not found"));

    // Inspector must not be the same as the operator
    if (operation.operatorId && operation.operatorId === req.user.id) {
      return next(
        ApiError.badRequest("Inspector cannot be the same person as the operator")
      );
    }

    const updateData = {
      inspectorId: req.user.id,
    };

    if (req.body.inspectorSignatureId) {
      updateData.inspectorSignatureId = req.body.inspectorSignatureId;
    }

    if (req.body.notes) {
      updateData.notes = operation.notes
        ? `${operation.notes}\n[Inspector] ${req.body.notes}`
        : `[Inspector] ${req.body.notes}`;
    }

    if (req.body.result) {
      updateData.result = req.body.result;
    }

    await operation.update(updateData);

    await logAudit({
      req,
      action: "OPERATION_INSPECT",
      entity: "OperationRecord",
      entityId: operation.id,
      description: `Inspector verified operation "${operation.stepName}" for unit #${operation.unitId}`,
      metadata: {
        unitId: operation.unitId,
        workOrderId: operation.workOrderId,
        inspectorId: req.user.id,
        operatorId: operation.operatorId,
        result: req.body.result || null,
      },
    });

    const updated = await models.OperationRecord.findByPk(operation.id, {
      include: operationIncludes(),
    });

    res.json(updated);
  } catch (e) {
    console.error("RouteSheet inspect error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════

module.exports = {
  getBySerial,
  getByUnit,
  getOperation,
  getActive,
  getWorkstation,
  startOperation,
  respond,
  completeOperation,
  failOperation,
  holdOperation,
  inspect,
};
