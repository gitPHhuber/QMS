const models = require("../../../models");
const { logAudit } = require("../../core/utils/auditLogger");

class OperationService {
  /**
   * Evaluate whether a numeric measurement is within tolerance.
   *
   * @param {number|null} numericValue  - The measured value
   * @param {number|null} lowerLimit    - Lower specification limit
   * @param {number|null} upperLimit    - Upper specification limit
   * @returns {'GREEN'|'YELLOW'|'RED'|null}
   */
  static evaluateTolerance(numericValue, lowerLimit, upperLimit) {
    if (numericValue === null || numericValue === undefined) return null;
    if (lowerLimit === null && upperLimit === null) return null;

    const withinSpec =
      (lowerLimit === null || numericValue >= lowerLimit) &&
      (upperLimit === null || numericValue <= upperLimit);

    if (withinSpec) {
      // Check if near boundary (within 10% of range)
      const range = (upperLimit || 0) - (lowerLimit || 0);
      const margin = range * 0.1;
      const nearLower = lowerLimit !== null && numericValue < lowerLimit + margin;
      const nearUpper = upperLimit !== null && numericValue > upperLimit - margin;
      return nearLower || nearUpper ? "YELLOW" : "GREEN";
    }

    return "RED";
  }

  /**
   * Gate check: verify that all previous steps (with isGoNoGo) are COMPLETED.
   *
   * @param {number} unitId           - The unit being processed
   * @param {number} currentStepOrder - stepOrder of the step about to start
   * @returns {Promise<{ok: boolean, blockingStep: object|null}>}
   */
  static async checkGate(unitId, currentStepOrder) {
    const { OperationRecord } = models;
    const { Op } = require("sequelize");

    const previousOps = await OperationRecord.findAll({
      where: {
        unitId,
        stepOrder: { [Op.lt]: currentStepOrder },
      },
      order: [["stepOrder", "ASC"]],
      include: models.ProcessRouteStep
        ? [{ model: models.ProcessRouteStep, as: "routeStep" }]
        : [],
    });

    for (const op of previousOps) {
      const isGoNoGo = op.routeStep ? op.routeStep.isGoNoGo : false;
      if (isGoNoGo && op.status !== "COMPLETED") {
        return { ok: false, blockingStep: op };
      }
    }

    return { ok: true, blockingStep: null };
  }

  /**
   * Advance the unit's currentStepId to the next step in the route.
   *
   * @param {number} unitId          - The unit to advance
   * @param {number} currentStepId   - Current route step id
   * @param {number} routeId         - The process route id
   * @returns {Promise<{nextStep: object|null, isLast: boolean}>}
   */
  static async advanceUnit(unitId, currentStepId, routeId) {
    const { WorkOrderUnit, ProcessRouteStep } = models;

    if (!ProcessRouteStep || !WorkOrderUnit) {
      return { nextStep: null, isLast: true };
    }

    // Find current step to get its order
    const currentStep = await ProcessRouteStep.findByPk(currentStepId);
    if (!currentStep) return { nextStep: null, isLast: true };

    const { Op } = require("sequelize");

    // Find next step by stepOrder
    const nextStep = await ProcessRouteStep.findOne({
      where: {
        routeId: routeId || currentStep.routeId,
        stepOrder: { [Op.gt]: currentStep.stepOrder },
      },
      order: [["stepOrder", "ASC"]],
    });

    const unit = await WorkOrderUnit.findByPk(unitId);
    if (!unit) return { nextStep: null, isLast: true };

    if (nextStep) {
      await unit.update({ currentStepId: nextStep.id });
      return { nextStep, isLast: false };
    }

    // No next step — this was the last one
    await unit.update({ status: "QC_PENDING", currentStepId: null });
    return { nextStep: null, isLast: true };
  }

  /**
   * Write a DHR (Device History Record) entry for an operation.
   *
   * @param {object} operationRecord - The OperationRecord instance
   * @param {string} action          - Description of what happened
   * @returns {Promise<object|null>}  The created DHR record, or null
   */
  static async recordToDHR(operationRecord, action) {
    // Try DHRRecord first (newer naming), then DhrProcessStep (legacy)
    const DHRModel = models.DHRRecord || models.DhrProcessStep;
    if (!DHRModel) return null;

    try {
      // If DHRRecord model exists, use its schema
      if (models.DHRRecord) {
        return await models.DHRRecord.create({
          unitId: operationRecord.unitId,
          workOrderId: operationRecord.workOrderId,
          recordType: "PRODUCTION_STEP",
          operationRecordId: operationRecord.id,
          stepName: operationRecord.stepName,
          stepOrder: operationRecord.stepOrder,
          result: operationRecord.result,
          operatorId: operationRecord.operatorId,
          startedAt: operationRecord.startedAt,
          completedAt: operationRecord.completedAt,
          action,
          notes: operationRecord.notes,
        });
      }

      // Fallback: DhrProcessStep from mes-dhr module
      // Find or create a DHR for this unit's work order
      if (models.DeviceHistoryRecord) {
        let dhr = await models.DeviceHistoryRecord.findOne({
          where: { serialNumber: null }, // placeholder lookup
        });

        return await models.DhrProcessStep.create({
          dhrId: dhr ? dhr.id : null,
          stepOrder: operationRecord.stepOrder,
          stepName: operationRecord.stepName,
          operatorId: operationRecord.operatorId,
          startedAt: operationRecord.startedAt,
          completedAt: operationRecord.completedAt,
          result: operationRecord.result === "PASS" ? "PASS" : operationRecord.result === "FAIL" ? "FAIL" : "PENDING",
          notes: `${action} — ${operationRecord.notes || ""}`,
        });
      }
    } catch (err) {
      console.error("OperationService.recordToDHR error:", err.message);
    }

    return null;
  }

  /**
   * Auto-create a Nonconformity record for a failed or out-of-tolerance operation.
   *
   * @param {object}   operationRecord  - The OperationRecord instance
   * @param {object}   unit             - The WorkOrderUnit instance
   * @param {object[]} failedResponses  - ChecklistResponse records with RED tolerance
   * @returns {Promise<object|null>}     The created NC record, or null
   */
  static async createAutoNC(operationRecord, unit, failedResponses) {
    const { Nonconformity } = models;
    if (!Nonconformity) return null;

    try {
      const failedItems = failedResponses.map((r) => r.question || r.checklistItemId).join(", ");

      const nc = await Nonconformity.create({
        source: "MES_AUTO",
        title: `Auto-hold at step "${operationRecord.stepName}" for unit #${unit.id}`,
        description: `Out-of-tolerance checklist responses detected during operation #${operationRecord.id}.\nFailed items: ${failedItems}`,
        classification: "MINOR",
        status: "OPEN",
        reportedById: operationRecord.operatorId,
        productId: unit.productId || null,
        workOrderId: operationRecord.workOrderId,
        unitId: unit.id,
        operationRecordId: operationRecord.id,
      });

      return nc;
    } catch (err) {
      console.error("OperationService.createAutoNC error:", err.message);
      return null;
    }
  }
}

module.exports = OperationService;
