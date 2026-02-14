const { ProductionKpiTarget } = require("../models/MesKpi");
const sequelize = require("../../../db");
const { Op } = require("sequelize");
const ApiError = require("../../../error/ApiError");

// ═══════════════════════════════════════════════════════════════
// Dashboard — summary KPIs
// ═══════════════════════════════════════════════════════════════

const getDashboard = async (req, res, next) => {
  try {
    const models = require("../../../models");
    const result = {
      activeOrders: 0,
      totalUnits: 0,
      completedToday: 0,
      holdCount: 0,
      avgFpy: null,
    };

    // Active orders
    if (models.ProductionTask) {
      try {
        result.activeOrders = await models.ProductionTask.count({
          where: { status: { [Op.in]: ["IN_PROGRESS", "LAUNCHED", "NEW"] } },
        });
      } catch (e) {
        console.warn("KPI dashboard: could not count active orders:", e.message);
      }
    }

    // Total units & hold count
    if (models.WorkOrderUnit) {
      try {
        result.totalUnits = await models.WorkOrderUnit.count();
        result.holdCount = await models.WorkOrderUnit.count({
          where: { status: "ON_HOLD" },
        });
      } catch (e) {
        console.warn("KPI dashboard: could not count units:", e.message);
      }
    }

    // Completed today
    if (models.OperationRecord) {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        result.completedToday = await models.OperationRecord.count({
          where: {
            status: "COMPLETED",
            completedAt: { [Op.gte]: todayStart },
          },
        });
      } catch (e) {
        console.warn("KPI dashboard: could not count completed today:", e.message);
      }
    }

    // Average FPY (first pass yield) — units that passed all steps on first attempt
    if (models.OperationRecord) {
      try {
        const [fpyResult] = await sequelize.query(`
          SELECT
            CASE WHEN COUNT(DISTINCT "unitId") = 0 THEN NULL
            ELSE ROUND(
              COUNT(DISTINCT "unitId") FILTER (
                WHERE "unitId" NOT IN (
                  SELECT DISTINCT "unitId" FROM operation_records WHERE result = 'FAIL'
                )
              ) * 100.0 / NULLIF(COUNT(DISTINCT "unitId"), 0), 1
            )
            END AS avg_fpy
          FROM operation_records
          WHERE status = 'COMPLETED'
        `);
        result.avgFpy = fpyResult?.[0]?.avg_fpy || null;
      } catch (e) {
        console.warn("KPI dashboard: could not calculate avg FPY:", e.message);
      }
    }

    res.json(result);
  } catch (e) {
    console.error("KPI getDashboard error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// OEE — Overall Equipment Effectiveness
// ═══════════════════════════════════════════════════════════════

const getOee = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, workOrderId } = req.query;

    const dateFilter = [];
    const replacements = {};

    if (dateFrom) {
      dateFilter.push(`"completedAt" >= :dateFrom`);
      replacements.dateFrom = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.push(`"completedAt" <= :dateTo`);
      replacements.dateTo = new Date(dateTo);
    }
    if (workOrderId) {
      dateFilter.push(`"workOrderId" = :workOrderId`);
      replacements.workOrderId = parseInt(workOrderId);
    }

    const whereClause = dateFilter.length > 0 ? `WHERE ${dateFilter.join(" AND ")}` : "";

    // OEE = Availability x Performance x Quality
    const [rows] = await sequelize.query(`
      WITH stats AS (
        SELECT
          COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_ops,
          COUNT(*) AS total_ops,
          COALESCE(SUM("durationSeconds") FILTER (WHERE status = 'COMPLETED'), 0) AS actual_runtime,
          COUNT(*) FILTER (WHERE result = 'PASS') AS pass_count,
          COUNT(*) FILTER (WHERE result IN ('PASS', 'FAIL', 'CONDITIONAL')) AS inspected_count
        FROM operation_records
        ${whereClause}
      )
      SELECT
        completed_ops,
        total_ops,
        actual_runtime,
        pass_count,
        inspected_count,
        CASE WHEN total_ops = 0 THEN 0
          ELSE ROUND(completed_ops * 100.0 / total_ops, 1) END AS availability,
        CASE WHEN actual_runtime = 0 THEN 0
          ELSE 100.0 END AS performance,
        CASE WHEN inspected_count = 0 THEN 0
          ELSE ROUND(pass_count * 100.0 / inspected_count, 1) END AS quality,
        CASE WHEN total_ops = 0 OR inspected_count = 0 THEN 0
          ELSE ROUND(
            (completed_ops * 1.0 / total_ops) *
            1.0 *
            (pass_count * 1.0 / inspected_count) * 100, 1
          ) END AS oee
      FROM stats
    `, { replacements });

    res.json(rows[0] || {
      completed_ops: 0,
      total_ops: 0,
      availability: 0,
      performance: 0,
      quality: 0,
      oee: 0,
    });
  } catch (e) {
    console.error("KPI getOee error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// FPY — First Pass Yield per step/order
// ═══════════════════════════════════════════════════════════════

const getFpy = async (req, res, next) => {
  try {
    const { workOrderId, groupBy } = req.query;

    const filters = [`status = 'COMPLETED'`];
    const replacements = {};

    if (workOrderId) {
      filters.push(`"workOrderId" = :workOrderId`);
      replacements.workOrderId = parseInt(workOrderId);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    // Group by step or by work order
    const groupField = groupBy === "step" ? `"stepName"` : `"workOrderId"`;
    const groupLabel = groupBy === "step" ? `"stepName"` : `"workOrderId"`;

    // FPY: Count units that passed each step on first attempt (no FAIL then PASS pattern)
    const [rows] = await sequelize.query(`
      WITH first_attempts AS (
        SELECT
          ${groupLabel} AS group_key,
          "unitId",
          result,
          ROW_NUMBER() OVER (PARTITION BY "unitId", ${groupField} ORDER BY "startedAt" ASC) AS attempt
        FROM operation_records
        ${whereClause}
      )
      SELECT
        group_key,
        COUNT(DISTINCT "unitId") AS total_units,
        COUNT(DISTINCT "unitId") FILTER (WHERE attempt = 1 AND result = 'PASS') AS first_pass_units,
        CASE WHEN COUNT(DISTINCT "unitId") = 0 THEN 0
          ELSE ROUND(
            COUNT(DISTINCT "unitId") FILTER (WHERE attempt = 1 AND result = 'PASS') * 100.0
            / COUNT(DISTINCT "unitId"), 1
          ) END AS fpy_percent
      FROM first_attempts
      GROUP BY group_key
      ORDER BY group_key
    `, { replacements });

    res.json(rows);
  } catch (e) {
    console.error("KPI getFpy error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Cycle Time — average/median/P95 duration per step
// ═══════════════════════════════════════════════════════════════

const getCycleTime = async (req, res, next) => {
  try {
    const { workOrderId, stepName } = req.query;

    const filters = [`status = 'COMPLETED'`, `"durationSeconds" IS NOT NULL`];
    const replacements = {};

    if (workOrderId) {
      filters.push(`"workOrderId" = :workOrderId`);
      replacements.workOrderId = parseInt(workOrderId);
    }
    if (stepName) {
      filters.push(`"stepName" = :stepName`);
      replacements.stepName = stepName;
    }

    const whereClause = `WHERE ${filters.join(" AND ")}`;

    const [rows] = await sequelize.query(`
      SELECT
        "stepName",
        COUNT(*) AS sample_count,
        ROUND(AVG("durationSeconds"), 1) AS avg_seconds,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "durationSeconds") AS median_seconds,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "durationSeconds") AS p95_seconds,
        MIN("durationSeconds") AS min_seconds,
        MAX("durationSeconds") AS max_seconds
      FROM operation_records
      ${whereClause}
      GROUP BY "stepName"
      ORDER BY "stepName"
    `, { replacements });

    res.json(rows);
  } catch (e) {
    console.error("KPI getCycleTime error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Yield — passed/total units by work order
// ═══════════════════════════════════════════════════════════════

const getYield = async (req, res, next) => {
  try {
    const { workOrderId } = req.query;

    const filters = [];
    const replacements = {};

    if (workOrderId) {
      filters.push(`"workOrderId" = :workOrderId`);
      replacements.workOrderId = parseInt(workOrderId);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    const [rows] = await sequelize.query(`
      SELECT
        "workOrderId",
        COUNT(DISTINCT "unitId") AS total_units,
        COUNT(DISTINCT "unitId") FILTER (
          WHERE "unitId" NOT IN (
            SELECT DISTINCT "unitId" FROM operation_records WHERE result = 'FAIL'
          )
        ) AS passed_units,
        CASE WHEN COUNT(DISTINCT "unitId") = 0 THEN 0
          ELSE ROUND(
            COUNT(DISTINCT "unitId") FILTER (
              WHERE "unitId" NOT IN (
                SELECT DISTINCT "unitId" FROM operation_records WHERE result = 'FAIL'
              )
            ) * 100.0 / COUNT(DISTINCT "unitId"), 1
          ) END AS yield_percent
      FROM operation_records
      ${whereClause}
      GROUP BY "workOrderId"
      ORDER BY "workOrderId"
    `, { replacements });

    res.json(rows);
  } catch (e) {
    console.error("KPI getYield error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Targets CRUD
// ═══════════════════════════════════════════════════════════════

const getTargets = async (req, res, next) => {
  try {
    const { productId, kpiCode, isActive } = req.query;
    const where = {};

    if (productId) where.productId = productId;
    if (kpiCode) where.kpiCode = kpiCode;
    if (isActive !== undefined) where.isActive = isActive === "true";

    const targets = await ProductionKpiTarget.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json(targets);
  } catch (e) {
    console.error("KPI getTargets error:", e);
    next(ApiError.internal(e.message));
  }
};

const createTarget = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const target = await ProductionKpiTarget.create({
      ...req.body,
      createdById: req.user.id,
    });

    res.status(201).json(target);
  } catch (e) {
    console.error("KPI createTarget error:", e);
    next(ApiError.internal(e.message));
  }
};

const updateTarget = async (req, res, next) => {
  try {
    const target = await ProductionKpiTarget.findByPk(req.params.id);
    if (!target) return next(ApiError.notFound("KPI target not found"));

    await target.update(req.body);

    res.json(target);
  } catch (e) {
    console.error("KPI updateTarget error:", e);
    next(ApiError.internal(e.message));
  }
};

module.exports = {
  getDashboard,
  getOee,
  getFpy,
  getCycleTime,
  getYield,
  getTargets,
  createTarget,
  updateTarget,
};
