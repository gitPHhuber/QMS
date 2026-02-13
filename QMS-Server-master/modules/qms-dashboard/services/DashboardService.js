/**
 * DashboardService.js — Централизованная агрегация данных для дашборда СМК
 *
 * Собирает KPI со всех модулей в параллели через Promise.allSettled(),
 * что обеспечивает graceful degradation при отключённых модулях.
 */

const { Op } = require("sequelize");
const sequelize = require("../../../db");
const { QualityObjective } = require("../models/QualityObjective");

// ═══════════════════════════════════════════════════════════════
// Ленивая загрузка моделей из опциональных модулей
// ═══════════════════════════════════════════════════════════════

const _cache = {};

function lazyModel(modulePath, modelName) {
  const key = `${modulePath}:${modelName}`;
  if (key in _cache) return _cache[key];
  try {
    const mod = require(modulePath);
    _cache[key] = mod[modelName] || null;
    return _cache[key];
  } catch {
    _cache[key] = null;
    return null;
  }
}

function getNonconformity() { return lazyModel("../../qms-nc/models/NcCapa", "Nonconformity"); }
function getCapa()           { return lazyModel("../../qms-nc/models/NcCapa", "Capa"); }
function getCapaAction()     { return lazyModel("../../qms-nc/models/NcCapa", "CapaAction"); }
function getRiskRegister()   { return lazyModel("../../qms-risk/models/Risk", "RiskRegister"); }
function getComplaint()      { return lazyModel("../../qms-complaints/models/Complaint", "Complaint"); }
function getDocument()       { return lazyModel("../../qms-dms/models/Document", "Document"); }
function getDocApproval()    { return lazyModel("../../qms-dms/models/Document", "DocumentApproval"); }
function getAuditSchedule()  { return lazyModel("../../qms-audit/models/InternalAudit", "AuditSchedule"); }
function getAuditFinding()   { return lazyModel("../../qms-audit/models/InternalAudit", "AuditFinding"); }
function getEquipment()      { return lazyModel("../../qms-equipment/models/Equipment", "Equipment"); }
function getTrainingRecord() { return lazyModel("../../qms-training/models/Training", "TrainingRecord"); }
function getSupplier()       { return lazyModel("../../qms-supplier/models/Supplier", "Supplier"); }
function getMgmtReview()     { return lazyModel("../../qms-review/models/ManagementReview", "ManagementReview"); }
function getReviewAction()   { return lazyModel("../../qms-review/models/ManagementReview", "ReviewAction"); }

// ═══════════════════════════════════════════════════════════════
// Утилиты
// ═══════════════════════════════════════════════════════════════

/** Начало текущего месяца */
function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** 12 месяцев назад */
function twelveMonthsAgo() {
  const d = new Date();
  d.setMonth(d.getMonth() - 12);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ═══════════════════════════════════════════════════════════════
// Сервис
// ═══════════════════════════════════════════════════════════════

class DashboardService {

  // ────────────────────────────────────────────────────────────
  // SUMMARY — единый агрегированный ответ
  // ────────────────────────────────────────────────────────────

  async getSummary() {
    const [
      nc, capa, risks, complaints, documents,
      audits, equipment, training, suppliers,
      review, objectives, timeline,
    ] = await Promise.allSettled([
      this._getNcSummary(),
      this._getCapaSummary(),
      this._getRiskSummary(),
      this._getComplaintsSummary(),
      this._getDocumentsSummary(),
      this._getAuditSummary(),
      this._getEquipmentSummary(),
      this._getTrainingSummary(),
      this._getSupplierSummary(),
      this._getReviewSummary(),
      this._getQualityObjectives(),
      this._getTimeline(),
    ]);

    const val = (r) => r.status === "fulfilled" ? r.value : null;

    return {
      nc:                val(nc),
      capa:              val(capa),
      risks:             val(risks),
      complaints:        val(complaints),
      documents:         val(documents),
      audits:            val(audits),
      equipment:         val(equipment),
      training:          val(training),
      suppliers:         val(suppliers),
      review:            val(review),
      qualityObjectives: val(objectives),
      timeline:          val(timeline),
      generatedAt:       new Date().toISOString(),
    };
  }

  // ────────────────────────────────────────────────────────────
  // TRENDS — помесячные тренды за 12 месяцев
  // ────────────────────────────────────────────────────────────

  async getTrends() {
    const since = twelveMonthsAgo();
    const results = { nc: [], capa: [], complaints: [] };

    const Nonconformity = getNonconformity();
    if (Nonconformity) {
      const [ncRows, capaRows] = await Promise.all([
        sequelize.query(`
          SELECT TO_CHAR(DATE_TRUNC('month', "detectedAt"), 'YYYY-MM') AS month,
                 COUNT(*)::int AS count
          FROM nonconformities
          WHERE "detectedAt" >= :since
          GROUP BY DATE_TRUNC('month', "detectedAt")
          ORDER BY month
        `, { replacements: { since }, type: sequelize.QueryTypes.SELECT }),

        sequelize.query(`
          SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
                 COUNT(*)::int AS count
          FROM capas
          WHERE "createdAt" >= :since
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY month
        `, { replacements: { since }, type: sequelize.QueryTypes.SELECT }),
      ]);
      results.nc = ncRows;
      results.capa = capaRows;
    }

    const Complaint = getComplaint();
    if (Complaint) {
      const cmpRows = await sequelize.query(`
        SELECT TO_CHAR(DATE_TRUNC('month', "receivedDate"), 'YYYY-MM') AS month,
               COUNT(*)::int AS count
        FROM complaints
        WHERE "receivedDate" >= :since
        GROUP BY DATE_TRUNC('month', "receivedDate")
        ORDER BY month
      `, { replacements: { since }, type: sequelize.QueryTypes.SELECT });
      results.complaints = cmpRows;
    }

    return results;
  }

  // ────────────────────────────────────────────────────────────
  // Sub-queries
  // ────────────────────────────────────────────────────────────

  async _getNcSummary() {
    const Nonconformity = getNonconformity();
    if (!Nonconformity) return null;

    const [openCount, overdueCount, byClassification] = await Promise.all([
      Nonconformity.count({ where: { status: { [Op.notIn]: ["CLOSED"] } } }),
      Nonconformity.count({
        where: {
          status: { [Op.notIn]: ["CLOSED"] },
          dueDate: { [Op.lt]: new Date() },
        },
      }),
      Nonconformity.findAll({
        attributes: ["classification", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
        where: { status: { [Op.notIn]: ["CLOSED"] } },
        group: ["classification"],
        raw: true,
      }),
    ]);

    const classMap = {};
    for (const row of byClassification) {
      classMap[row.classification] = parseInt(row.count, 10);
    }

    return { openCount, overdueCount, byClassification: classMap };
  }

  async _getCapaSummary() {
    const Capa = getCapa();
    if (!Capa) return null;

    const closedStatuses = ["CLOSED", "EFFECTIVE"];
    const activeWhere = { status: { [Op.notIn]: closedStatuses } };

    const [activeCount, overdueCount, effectiveCount, closedTotalCount, closedCapas, overdueList] = await Promise.all([
      Capa.count({ where: activeWhere }),
      Capa.count({
        where: {
          ...activeWhere,
          dueDate: { [Op.lt]: new Date() },
        },
      }),
      Capa.count({ where: { status: "EFFECTIVE" } }),
      Capa.count({ where: { status: { [Op.in]: closedStatuses } } }),
      // Avg close days
      sequelize.query(`
        SELECT ROUND(AVG(EXTRACT(EPOCH FROM ("closedAt" - "createdAt")) / 86400))::int AS avg_days
        FROM capas WHERE status IN ('CLOSED', 'EFFECTIVE') AND "closedAt" IS NOT NULL
      `, { type: sequelize.QueryTypes.SELECT }),
      // Top 5 overdue
      Capa.findAll({
        where: {
          ...activeWhere,
          dueDate: { [Op.lt]: new Date() },
        },
        attributes: ["id", "number", "title", "dueDate"],
        order: [["dueDate", "ASC"]],
        limit: 5,
        raw: true,
      }),
    ]);

    const avgCloseDays = closedCapas[0]?.avg_days || 0;
    const effectivenessRate = closedTotalCount > 0
      ? Math.round((effectiveCount / closedTotalCount) * 100)
      : 0;

    // Calculate overdue days
    const now = new Date();
    const overdueItems = overdueList.map(c => ({
      ...c,
      overdueDays: Math.ceil((now - new Date(c.dueDate)) / 86400000),
    }));

    return { activeCount, overdueCount, effectivenessRate, avgCloseDays, overdueItems };
  }

  async _getRiskSummary() {
    const RiskRegister = getRiskRegister();
    if (!RiskRegister) return null;

    const activeWhere = { status: { [Op.notIn]: ["CLOSED"] } };

    const [matrixRows, classRows] = await Promise.all([
      // Risk matrix 5x5 cell counts (use residual if available, else initial)
      sequelize.query(`
        SELECT
          COALESCE("residualProbability", "initialProbability") AS prob,
          COALESCE("residualSeverity", "initialSeverity") AS sev,
          COUNT(*)::int AS count
        FROM risk_registers
        WHERE status NOT IN ('CLOSED')
        GROUP BY prob, sev
      `, { type: sequelize.QueryTypes.SELECT }),

      RiskRegister.findAll({
        attributes: [
          [sequelize.fn("COALESCE", sequelize.col("residualRiskClass"), sequelize.col("initialRiskClass")), "riskClass"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        where: activeWhere,
        group: [sequelize.fn("COALESCE", sequelize.col("residualRiskClass"), sequelize.col("initialRiskClass"))],
        raw: true,
      }),
    ]);

    const cellCounts = {};
    for (const row of matrixRows) {
      if (row.prob && row.sev) {
        cellCounts[`${row.prob}-${row.sev}`] = row.count;
      }
    }

    const byClass = {};
    for (const row of classRows) {
      byClass[row.riskClass] = parseInt(row.count, 10);
    }

    return { cellCounts, byClass };
  }

  async _getComplaintsSummary() {
    const Complaint = getComplaint();
    if (!Complaint) return null;

    const openStatuses = ["RECEIVED", "UNDER_REVIEW", "INVESTIGATING"];
    const monthStart = startOfMonth();

    const [open, investigating, closedThisMonth, avgResp] = await Promise.all([
      Complaint.count({ where: { status: { [Op.in]: openStatuses } } }),
      Complaint.count({ where: { status: "INVESTIGATING" } }),
      Complaint.count({
        where: {
          status: "CLOSED",
          closedAt: { [Op.gte]: monthStart },
        },
      }),
      sequelize.query(`
        SELECT ROUND(AVG(EXTRACT(EPOCH FROM ("closedAt" - "createdAt")) / 86400), 1) AS avg_days
        FROM complaints WHERE status = 'CLOSED' AND "closedAt" IS NOT NULL
      `, { type: sequelize.QueryTypes.SELECT }),
    ]);

    return {
      open,
      investigating,
      closedThisMonth,
      avgResponseDays: parseFloat(avgResp[0]?.avg_days) || 0,
    };
  }

  async _getDocumentsSummary() {
    const Document = getDocument();
    const DocApproval = getDocApproval();
    if (!Document) return null;

    const [awaitingReview, overdue, pendingDocs] = await Promise.all([
      DocApproval
        ? DocApproval.count({ where: { decision: "PENDING" } })
        : 0,
      Document.count({
        where: {
          status: "EFFECTIVE",
          nextReviewDate: { [Op.lt]: new Date() },
        },
      }),
      DocApproval
        ? DocApproval.findAll({
            where: { decision: "PENDING" },
            attributes: ["id", "dueDate"],
            include: [{
              model: lazyModel("../../qms-dms/models/Document", "DocumentVersion"),
              as: "version",
              attributes: ["id", "version"],
              include: [{
                model: Document,
                as: "document",
                attributes: ["id", "code", "title"],
              }],
            }],
            order: [["dueDate", "ASC"]],
            limit: 5,
          })
        : [],
    ]);

    return { awaitingReview, overdue, pendingDocs };
  }

  async _getAuditSummary() {
    const AuditSchedule = getAuditSchedule();
    const AuditFinding = getAuditFinding();
    if (!AuditSchedule) return null;

    const now = new Date();

    const [nextAudit, openFindings] = await Promise.all([
      AuditSchedule.findOne({
        where: {
          plannedDate: { [Op.gte]: now },
          status: { [Op.in]: ["PLANNED", "IN_PROGRESS"] },
        },
        attributes: ["id", "auditNumber", "title", "scope", "plannedDate", "status", "leadAuditorId"],
        order: [["plannedDate", "ASC"]],
        raw: true,
      }),
      AuditFinding
        ? AuditFinding.count({ where: { status: { [Op.in]: ["OPEN", "ACTION_REQUIRED"] } } })
        : 0,
    ]);

    return { next: nextAudit, openFindings };
  }

  async _getEquipmentSummary() {
    const Equipment = getEquipment();
    if (!Equipment) return null;

    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const upcoming = await Equipment.findAll({
      where: {
        nextCalibrationDate: { [Op.between]: [now, in30Days] },
        status: { [Op.ne]: "DECOMMISSIONED" },
      },
      attributes: ["id", "inventoryNumber", "name", "nextCalibrationDate"],
      order: [["nextCalibrationDate", "ASC"]],
      limit: 5,
      raw: true,
    });

    // Calculate days until calibration
    const upcomingCalibrations = upcoming.map(eq => ({
      ...eq,
      daysUntil: Math.ceil((new Date(eq.nextCalibrationDate) - now) / 86400000),
    }));

    return { upcomingCalibrations };
  }

  async _getTrainingSummary() {
    const TrainingRecord = getTrainingRecord();
    if (!TrainingRecord) return null;

    const [completed, planned, expired] = await Promise.all([
      TrainingRecord.count({ where: { status: "COMPLETED" } }),
      TrainingRecord.count({ where: { status: "PLANNED" } }),
      TrainingRecord.count({ where: { status: "EXPIRED" } }),
    ]);

    return { completed, planned, expired, totalRecords: completed + planned + expired };
  }

  async _getSupplierSummary() {
    const Supplier = getSupplier();
    if (!Supplier) return null;

    const rows = await Supplier.findAll({
      attributes: [
        "qualificationStatus",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["qualificationStatus"],
      raw: true,
    });

    const byStatus = {};
    let total = 0;
    for (const row of rows) {
      const cnt = parseInt(row.count, 10);
      byStatus[row.qualificationStatus] = cnt;
      total += cnt;
    }

    const approvedPct = total > 0
      ? Math.round(((byStatus.QUALIFIED || 0) / total) * 100)
      : 0;

    return { byStatus, total, approvedPct };
  }

  async _getReviewSummary() {
    const MgmtReview = getMgmtReview();
    const ReviewAction = getReviewAction();
    if (!MgmtReview) return null;

    const now = new Date();

    const [nextReview, actionStats] = await Promise.all([
      MgmtReview.findOne({
        where: {
          reviewDate: { [Op.gte]: now },
          status: { [Op.in]: ["PLANNED", "IN_PROGRESS"] },
        },
        attributes: ["id", "reviewNumber", "title", "reviewDate", "status"],
        order: [["reviewDate", "ASC"]],
        raw: true,
      }),
      ReviewAction
        ? ReviewAction.findAll({
            attributes: [
              "status",
              [sequelize.fn("COUNT", sequelize.col("id")), "count"],
            ],
            group: ["status"],
            raw: true,
          })
        : [],
    ]);

    let completedActions = 0;
    let totalActions = 0;
    for (const row of actionStats) {
      const cnt = parseInt(row.count, 10);
      totalActions += cnt;
      if (row.status === "COMPLETED") completedActions += cnt;
    }

    const readinessPercent = totalActions > 0
      ? Math.round((completedActions / totalActions) * 100)
      : 0;

    let daysUntil = null;
    if (nextReview) {
      daysUntil = Math.ceil((new Date(nextReview.reviewDate) - now) / 86400000);
    }

    return { next: nextReview, daysUntil, readinessPercent };
  }

  async _getQualityObjectives() {
    const objectives = await QualityObjective.findAll({
      where: { status: "ACTIVE" },
      order: [["dueDate", "ASC"]],
      raw: true,
    });
    return objectives;
  }

  async _getTimeline() {
    // Собираем последние события из разных модулей
    const events = [];

    const Nonconformity = getNonconformity();
    if (Nonconformity) {
      const ncs = await Nonconformity.findAll({
        attributes: ["id", "number", "title", "detectedAt"],
        order: [["detectedAt", "DESC"]],
        limit: 5,
        raw: true,
      });
      for (const nc of ncs) {
        events.push({
          date: nc.detectedAt,
          code: nc.number,
          text: nc.title,
          category: "nc",
        });
      }
    }

    const Capa = getCapa();
    if (Capa) {
      const capas = await Capa.findAll({
        attributes: ["id", "number", "title", "createdAt"],
        order: [["createdAt", "DESC"]],
        limit: 5,
        raw: true,
      });
      for (const c of capas) {
        events.push({
          date: c.createdAt,
          code: c.number,
          text: c.title,
          category: "capa",
        });
      }
    }

    const AuditFinding = getAuditFinding();
    if (AuditFinding) {
      const findings = await AuditFinding.findAll({
        attributes: ["id", "findingNumber", "description", "createdAt"],
        order: [["createdAt", "DESC"]],
        limit: 3,
        raw: true,
      });
      for (const f of findings) {
        events.push({
          date: f.createdAt,
          code: f.findingNumber,
          text: f.description?.substring(0, 80) || "Результат аудита",
          category: "audit",
        });
      }
    }

    const RiskRegister = getRiskRegister();
    if (RiskRegister) {
      const risks = await RiskRegister.findAll({
        attributes: ["id", "riskNumber", "title", "createdAt"],
        order: [["createdAt", "DESC"]],
        limit: 3,
        raw: true,
      });
      for (const r of risks) {
        events.push({
          date: r.createdAt,
          code: r.riskNumber,
          text: r.title,
          category: "risk",
        });
      }
    }

    const Document = getDocument();
    if (Document) {
      const docs = await Document.findAll({
        attributes: ["id", "code", "title", "updatedAt"],
        where: { status: { [Op.in]: ["APPROVED", "EFFECTIVE"] } },
        order: [["updatedAt", "DESC"]],
        limit: 3,
        raw: true,
      });
      for (const d of docs) {
        events.push({
          date: d.updatedAt,
          code: d.code,
          text: d.title,
          category: "doc",
        });
      }
    }

    // Сортируем по дате и берём последние 15
    events.sort((a, b) => new Date(b.date) - new Date(a.date));
    return events.slice(0, 15);
  }
}

module.exports = DashboardService;
