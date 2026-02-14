const sequelize = require("../../../db");

// ═══════════════════════════════════════════════════════════════
// Readiness Check Service — pre-launch verification logic
// ═══════════════════════════════════════════════════════════════

class ReadinessCheckService {
  /**
   * Check material availability from WMS for all BOM items.
   * @param {number} workOrderId
   * @param {Array} bomItems - BOMItem model instances
   * @param {number} targetQty - target production quantity
   * @returns {{ ready: boolean, items: Array }}
   */
  static async checkMaterials(workOrderId, bomItems, targetQty) {
    const result = { ready: true, items: [] };

    let WarehouseBox;
    try {
      const models = require("../../../models");
      WarehouseBox = models.WarehouseBox;
    } catch (_err) {
      // WMS module not available
    }

    for (const item of bomItems) {
      const requiredQty = item.quantityPer * targetQty;
      let availableQty = 0;

      if (WarehouseBox) {
        try {
          const boxes = await WarehouseBox.findAll({
            where: {
              originType: "product",
              originId: item.approvedSupplierId || null,
              status: "ON_STOCK",
            },
            attributes: ["id", "quantity", "lotNumber"],
          });
          availableQty = boxes.reduce((sum, b) => sum + (b.quantity || 0), 0);
        } catch (_err) {
          console.error("ReadinessCheckService: Error querying warehouse boxes:", _err.message);
        }
      }

      const itemReady = availableQty >= requiredQty;
      if (!itemReady) result.ready = false;

      result.items.push({
        bomItemId: item.id,
        partNumber: item.partNumber,
        description: item.description,
        requiredQty,
        availableQty,
        deficit: Math.max(0, requiredQty - availableQty),
        ready: itemReady,
      });
    }

    return result;
  }

  /**
   * Check equipment calibration status for all required equipment in route steps.
   * @param {Array} routeSteps - ProcessRouteStep model instances
   * @returns {{ ready: boolean, items: Array }}
   */
  static async checkEquipment(routeSteps) {
    const result = { ready: true, items: [] };

    let Equipment;
    try {
      const models = require("../../../models");
      Equipment = models.Equipment;
    } catch (_err) {
      // Equipment module not available
    }

    for (const step of routeSteps) {
      const equipmentIds = step.requiredEquipmentIds || [];

      for (const eqId of equipmentIds) {
        let eqReady = true;
        let calibrationStatus = "UNKNOWN";
        let equipmentName = null;

        if (Equipment) {
          try {
            const equipment = await Equipment.findByPk(eqId);
            if (equipment) {
              equipmentName = equipment.name || equipment.label;
              calibrationStatus = equipment.calibrationStatus || equipment.status || "UNKNOWN";
              eqReady = calibrationStatus === "CALIBRATED" || calibrationStatus === "ACTIVE";
            } else {
              eqReady = false;
              calibrationStatus = "NOT_FOUND";
            }
          } catch (_err) {
            console.error("ReadinessCheckService: Error checking equipment:", _err.message);
          }
        }

        if (!eqReady) result.ready = false;

        result.items.push({
          stepId: step.id,
          stepName: step.name,
          equipmentId: eqId,
          equipmentName,
          calibrationStatus,
          ready: eqReady,
        });
      }
    }

    return result;
  }

  /**
   * Check training records for operators assigned to route steps.
   * @param {Array} routeSteps - ProcessRouteStep model instances
   * @param {Array<number>} operatorIds - IDs of operators to check (optional)
   * @returns {{ ready: boolean, items: Array }}
   */
  static async checkTraining(routeSteps, operatorIds = []) {
    const result = { ready: true, items: [] };

    let TrainingRecord;
    try {
      const models = require("../../../models");
      TrainingRecord = models.TrainingRecord;
    } catch (_err) {
      // Training module not available
    }

    for (const step of routeSteps) {
      const trainingIds = step.requiredTrainingIds || [];

      for (const trainingId of trainingIds) {
        let trainingReady = true;
        let completedOperators = [];

        if (TrainingRecord) {
          try {
            const where = {
              trainingId,
              status: "COMPLETED",
            };

            const records = await TrainingRecord.findAll({ where });
            completedOperators = records.map((r) => r.userId || r.employeeId);

            // If specific operators are provided, check that they are all trained
            if (operatorIds.length > 0) {
              const untrained = operatorIds.filter(
                (opId) => !completedOperators.includes(opId)
              );
              trainingReady = untrained.length === 0;
            } else {
              trainingReady = records.length > 0;
            }
          } catch (_err) {
            console.error("ReadinessCheckService: Error checking training:", _err.message);
          }
        }

        if (!trainingReady) result.ready = false;

        result.items.push({
          stepId: step.id,
          stepName: step.name,
          trainingId,
          completedOperatorCount: completedOperators.length,
          ready: trainingReady,
        });
      }
    }

    return result;
  }

  /**
   * Run a full readiness check for a work order — materials, equipment, and training.
   * @param {number} workOrderId
   * @returns {{ overallResult: string, materials: object, equipment: object, training: object }}
   */
  static async runFullCheck(workOrderId) {
    const models = require("../../../models");
    const { ProductionTask, BOMItem, ProcessRouteStep } = models;

    const workOrder = await ProductionTask.findByPk(workOrderId);
    if (!workOrder) {
      throw new Error(`Work order not found: ${workOrderId}`);
    }

    // Gather BOM items
    let bomItems = [];
    if (BOMItem && workOrder.dmrId) {
      bomItems = await BOMItem.findAll({ where: { dmrId: workOrder.dmrId } });
    }

    // Gather process route steps
    let routeSteps = [];
    if (ProcessRouteStep && workOrder.processRouteId) {
      routeSteps = await ProcessRouteStep.findAll({
        where: { routeId: workOrder.processRouteId },
        order: [["stepOrder", "ASC"]],
      });
    }

    // Run all checks
    const materials = await ReadinessCheckService.checkMaterials(workOrderId, bomItems, workOrder.targetQty);
    const equipment = await ReadinessCheckService.checkEquipment(routeSteps);
    const training = await ReadinessCheckService.checkTraining(routeSteps);

    // Determine overall result
    const allChecks = [materials.ready, equipment.ready, training.ready];
    const readyCount = allChecks.filter(Boolean).length;

    let overallResult;
    if (readyCount === allChecks.length) {
      overallResult = "READY";
    } else if (readyCount === 0) {
      overallResult = "NOT_READY";
    } else {
      overallResult = "PARTIAL";
    }

    return {
      overallResult,
      materials,
      equipment,
      training,
    };
  }
}

module.exports = ReadinessCheckService;
