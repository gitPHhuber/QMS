const { Op } = require("sequelize");
const sequelize = require("../../../db");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");
const { WorkOrderUnit, WorkOrderMaterial, WorkOrderReadinessCheck } = require("../models/WorkOrder");
const ReadinessCheckService = require("../services/ReadinessCheckService");
const WorkOrderLaunchService = require("../services/WorkOrderLaunchService");

// ═══════════════════════════════════════════════════════════════
// Helper: get models from the central registry
// ═══════════════════════════════════════════════════════════════

function getModels() {
  return require("../../../models");
}

// ═══════════════════════════════════════════════════════════════
// Work Order CRUD
// ═══════════════════════════════════════════════════════════════

const getAll = async (req, res, next) => {
  try {
    const { status, dmrId, search, page = 1, limit = 50 } = req.query;
    const models = getModels();
    const { ProductionTask, DeviceMasterRecord, User } = models;

    const where = {
      dmrId: { [Op.ne]: null },
    };

    if (status) where.status = status;
    if (dmrId) where.dmrId = dmrId;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { comment: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const include = [];
    if (DeviceMasterRecord) {
      include.push({ model: DeviceMasterRecord, as: "dmr", required: false });
    }
    if (User) {
      include.push(
        { model: User, as: "responsible", attributes: ["id", "name", "email"], required: false },
        { model: User, as: "createdBy", attributes: ["id", "name", "email"], required: false }
      );
    }

    const { count, rows } = await ProductionTask.findAndCountAll({
      where,
      include,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("WorkOrder getAll error:", e);
    next(ApiError.internal(e.message));
  }
};

const getOne = async (req, res, next) => {
  try {
    const models = getModels();
    const { ProductionTask, DeviceMasterRecord, ProcessRoute, ProcessRouteStep } = models;

    const include = [];

    // Units with currentStep
    const unitInclude = [];
    if (ProcessRouteStep) {
      unitInclude.push({ model: ProcessRouteStep, as: "currentStep", required: false });
    }
    include.push({ model: WorkOrderUnit, as: "units", required: false, include: unitInclude });

    // Materials with bomItem
    const materialInclude = [];
    if (models.BOMItem) {
      materialInclude.push({ model: models.BOMItem, as: "bomItem", required: false });
    }
    include.push({ model: WorkOrderMaterial, as: "materials", required: false, include: materialInclude });

    // Readiness checks
    include.push({ model: WorkOrderReadinessCheck, as: "readinessChecks", required: false });

    // DMR
    if (DeviceMasterRecord) {
      include.push({ model: DeviceMasterRecord, as: "dmr", required: false });
    }

    // Process route
    if (ProcessRoute) {
      include.push({ model: ProcessRoute, as: "processRoute", required: false });
    }

    const workOrder = await ProductionTask.findByPk(req.params.id, { include });
    if (!workOrder) return next(ApiError.notFound("Work order not found"));

    res.json(workOrder);
  } catch (e) {
    console.error("WorkOrder getOne error:", e);
    next(ApiError.internal(e.message));
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const models = getModels();
    const { ProductionTask, DeviceMasterRecord } = models;

    const {
      title,
      dmrId,
      dmrVersion,
      targetQty,
      unit,
      batchNumber,
      serialNumberPrefix,
      orderType,
      dueDate,
      plannedStartDate,
      plannedEndDate,
      priority,
      responsibleId,
      sectionId,
      projectId,
      yieldTarget,
      comment,
    } = req.body;

    if (!dmrId) return next(ApiError.badRequest("dmrId is required for a work order"));
    if (!targetQty || targetQty <= 0) return next(ApiError.badRequest("targetQty must be a positive number"));

    // Auto-lookup DMR version if not provided
    let resolvedDmrVersion = dmrVersion;
    if (!resolvedDmrVersion && DeviceMasterRecord) {
      const dmr = await DeviceMasterRecord.findByPk(dmrId);
      if (!dmr) return next(ApiError.notFound("DMR not found"));
      resolvedDmrVersion = dmr.version;
    }

    const workOrder = await ProductionTask.create({
      title: title || `WO-${Date.now()}`,
      dmrId,
      dmrVersion: resolvedDmrVersion,
      targetQty,
      unit: unit || "шт",
      batchNumber,
      serialNumberPrefix,
      orderType,
      dueDate,
      plannedStartDate,
      plannedEndDate,
      priority,
      responsibleId,
      sectionId,
      projectId,
      yieldTarget,
      comment,
      status: "NEW",
      createdById: req.user.id,
    });

    await logAudit({
      req,
      action: "WORK_ORDER_CREATE",
      entity: "ProductionTask",
      entityId: workOrder.id,
      description: `Created work order: ${workOrder.title}`,
    });

    res.status(201).json(workOrder);
  } catch (e) {
    console.error("WorkOrder create error:", e);
    next(ApiError.internal(e.message));
  }
};

const update = async (req, res, next) => {
  try {
    const models = getModels();
    const { ProductionTask } = models;

    const workOrder = await ProductionTask.findByPk(req.params.id);
    if (!workOrder) return next(ApiError.notFound("Work order not found"));

    if (!["NEW", "PLANNED"].includes(workOrder.status)) {
      return next(ApiError.badRequest("Can only update work orders in NEW or PLANNED status"));
    }

    await workOrder.update(req.body);

    await logAudit({
      req,
      action: "WORK_ORDER_UPDATE",
      entity: "ProductionTask",
      entityId: workOrder.id,
      description: `Updated work order: ${workOrder.title}`,
    });

    res.json(workOrder);
  } catch (e) {
    console.error("WorkOrder update error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Readiness Check
// ═══════════════════════════════════════════════════════════════

const readinessCheck = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const models = getModels();
    const { ProductionTask, BOMItem, ProcessRoute, ProcessRouteStep, WarehouseBox } = models;

    const workOrder = await ProductionTask.findByPk(req.params.id);
    if (!workOrder) return next(ApiError.notFound("Work order not found"));

    const checkResults = {};
    let overallResult = "READY";

    // --- Check Materials ---
    const materialsResult = { ready: true, items: [] };
    if (BOMItem && workOrder.dmrId) {
      const bomItems = await BOMItem.findAll({ where: { dmrId: workOrder.dmrId } });
      for (const item of bomItems) {
        const requiredQty = item.quantityPer * workOrder.targetQty;
        let availableQty = 0;

        if (WarehouseBox) {
          const boxes = await WarehouseBox.findAll({
            where: {
              originType: "product",
              originId: item.approvedSupplierId || null,
              status: "ON_STOCK",
            },
            attributes: ["id", "quantity", "lotNumber"],
          });
          availableQty = boxes.reduce((sum, b) => sum + (b.quantity || 0), 0);
        }

        const itemReady = availableQty >= requiredQty;
        if (!itemReady) materialsResult.ready = false;

        materialsResult.items.push({
          bomItemId: item.id,
          partNumber: item.partNumber,
          description: item.description,
          requiredQty,
          availableQty,
          ready: itemReady,
        });
      }
    }
    checkResults.materials = materialsResult;
    if (!materialsResult.ready) overallResult = "NOT_READY";

    // --- Check Equipment ---
    const equipmentResult = { ready: true, items: [] };
    if (ProcessRoute && ProcessRouteStep && workOrder.processRouteId) {
      const steps = await ProcessRouteStep.findAll({
        where: { routeId: workOrder.processRouteId },
        order: [["stepOrder", "ASC"]],
      });

      for (const step of steps) {
        const eqIds = step.requiredEquipmentIds || [];
        for (const eqId of eqIds) {
          let eqReady = true;
          let calibrationStatus = "UNKNOWN";
          try {
            if (models.Equipment) {
              const equipment = await models.Equipment.findByPk(eqId);
              if (equipment) {
                calibrationStatus = equipment.calibrationStatus || equipment.status || "UNKNOWN";
                eqReady = calibrationStatus === "CALIBRATED" || calibrationStatus === "ACTIVE";
              } else {
                eqReady = false;
                calibrationStatus = "NOT_FOUND";
              }
            }
          } catch (_err) {
            // Equipment model unavailable
          }

          if (!eqReady) equipmentResult.ready = false;
          equipmentResult.items.push({
            stepId: step.id,
            stepName: step.name,
            equipmentId: eqId,
            calibrationStatus,
            ready: eqReady,
          });
        }
      }
    }
    checkResults.equipment = equipmentResult;
    if (!equipmentResult.ready) {
      overallResult = overallResult === "READY" ? "NOT_READY" : overallResult;
    }

    // --- Check Training ---
    const trainingResult = { ready: true, items: [] };
    if (ProcessRoute && ProcessRouteStep && workOrder.processRouteId) {
      const steps = await ProcessRouteStep.findAll({
        where: { routeId: workOrder.processRouteId },
        order: [["stepOrder", "ASC"]],
      });

      for (const step of steps) {
        const trainingIds = step.requiredTrainingIds || [];
        for (const trainingId of trainingIds) {
          let trainingReady = true;
          try {
            if (models.TrainingRecord) {
              const records = await models.TrainingRecord.findAll({
                where: {
                  trainingId,
                  status: "COMPLETED",
                },
              });
              trainingReady = records.length > 0;
            }
          } catch (_err) {
            // Training model unavailable
          }

          if (!trainingReady) trainingResult.ready = false;
          trainingResult.items.push({
            stepId: step.id,
            stepName: step.name,
            trainingId,
            ready: trainingReady,
          });
        }
      }
    }
    checkResults.training = trainingResult;
    if (!trainingResult.ready) {
      overallResult = overallResult === "READY" ? "NOT_READY" : overallResult;
    }

    // Determine partial readiness
    const checksArray = [materialsResult.ready, equipmentResult.ready, trainingResult.ready];
    const readyCount = checksArray.filter(Boolean).length;
    if (readyCount > 0 && readyCount < checksArray.length) {
      overallResult = "PARTIAL";
    }

    // Save check record
    const checkRecord = await WorkOrderReadinessCheck.create({
      workOrderId: workOrder.id,
      checkType: req.body.checkType || "FULL",
      result: overallResult,
      details: checkResults,
      performedById: req.user.id,
      performedAt: new Date(),
    });

    res.json({
      id: checkRecord.id,
      result: overallResult,
      details: checkResults,
      performedAt: checkRecord.performedAt,
    });
  } catch (e) {
    console.error("WorkOrder readinessCheck error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Launch — create units, DHRs, materials from BOM
// ═══════════════════════════════════════════════════════════════

const launch = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const models = getModels();
    const { ProductionTask, BOMItem, ProcessRoute, ProcessRouteStep, DeviceHistoryRecord } = models;

    const workOrder = await ProductionTask.findByPk(req.params.id, { transaction: t });
    if (!workOrder) {
      await t.rollback();
      return next(ApiError.notFound("Work order not found"));
    }

    if (!["NEW", "PLANNED"].includes(workOrder.status)) {
      await t.rollback();
      return next(ApiError.badRequest("Work order must be in NEW or PLANNED status to launch"));
    }

    const qty = workOrder.targetQty;
    const prefix = workOrder.serialNumberPrefix || "SN-";

    // Generate serial numbers
    const serialNumbers = WorkOrderLaunchService.generateSerialNumbers(prefix, qty);

    // Determine first step of the route
    let firstStepId = null;
    if (ProcessRouteStep && workOrder.processRouteId) {
      const firstStep = await ProcessRouteStep.findOne({
        where: { routeId: workOrder.processRouteId },
        order: [["stepOrder", "ASC"]],
        transaction: t,
      });
      if (firstStep) firstStepId = firstStep.id;
    }

    // Create WorkOrderUnit records
    const units = [];
    for (let i = 0; i < qty; i++) {
      const unit = await WorkOrderUnit.create(
        {
          workOrderId: workOrder.id,
          serialNumber: serialNumbers[i],
          status: "CREATED",
          currentStepId: firstStepId,
          startedAt: new Date(),
        },
        { transaction: t }
      );
      units.push(unit);
    }

    // Auto-create DeviceHistoryRecord for each unit (if model available)
    if (DeviceHistoryRecord) {
      for (const unit of units) {
        try {
          const year = new Date().getFullYear();
          const [maxResult] = await sequelize.query(
            `SELECT MAX(CAST(SUBSTRING("dhrNumber" FROM '(\\d+)$') AS INTEGER)) AS max_num FROM device_history_records WHERE "dhrNumber" LIKE 'DHR-${year}-%'`,
            { transaction: t }
          );
          const maxNum = maxResult?.[0]?.max_num || 0;
          const dhrNumber = `DHR-${year}-${String(maxNum + 1).padStart(3, "0")}`;

          const dhr = await DeviceHistoryRecord.create(
            {
              dhrNumber,
              serialNumber: unit.serialNumber,
              productId: workOrder.originId || workOrder.dmrId,
              batchNumber: workOrder.batchNumber,
              lotNumber: workOrder.batchNumber,
              status: "IN_PRODUCTION",
              productionStartDate: new Date(),
              dmrVersion: workOrder.dmrVersion,
            },
            { transaction: t }
          );

          await unit.update({ dhrId: dhr.id }, { transaction: t });
        } catch (dhrErr) {
          console.error("Failed to create DHR for unit:", unit.serialNumber, dhrErr.message);
        }
      }
    }

    // Create WorkOrderMaterial records from BOM
    if (BOMItem && workOrder.dmrId) {
      const bomItems = await BOMItem.findAll({
        where: { dmrId: workOrder.dmrId },
        transaction: t,
      });

      for (const item of bomItems) {
        await WorkOrderMaterial.create(
          {
            workOrderId: workOrder.id,
            bomItemId: item.id,
            requiredQty: item.quantityPer * qty,
            allocatedQty: 0,
            consumedQty: 0,
            unit: item.unit || "шт",
            status: "PENDING",
          },
          { transaction: t }
        );
      }
    }

    // Update ProductionTask status
    await workOrder.update(
      {
        status: "IN_PROGRESS",
        launchedById: req.user.id,
        launchedAt: new Date(),
        actualStartDate: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    await logAudit({
      req,
      action: "WORK_ORDER_LAUNCH",
      entity: "ProductionTask",
      entityId: workOrder.id,
      description: `Launched work order: ${workOrder.title} with ${qty} units`,
    });

    // Re-fetch with associations for the response
    const launched = await ProductionTask.findByPk(workOrder.id, {
      include: [
        { model: WorkOrderUnit, as: "units" },
        { model: WorkOrderMaterial, as: "materials" },
      ],
    });

    res.json(launched);
  } catch (e) {
    await t.rollback();
    console.error("WorkOrder launch error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Issue Materials
// ═══════════════════════════════════════════════════════════════

const issueMaterials = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const models = getModels();
    const { ProductionTask } = models;

    const workOrder = await ProductionTask.findByPk(req.params.id);
    if (!workOrder) return next(ApiError.notFound("Work order not found"));

    const { materialIds, warehouseBoxId, lotNumber } = req.body;
    if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
      return next(ApiError.badRequest("materialIds array is required"));
    }

    const updatedMaterials = [];
    for (const matId of materialIds) {
      const material = await WorkOrderMaterial.findByPk(matId);
      if (!material || material.workOrderId !== workOrder.id) continue;

      await material.update({
        status: "ISSUED",
        issuedById: req.user.id,
        issuedAt: new Date(),
        warehouseBoxId: warehouseBoxId || material.warehouseBoxId,
        lotNumber: lotNumber || material.lotNumber,
        allocatedQty: material.requiredQty,
      });

      // Create warehouse movement record if model available
      try {
        if (models.WarehouseMovement && warehouseBoxId) {
          await models.WarehouseMovement.create({
            boxId: warehouseBoxId,
            operation: "ISSUE_TO_PRODUCTION",
            statusAfter: "ISSUED",
            deltaQty: -Math.round(material.requiredQty),
            performedById: req.user.id,
            performedAt: new Date(),
            comment: `Issued to work order ${workOrder.title} (ID: ${workOrder.id})`,
          });
        }
      } catch (_err) {
        console.error("Failed to create warehouse movement:", _err.message);
      }

      updatedMaterials.push(material);
    }

    await logAudit({
      req,
      action: "WORK_ORDER_MATERIAL_ISSUE",
      entity: "ProductionTask",
      entityId: workOrder.id,
      description: `Issued ${updatedMaterials.length} materials for work order: ${workOrder.title}`,
    });

    res.json({ issued: updatedMaterials.length, materials: updatedMaterials });
  } catch (e) {
    console.error("WorkOrder issueMaterials error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Progress — aggregate units by status
// ═══════════════════════════════════════════════════════════════

const getProgress = async (req, res, next) => {
  try {
    const models = getModels();
    const { ProductionTask } = models;

    const workOrder = await ProductionTask.findByPk(req.params.id);
    if (!workOrder) return next(ApiError.notFound("Work order not found"));

    const totalUnits = await WorkOrderUnit.count({
      where: { workOrderId: workOrder.id },
    });

    const byStatus = await WorkOrderUnit.findAll({
      where: { workOrderId: workOrder.id },
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    const completedStatuses = ["QC_PASSED", "RELEASED"];
    const completedCount = byStatus
      .filter((s) => completedStatuses.includes(s.status))
      .reduce((sum, s) => sum + parseInt(s.count), 0);

    const completionPercent = totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0;

    // Material progress
    const totalMaterials = await WorkOrderMaterial.count({
      where: { workOrderId: workOrder.id },
    });
    const issuedMaterials = await WorkOrderMaterial.count({
      where: { workOrderId: workOrder.id, status: { [Op.in]: ["ISSUED", "CONSUMED"] } },
    });

    res.json({
      workOrderId: workOrder.id,
      status: workOrder.status,
      totalUnits,
      byStatus,
      completedCount,
      completionPercent,
      materials: {
        total: totalMaterials,
        issued: issuedMaterials,
      },
    });
  } catch (e) {
    console.error("WorkOrder getProgress error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Units — list & update
// ═══════════════════════════════════════════════════════════════

const getUnits = async (req, res, next) => {
  try {
    const models = getModels();
    const { ProductionTask, ProcessRouteStep } = models;

    const workOrder = await ProductionTask.findByPk(req.params.id);
    if (!workOrder) return next(ApiError.notFound("Work order not found"));

    const { status, page = 1, limit = 50 } = req.query;
    const where = { workOrderId: workOrder.id };
    if (status) where.status = status;

    const limitNum = Math.min(parseInt(limit) || 50, 200);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const include = [];
    if (ProcessRouteStep) {
      include.push({ model: ProcessRouteStep, as: "currentStep", required: false });
    }

    const { count, rows } = await WorkOrderUnit.findAndCountAll({
      where,
      include,
      order: [["serialNumber", "ASC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("WorkOrder getUnits error:", e);
    next(ApiError.internal(e.message));
  }
};

const updateUnit = async (req, res, next) => {
  try {
    const unit = await WorkOrderUnit.findByPk(req.params.unitId);
    if (!unit) return next(ApiError.notFound("Unit not found"));

    const allowedFields = ["status", "currentStepId", "notes", "holdReason", "ncId", "completedAt"];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    // Auto-set timestamps
    if (updateData.status === "IN_PROGRESS" && !unit.startedAt) {
      updateData.startedAt = new Date();
    }
    if (["QC_PASSED", "RELEASED", "SCRAPPED"].includes(updateData.status) && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    await unit.update(updateData);

    await logAudit({
      req,
      action: "WORK_ORDER_UNIT_UPDATE",
      entity: "WorkOrderUnit",
      entityId: unit.id,
      description: `Updated unit ${unit.serialNumber}: status=${unit.status}`,
    });

    res.json(unit);
  } catch (e) {
    console.error("WorkOrder updateUnit error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Complete — verify all units and close work order
// ═══════════════════════════════════════════════════════════════

const complete = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const models = getModels();
    const { ProductionTask } = models;

    const workOrder = await ProductionTask.findByPk(req.params.id);
    if (!workOrder) return next(ApiError.notFound("Work order not found"));

    if (workOrder.status === "COMPLETED") {
      return next(ApiError.badRequest("Work order is already completed"));
    }

    // Check that all units are in a final state
    const finalStatuses = ["QC_PASSED", "QC_FAILED", "SCRAPPED", "RELEASED"];
    const totalUnits = await WorkOrderUnit.count({
      where: { workOrderId: workOrder.id },
    });
    const finalUnits = await WorkOrderUnit.count({
      where: {
        workOrderId: workOrder.id,
        status: { [Op.in]: finalStatuses },
      },
    });

    if (totalUnits > 0 && finalUnits < totalUnits) {
      const pendingCount = totalUnits - finalUnits;
      return next(
        ApiError.badRequest(
          `Cannot complete: ${pendingCount} unit(s) are not in a final state. ` +
          `Final states: ${finalStatuses.join(", ")}`
        )
      );
    }

    // Calculate yield
    const passedUnits = await WorkOrderUnit.count({
      where: {
        workOrderId: workOrder.id,
        status: { [Op.in]: ["QC_PASSED", "RELEASED"] },
      },
    });

    await workOrder.update({
      status: "COMPLETED",
      actualEndDate: new Date(),
      completedQty: passedUnits,
      completedById: req.user.id,
      completedAt: new Date(),
    });

    await logAudit({
      req,
      action: "WORK_ORDER_COMPLETE",
      entity: "ProductionTask",
      entityId: workOrder.id,
      description: `Completed work order: ${workOrder.title}. Yield: ${passedUnits}/${totalUnits}`,
    });

    res.json({
      id: workOrder.id,
      status: workOrder.status,
      totalUnits,
      passedUnits,
      yieldPercent: totalUnits > 0 ? Math.round((passedUnits / totalUnits) * 100) : 0,
    });
  } catch (e) {
    console.error("WorkOrder complete error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Statistics
// ═══════════════════════════════════════════════════════════════

const getStats = async (req, res, next) => {
  try {
    const models = getModels();
    const { ProductionTask } = models;

    const where = { dmrId: { [Op.ne]: null } };

    const total = await ProductionTask.count({ where });

    const byStatus = await ProductionTask.findAll({
      where,
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    const totalUnits = await WorkOrderUnit.count();
    const unitsByStatus = await WorkOrderUnit.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    res.json({ total, byStatus, totalUnits, unitsByStatus });
  } catch (e) {
    console.error("WorkOrder getStats error:", e);
    next(ApiError.internal(e.message));
  }
};

module.exports = {
  getAll,
  getOne,
  create,
  update,
  readinessCheck,
  launch,
  issueMaterials,
  getProgress,
  getUnits,
  updateUnit,
  complete,
  getStats,
};
