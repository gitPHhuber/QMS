const { Complaint } = require("../models/Complaint");
const sequelize = require("../../../db");
const ApiError = require("../../../error/ApiError");
const { logAudit, AUDIT_ACTIONS, AUDIT_ENTITIES } = require("../../core/utils/auditLogger");

const getAll = async (req, res, next) => {
  try {
    const { status, severity, source, category, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const where = {};

    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (source) where.source = source;
    if (category) where.category = category;

    if (dateFrom || dateTo) {
      const { Op } = require("sequelize");
      where.receivedDate = {};
      if (dateFrom) where.receivedDate[Op.gte] = dateFrom;
      if (dateTo) where.receivedDate[Op.lte] = dateTo;
    }

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Complaint.findAndCountAll({
      where,
      order: [["receivedDate", "DESC"], ["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    console.error("Complaint getAll error:", e);
    next(ApiError.internal(e.message));
  }
};

const getOne = async (req, res, next) => {
  try {
    const complaint = await Complaint.findByPk(req.params.id);
    if (!complaint) return next(ApiError.notFound("Рекламация не найдена"));
    res.json(complaint);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Требуется авторизация"));

    const year = new Date().getFullYear();
    const [maxResult] = await sequelize.query(
      `SELECT MAX(CAST(SUBSTRING("complaintNumber" FROM '(\\d+)$') AS INTEGER)) AS max_num FROM complaints WHERE "complaintNumber" LIKE 'CMP-${year}-%'`
    );
    const maxNum = maxResult?.[0]?.max_num || 0;
    const complaintNumber = `CMP-${year}-${String(maxNum + 1).padStart(3, "0")}`;

    // Default due date = received + 30 days
    const receivedDate = req.body.receivedDate || new Date().toISOString().split("T")[0];
    const dueDate = req.body.dueDate || (() => {
      const d = new Date(receivedDate);
      d.setDate(d.getDate() + 30);
      return d.toISOString().split("T")[0];
    })();

    const complaint = await Complaint.create({
      ...req.body,
      complaintNumber,
      receivedDate,
      dueDate,
    });

    await logAudit({
      req,
      action: "COMPLAINT_CREATE",
      entity: "Complaint",
      entityId: complaint.id,
      description: `Создана рекламация: ${complaintNumber}`,
    });

    res.status(201).json(complaint);
  } catch (e) {
    console.error("Complaint create error:", e);
    next(ApiError.internal(e.message));
  }
};

const update = async (req, res, next) => {
  try {
    const complaint = await Complaint.findByPk(req.params.id);
    if (!complaint) return next(ApiError.notFound("Рекламация не найдена"));

    await complaint.update(req.body);

    await logAudit({
      req,
      action: "COMPLAINT_UPDATE",
      entity: "Complaint",
      entityId: complaint.id,
      description: `Обновлена рекламация: ${complaint.complaintNumber}`,
    });

    res.json(complaint);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const getStats = async (req, res, next) => {
  try {
    const total = await Complaint.count();
    const open = await Complaint.count({
      where: { status: ["RECEIVED", "UNDER_REVIEW", "INVESTIGATING"] },
    });
    const critical = await Complaint.count({ where: { severity: "CRITICAL" } });
    const reportable = await Complaint.count({ where: { isReportable: true } });

    const closedComplaints = await Complaint.findAll({
      where: { status: "CLOSED", closedAt: { [require("sequelize").Op.ne]: null } },
      attributes: ["receivedDate", "closedAt"],
    });

    let avgCloseDays = 0;
    if (closedComplaints.length > 0) {
      const totalDays = closedComplaints.reduce((sum, c) => {
        const diff = (new Date(c.closedAt) - new Date(c.receivedDate)) / (1000 * 60 * 60 * 24);
        return sum + diff;
      }, 0);
      avgCloseDays = Math.round(totalDays / closedComplaints.length);
    }

    res.json({ total, open, critical, avgCloseDays, reportable });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

module.exports = { getAll, getOne, create, update, getStats };
