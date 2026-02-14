const { EnvironmentalMonitoringPoint, EnvironmentalReading } = require("../models/EnvironmentalMonitoring");
const sequelize = require("../../../db");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");
const { Op } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Monitoring Points CRUD
// ═══════════════════════════════════════════════════════════════

const getMonitoringPoints = async (req, res, next) => {
  try {
    const { status, roomClassification, page = 1, limit = 50 } = req.query;
    const where = {};

    if (status) where.status = status;
    if (roomClassification) where.roomClassification = roomClassification;

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await EnvironmentalMonitoringPoint.findAndCountAll({
      where,
      order: [["pointCode", "ASC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("EnvironmentalMonitoringPoint getAll error:", e);
    next(ApiError.internal(e.message));
  }
};

const createMonitoringPoint = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Authorization required"));

    const [maxResult] = await sequelize.query(
      `SELECT MAX(CAST(SUBSTRING("pointCode" FROM '(\\d+)$') AS INTEGER)) AS max_num FROM environmental_monitoring_points WHERE "pointCode" LIKE 'EMP-%'`
    );
    const maxNum = maxResult?.[0]?.max_num || 0;
    const pointCode = `EMP-${String(maxNum + 1).padStart(3, "0")}`;

    const point = await EnvironmentalMonitoringPoint.create({
      ...req.body,
      pointCode,
    });

    await logAudit({
      req,
      action: "ENV_POINT_CREATE",
      entity: "EnvironmentalMonitoringPoint",
      entityId: point.id,
      description: `Created monitoring point: ${pointCode} — ${point.name}`,
    });

    res.status(201).json(point);
  } catch (e) {
    console.error("EnvironmentalMonitoringPoint create error:", e);
    next(ApiError.internal(e.message));
  }
};

const updateMonitoringPoint = async (req, res, next) => {
  try {
    const point = await EnvironmentalMonitoringPoint.findByPk(req.params.id);
    if (!point) return next(ApiError.notFound("Monitoring point not found"));

    await point.update(req.body);

    await logAudit({
      req,
      action: "ENV_POINT_UPDATE",
      entity: "EnvironmentalMonitoringPoint",
      entityId: point.id,
      description: `Updated monitoring point: ${point.pointCode}`,
    });

    res.json(point);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Readings
// ═══════════════════════════════════════════════════════════════

const getReadings = async (req, res, next) => {
  try {
    const { monitoringPointId, dateFrom, dateTo, parameter, page = 1, limit = 50 } = req.query;
    const where = {};

    if (monitoringPointId) where.monitoringPointId = monitoringPointId;
    if (parameter) where.parameter = parameter;
    if (dateFrom || dateTo) {
      where.readingAt = {};
      if (dateFrom) where.readingAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.readingAt[Op.lte] = new Date(dateTo);
    }

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await EnvironmentalReading.findAndCountAll({
      where,
      include: [
        { model: EnvironmentalMonitoringPoint, as: "monitoringPoint", attributes: ["id", "pointCode", "name", "location"] },
      ],
      order: [["readingAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("EnvironmentalReading getReadings error:", e);
    next(ApiError.internal(e.message));
  }
};

const addReading = async (req, res, next) => {
  try {
    const reading = await EnvironmentalReading.create({
      ...req.body,
      recordedById: req.body.recordedById || req.user?.id,
    });

    await logAudit({
      req,
      action: "ENV_READING_ADD",
      entity: "EnvironmentalReading",
      entityId: reading.id,
      description: `Recorded environmental reading: ${reading.parameter} = ${reading.value} ${reading.unit}`,
    });

    res.status(201).json(reading);
  } catch (e) {
    console.error("EnvironmentalReading addReading error:", e);
    next(ApiError.internal(e.message));
  }
};

const addReadingsBatch = async (req, res, next) => {
  try {
    const { readings } = req.body;
    if (!Array.isArray(readings) || readings.length === 0) {
      return next(ApiError.badRequest("readings array is required"));
    }

    const prepared = readings.map((r) => ({
      ...r,
      recordedById: r.recordedById || req.user?.id,
    }));

    const created = await EnvironmentalReading.bulkCreate(prepared);

    await logAudit({
      req,
      action: "ENV_READING_BATCH",
      entity: "EnvironmentalReading",
      entityId: null,
      description: `Batch recorded ${created.length} environmental readings`,
    });

    res.status(201).json({ count: created.length, rows: created });
  } catch (e) {
    console.error("EnvironmentalReading addReadingsBatch error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Excursions — out-of-spec readings
// ═══════════════════════════════════════════════════════════════

const getExcursions = async (req, res, next) => {
  try {
    const { monitoringPointId, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const where = { withinSpec: false };

    if (monitoringPointId) where.monitoringPointId = monitoringPointId;
    if (dateFrom || dateTo) {
      where.readingAt = {};
      if (dateFrom) where.readingAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.readingAt[Op.lte] = new Date(dateTo);
    }

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await EnvironmentalReading.findAndCountAll({
      where,
      include: [
        { model: EnvironmentalMonitoringPoint, as: "monitoringPoint", attributes: ["id", "pointCode", "name", "location", "roomClassification"] },
      ],
      order: [["readingAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("EnvironmentalReading getExcursions error:", e);
    next(ApiError.internal(e.message));
  }
};

// ═══════════════════════════════════════════════════════════════
// Statistics
// ═══════════════════════════════════════════════════════════════

const getEnvironmentStats = async (req, res, next) => {
  try {
    const totalPoints = await EnvironmentalMonitoringPoint.count();
    const activePoints = await EnvironmentalMonitoringPoint.count({ where: { status: "ACTIVE" } });
    const inactivePoints = await EnvironmentalMonitoringPoint.count({ where: { status: "INACTIVE" } });
    const maintenancePoints = await EnvironmentalMonitoringPoint.count({ where: { status: "MAINTENANCE" } });

    const totalReadings = await EnvironmentalReading.count();
    const excursions = await EnvironmentalReading.count({ where: { withinSpec: false } });

    const byClassification = await EnvironmentalMonitoringPoint.findAll({
      attributes: [
        "roomClassification",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["roomClassification"],
      raw: true,
    });

    res.json({
      totalPoints,
      activePoints,
      inactivePoints,
      maintenancePoints,
      totalReadings,
      excursions,
      byClassification,
    });
  } catch (e) {
    console.error("Environment getStats error:", e);
    next(ApiError.internal(e.message));
  }
};

module.exports = {
  getMonitoringPoints,
  createMonitoringPoint,
  updateMonitoringPoint,
  getReadings,
  addReading,
  addReadingsBatch,
  getExcursions,
  getEnvironmentStats,
};
