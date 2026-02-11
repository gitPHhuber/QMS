const { Equipment, CalibrationRecord } = require("../models/Equipment");
const { User } = require("../../../models/index");
const { logAudit } = require("../../core/utils/auditLogger");
const { Op } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Equipment CRUD
// ═══════════════════════════════════════════════════════════════

const getAll = async (req, res) => {
  try {
    const { type, status, overdue, page = 1, limit = 50 } = req.query;
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (overdue === "true") {
      where.nextCalibrationDate = { [Op.lt]: new Date() };
      where.status = { [Op.ne]: "DECOMMISSIONED" };
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Equipment.findAndCountAll({
      where,
      include: [
        { model: CalibrationRecord, as: "calibrations", limit: 1, order: [["calibrationDate", "DESC"]] },
        { model: User, as: "responsible", attributes: ["id", "name", "surname"] },
      ],
      order: [["name", "ASC"]],
      limit: parseInt(limit),
      offset,
    });
    res.json({ count, rows, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (e) {
    console.error("Equipment getAll error:", e);
    res.status(500).json({ error: e.message });
  }
};

const getOne = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const equipment = await Equipment.findByPk(id, {
      include: [
        { model: CalibrationRecord, as: "calibrations", order: [["calibrationDate", "DESC"]] },
        { model: User, as: "responsible", attributes: ["id", "name", "surname"] },
      ],
    });
    if (!equipment) return res.status(404).json({ error: "Equipment not found" });
    res.json(equipment);
  } catch (e) {
    console.error("Equipment getOne error:", e);
    res.status(500).json({ error: e.message });
  }
};

const create = async (req, res) => {
  try {
    const count = await Equipment.count();
    const inventoryNumber = `EQ-${String(count + 1).padStart(4, "0")}`;

    const equipment = await Equipment.create({ ...req.body, inventoryNumber });
    await logAudit(req, "equipment.create", "equipment", equipment.id, { inventoryNumber, name: equipment.name });
    res.status(201).json(equipment);
  } catch (e) {
    console.error("Equipment create error:", e);
    res.status(500).json({ error: e.message });
  }
};

const update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const equipment = await Equipment.findByPk(id);
    if (!equipment) return res.status(404).json({ error: "Equipment not found" });

    await equipment.update(req.body);
    await logAudit(req, "equipment.update", "equipment", equipment.id, req.body);
    res.json(equipment);
  } catch (e) {
    console.error("Equipment update error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// CalibrationRecord sub-CRUD
// ═══════════════════════════════════════════════════════════════

const addCalibration = async (req, res) => {
  try {
    const equipmentId = parseInt(req.params.id);
    if (isNaN(equipmentId)) return res.status(400).json({ error: "Invalid ID" });

    const equipment = await Equipment.findByPk(equipmentId);
    if (!equipment) return res.status(404).json({ error: "Equipment not found" });

    const record = await CalibrationRecord.create({
      ...req.body,
      equipmentId,
      performedById: req.user?.id || 1,
    });

    // Update equipment calibration dates
    if (record.calibrationDate) {
      equipment.lastCalibrationDate = record.calibrationDate;
    }
    if (record.nextCalibrationDate) {
      equipment.nextCalibrationDate = record.nextCalibrationDate;
    }
    if (record.result === "FAIL" || record.result === "OUT_OF_TOLERANCE") {
      equipment.status = "OUT_OF_SERVICE";
    } else {
      equipment.status = "IN_SERVICE";
    }
    await equipment.save();

    await logAudit(req, "equipment.calibrate", "calibration", record.id, {
      equipmentId,
      result: record.result,
    });
    res.status(201).json(record);
  } catch (e) {
    console.error("Equipment addCalibration error:", e);
    res.status(500).json({ error: e.message });
  }
};

const updateCalibration = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const record = await CalibrationRecord.findByPk(id);
    if (!record) return res.status(404).json({ error: "Calibration record not found" });

    await record.update(req.body);
    await logAudit(req, "equipment.calibration.update", "calibration", record.id, req.body);
    res.json(record);
  } catch (e) {
    console.error("Equipment updateCalibration error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Statistics
// ═══════════════════════════════════════════════════════════════

const getStats = async (req, res) => {
  try {
    const total = await Equipment.count();
    const inService = await Equipment.count({ where: { status: "IN_SERVICE" } });
    const outOfService = await Equipment.count({ where: { status: "OUT_OF_SERVICE" } });
    const inCalibration = await Equipment.count({ where: { status: "IN_CALIBRATION" } });
    const overdue = await Equipment.count({
      where: {
        nextCalibrationDate: { [Op.lt]: new Date() },
        status: { [Op.ne]: "DECOMMISSIONED" },
      },
    });
    const decommissioned = await Equipment.count({ where: { status: "DECOMMISSIONED" } });
    const totalCalibrations = await CalibrationRecord.count();

    res.json({ total, inService, outOfService, inCalibration, overdue, decommissioned, totalCalibrations });
  } catch (e) {
    console.error("Equipment getStats error:", e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getAll, getOne, create, update, getStats,
  addCalibration, updateCalibration,
};
