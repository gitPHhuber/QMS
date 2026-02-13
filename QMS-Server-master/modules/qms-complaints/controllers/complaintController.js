const { Complaint } = require("../models/Complaint");
const sequelize = require("../../../db");
const { Op } = require("sequelize");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../../core/utils/auditLogger");

// ─── Vigilance deadline rules (СТО-8.2.3) ───
// Серьёзный инцидент (CRITICAL + SAFETY/PERFORMANCE): 10 календарных дней
// Прочие reportable: 30 календарных дней
function calcVigilanceDeadline(receivedDate, severity, category) {
  const d = new Date(receivedDate);
  const isSeriousIncident =
    severity === "CRITICAL" && (category === "SAFETY" || category === "PERFORMANCE");
  d.setDate(d.getDate() + (isSeriousIncident ? 10 : 30));
  return d.toISOString().split("T")[0];
}

const getAll = async (req, res, next) => {
  try {
    const {
      status, severity, source, category, complaintType,
      vigilanceStatus, isReportable,
      dateFrom, dateTo, page = 1, limit = 50,
    } = req.query;
    const where = {};

    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (source) where.source = source;
    if (category) where.category = category;
    if (complaintType) where.complaintType = complaintType;
    if (vigilanceStatus) where.vigilanceStatus = vigilanceStatus;
    if (isReportable !== undefined) where.isReportable = isReportable === "true";

    if (dateFrom || dateTo) {
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

    // Vigilance deadline auto-calculation (СТО-8.2.3)
    const isReportable = req.body.isReportable || false;
    let vigilanceStatus = "NOT_REQUIRED";
    let vigilanceDeadline = null;
    if (isReportable) {
      vigilanceStatus = "PENDING";
      vigilanceDeadline =
        req.body.vigilanceDeadline ||
        calcVigilanceDeadline(receivedDate, req.body.severity, req.body.category);
    }

    const complaint = await Complaint.create({
      ...req.body,
      complaintNumber,
      receivedDate,
      dueDate,
      vigilanceStatus,
      vigilanceDeadline,
      createdById: req.user.id,
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

    // Recalculate vigilance deadline if reportability changed
    const updates = { ...req.body };
    if (updates.isReportable === true && complaint.vigilanceStatus === "NOT_REQUIRED") {
      updates.vigilanceStatus = "PENDING";
      if (!updates.vigilanceDeadline) {
        const rcvDate = updates.receivedDate || complaint.receivedDate;
        const sev = updates.severity || complaint.severity;
        const cat = updates.category || complaint.category;
        updates.vigilanceDeadline = calcVigilanceDeadline(rcvDate, sev, cat);
      }
    } else if (updates.isReportable === false) {
      updates.vigilanceStatus = "NOT_REQUIRED";
      updates.vigilanceDeadline = null;
    }

    await complaint.update(updates);

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

// ─── Подача vigilance-уведомления (СТО-8.2.3 §5) ───
const submitVigilance = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Требуется авторизация"));

    const complaint = await Complaint.findByPk(req.params.id);
    if (!complaint) return next(ApiError.notFound("Рекламация не найдена"));

    if (!complaint.isReportable) {
      return next(ApiError.badRequest("Рекламация не подлежит уведомлению регулятора"));
    }
    if (complaint.vigilanceStatus === "SUBMITTED" || complaint.vigilanceStatus === "ACKNOWLEDGED") {
      return next(ApiError.badRequest(`Уведомление уже отправлено (статус: ${complaint.vigilanceStatus})`));
    }

    // Auto-generate vigilance report number
    const year = new Date().getFullYear();
    const [maxVR] = await sequelize.query(
      `SELECT MAX(CAST(SUBSTRING("vigilanceReportNumber" FROM '(\\d+)$') AS INTEGER)) AS max_num FROM complaints WHERE "vigilanceReportNumber" LIKE 'VR-${year}-%'`
    );
    const maxNum = maxVR?.[0]?.max_num || 0;
    const vigilanceReportNumber = `VR-${year}-${String(maxNum + 1).padStart(3, "0")}`;

    await complaint.update({
      vigilanceReportNumber,
      vigilanceStatus: "SUBMITTED",
      vigilanceSubmittedAt: new Date(),
      vigilanceSubmittedById: req.user.id,
      vigilanceNotes: req.body.vigilanceNotes || complaint.vigilanceNotes,
    });

    await logAudit({
      req,
      action: "VIGILANCE_SUBMIT",
      entity: "Complaint",
      entityId: complaint.id,
      description: `Подано vigilance-уведомление ${vigilanceReportNumber} для ${complaint.complaintNumber}`,
    });

    res.json(complaint);
  } catch (e) {
    console.error("Vigilance submit error:", e);
    next(ApiError.internal(e.message));
  }
};

// ─── Подтверждение получения от регулятора ───
const acknowledgeVigilance = async (req, res, next) => {
  try {
    const complaint = await Complaint.findByPk(req.params.id);
    if (!complaint) return next(ApiError.notFound("Рекламация не найдена"));

    if (complaint.vigilanceStatus !== "SUBMITTED") {
      return next(ApiError.badRequest("Уведомление не в статусе SUBMITTED"));
    }

    await complaint.update({
      vigilanceStatus: "ACKNOWLEDGED",
      vigilanceAcknowledgedAt: new Date(),
      regulatoryAuthorityRef: req.body.regulatoryAuthorityRef || complaint.regulatoryAuthorityRef,
      vigilanceNotes: req.body.vigilanceNotes || complaint.vigilanceNotes,
    });

    await logAudit({
      req,
      action: "VIGILANCE_ACKNOWLEDGE",
      entity: "Complaint",
      entityId: complaint.id,
      description: `Подтверждение vigilance от регулятора для ${complaint.complaintNumber}`,
    });

    res.json(complaint);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

// ─── Просроченные vigilance (контроль сроков СТО-8.2.3 §6) ───
const getOverdueVigilance = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const overdue = await Complaint.findAll({
      where: {
        isReportable: true,
        vigilanceStatus: "PENDING",
        vigilanceDeadline: { [Op.lt]: today },
      },
      order: [["vigilanceDeadline", "ASC"]],
    });

    const approaching = await Complaint.findAll({
      where: {
        isReportable: true,
        vigilanceStatus: "PENDING",
        vigilanceDeadline: {
          [Op.gte]: today,
          [Op.lte]: (() => {
            const d = new Date();
            d.setDate(d.getDate() + 3);
            return d.toISOString().split("T")[0];
          })(),
        },
      },
      order: [["vigilanceDeadline", "ASC"]],
    });

    res.json({ overdue, approaching, overdueCount: overdue.length, approachingCount: approaching.length });
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

    // Vigilance stats (СТО-8.2.3)
    const vigilancePending = await Complaint.count({ where: { vigilanceStatus: "PENDING" } });
    const vigilanceSubmitted = await Complaint.count({ where: { vigilanceStatus: "SUBMITTED" } });

    const today = new Date().toISOString().split("T")[0];
    const vigilanceOverdue = await Complaint.count({
      where: {
        isReportable: true,
        vigilanceStatus: "PENDING",
        vigilanceDeadline: { [Op.lt]: today },
      },
    });

    // Complaint type breakdown
    const complaints = await Complaint.count({ where: { complaintType: "COMPLAINT" } });
    const reclamations = await Complaint.count({ where: { complaintType: "RECLAMATION" } });
    const feedbacks = await Complaint.count({ where: { complaintType: "FEEDBACK" } });

    const closedComplaints = await Complaint.findAll({
      where: { status: "CLOSED", closedAt: { [Op.ne]: null } },
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

    res.json({
      total,
      open,
      critical,
      avgCloseDays,
      reportable,
      vigilance: {
        pending: vigilancePending,
        submitted: vigilanceSubmitted,
        overdue: vigilanceOverdue,
      },
      byType: {
        complaints,
        reclamations,
        feedbacks,
      },
    });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

module.exports = {
  getAll,
  getOne,
  create,
  update,
  getStats,
  submitVigilance,
  acknowledgeVigilance,
  getOverdueVigilance,
};
