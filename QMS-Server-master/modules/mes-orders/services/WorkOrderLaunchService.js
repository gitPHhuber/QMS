const sequelize = require("../../../db");
const { WorkOrderUnit, WorkOrderMaterial } = require("../models/WorkOrder");

// ═══════════════════════════════════════════════════════════════
// Work Order Launch Service — serial number generation,
// unit creation, DHR creation, and material allocation
// ═══════════════════════════════════════════════════════════════

class WorkOrderLaunchService {
  /**
   * Generate unique serial numbers with the given prefix.
   * @param {string} prefix - Serial number prefix (e.g. "SN-", "WO-001-")
   * @param {number} count - Number of serial numbers to generate
   * @returns {string[]} Array of serial number strings
   */
  static generateSerialNumbers(prefix, count) {
    const serialNumbers = [];
    const resolvedPrefix = prefix || "SN-";

    for (let i = 0; i < count; i++) {
      serialNumbers.push(`${resolvedPrefix}${String(i + 1).padStart(4, "0")}`);
    }

    return serialNumbers;
  }

  /**
   * Create WorkOrderUnit records for the given serial numbers.
   * @param {number} workOrderId - FK to production_tasks
   * @param {string[]} serialNumbers - Array of serial numbers
   * @param {Array} routeSteps - ProcessRouteStep instances (sorted by stepOrder)
   * @param {object} [transaction] - Sequelize transaction
   * @returns {Promise<Array>} Created WorkOrderUnit instances
   */
  static async createUnits(workOrderId, serialNumbers, routeSteps = [], transaction = null) {
    const firstStepId = routeSteps.length > 0 ? routeSteps[0].id : null;
    const units = [];
    const opts = transaction ? { transaction } : {};

    for (const sn of serialNumbers) {
      const unit = await WorkOrderUnit.create(
        {
          workOrderId,
          serialNumber: sn,
          status: "CREATED",
          currentStepId: firstStepId,
          startedAt: new Date(),
        },
        opts
      );
      units.push(unit);
    }

    return units;
  }

  /**
   * Create DeviceHistoryRecord entries for each unit.
   * @param {Array} units - WorkOrderUnit instances
   * @param {number} productId - FK to products table
   * @param {string} batchNumber - Batch/lot number
   * @param {string} [dmrVersion] - DMR version string
   * @param {object} [transaction] - Sequelize transaction
   * @returns {Promise<Array>} Created DHR instances (or empty if model unavailable)
   */
  static async createDHRs(units, productId, batchNumber, dmrVersion, transaction = null) {
    let DeviceHistoryRecord;
    try {
      const models = require("../../../models");
      DeviceHistoryRecord = models.DeviceHistoryRecord;
    } catch (_err) {
      return [];
    }

    if (!DeviceHistoryRecord) return [];

    const opts = transaction ? { transaction } : {};
    const dhrs = [];

    for (const unit of units) {
      try {
        const year = new Date().getFullYear();
        const [maxResult] = await sequelize.query(
          `SELECT MAX(CAST(SUBSTRING("dhrNumber" FROM '(\\d+)$') AS INTEGER)) AS max_num FROM device_history_records WHERE "dhrNumber" LIKE 'DHR-${year}-%'`,
          opts
        );
        const maxNum = maxResult?.[0]?.max_num || 0;
        const dhrNumber = `DHR-${year}-${String(maxNum + 1).padStart(3, "0")}`;

        const dhr = await DeviceHistoryRecord.create(
          {
            dhrNumber,
            serialNumber: unit.serialNumber,
            productId,
            batchNumber,
            lotNumber: batchNumber,
            status: "IN_PRODUCTION",
            productionStartDate: new Date(),
            dmrVersion: dmrVersion || null,
          },
          opts
        );

        await unit.update({ dhrId: dhr.id }, opts);
        dhrs.push(dhr);
      } catch (err) {
        console.error("WorkOrderLaunchService: Failed to create DHR for unit:", unit.serialNumber, err.message);
      }
    }

    return dhrs;
  }

  /**
   * Create WorkOrderMaterial records from BOM items.
   * @param {number} workOrderId - FK to production_tasks
   * @param {Array} bomItems - BOMItem model instances
   * @param {number} targetQty - Target production quantity
   * @param {object} [transaction] - Sequelize transaction
   * @returns {Promise<Array>} Created WorkOrderMaterial instances
   */
  static async allocateMaterials(workOrderId, bomItems, targetQty, transaction = null) {
    const materials = [];
    const opts = transaction ? { transaction } : {};

    for (const item of bomItems) {
      const material = await WorkOrderMaterial.create(
        {
          workOrderId,
          bomItemId: item.id,
          requiredQty: item.quantityPer * targetQty,
          allocatedQty: 0,
          consumedQty: 0,
          unit: item.unit || "шт",
          status: "PENDING",
        },
        opts
      );
      materials.push(material);
    }

    return materials;
  }
}

module.exports = WorkOrderLaunchService;
