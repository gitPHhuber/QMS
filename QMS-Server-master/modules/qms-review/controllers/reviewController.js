const { ManagementReview, ReviewAction } = require("../models/ManagementReview");
const { User } = require("../../../models/index");
const { Nonconformity, Capa } = require("../../qms-nc/models/NcCapa");
const { Op } = require("sequelize");
const { logAudit } = require("../../core/utils/auditLogger");

// ═══════════════════════════════════════════════════════════════
// ManagementReview CRUD
// ═══════════════════════════════════════════════════════════════

const getAll = async (req, res) => {
  try {
    const { year, status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (year) {
      const { Op } = require("sequelize");
      where.reviewDate = {
        [Op.gte]: new Date(`${year}-01-01`),
        [Op.lte]: new Date(`${year}-12-31`),
      };
    }
    if (status) where.status = status;

    const offset = (page - 1) * limit;
    const { count, rows } = await ManagementReview.findAndCountAll({
      where,
      include: [{ model: ReviewAction, as: "actions" }],
      order: [["reviewDate", "DESC"]],
      limit: parseInt(limit),
      offset,
    });
    res.json({ count, rows, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (e) {
    console.error("ManagementReview getAll error:", e);
    res.status(500).json({ error: e.message });
  }
};

const getOne = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const review = await ManagementReview.findByPk(id, {
      include: [{ model: ReviewAction, as: "actions" }],
    });
    if (!review) return res.status(404).json({ error: "Review not found" });
    res.json(review);
  } catch (e) {
    console.error("ManagementReview getOne error:", e);
    res.status(500).json({ error: e.message });
  }
};

const create = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const count = await ManagementReview.count();
    const reviewNumber = `MR-${year}-${String(count + 1).padStart(2, "0")}`;

    const review = await ManagementReview.create({
      ...req.body,
      reviewNumber,
      chairpersonId: req.body.chairpersonId || req.user?.id || 1,
    });
    await logAudit(req, "management_review.create", "management_review", review.id, { reviewNumber });
    res.status(201).json(review);
  } catch (e) {
    console.error("ManagementReview create error:", e);
    res.status(500).json({ error: e.message });
  }
};

const update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const review = await ManagementReview.findByPk(id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    await review.update(req.body);
    await logAudit(req, "management_review.update", "management_review", review.id, req.body);
    res.json(review);
  } catch (e) {
    console.error("ManagementReview update error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// ReviewAction sub-CRUD
// ═══════════════════════════════════════════════════════════════

const addAction = async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    if (isNaN(reviewId)) return res.status(400).json({ error: "Invalid ID" });

    const review = await ManagementReview.findByPk(reviewId);
    if (!review) return res.status(404).json({ error: "Review not found" });

    const action = await ReviewAction.create({
      ...req.body,
      managementReviewId: reviewId,
    });
    await logAudit(req, "management_review.action.create", "management_review", reviewId, {
      actionId: action.id,
      description: action.description,
    });
    res.status(201).json(action);
  } catch (e) {
    console.error("ReviewAction addAction error:", e);
    res.status(500).json({ error: e.message });
  }
};

const updateAction = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const action = await ReviewAction.findByPk(id);
    if (!action) return res.status(404).json({ error: "Action not found" });

    // Auto-set completedAt when status changes to COMPLETED
    if (req.body.status === "COMPLETED" && !action.completedAt) {
      req.body.completedAt = new Date();
    }

    await action.update(req.body);
    await logAudit(req, "management_review.action.update", "management_review", action.managementReviewId, {
      actionId: action.id,
    });
    res.json(action);
  } catch (e) {
    console.error("ReviewAction updateAction error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Statistics
// ═══════════════════════════════════════════════════════════════

const getStats = async (req, res) => {
  try {
    const totalReviews = await ManagementReview.count();
    const completed = await ManagementReview.count({ where: { status: "COMPLETED" } });
    const approved = await ManagementReview.count({ where: { status: "APPROVED" } });
    const planned = await ManagementReview.count({ where: { status: "PLANNED" } });
    const totalActions = await ReviewAction.count();
    const openActions = await ReviewAction.count({ where: { status: "OPEN" } });
    const overdueActions = await ReviewAction.count({ where: { status: "OVERDUE" } });

    res.json({ totalReviews, completed, approved, planned, totalActions, openActions, overdueActions });
  } catch (e) {
    console.error("ManagementReview getStats error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// Dashboard
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/reviews/dashboard
 *
 * Формат ответа (готов для прямой отрисовки dashboard):
 * {
 *   summary: {
 *     nonconformitiesTotal: number,
 *     qualityGoalsTotal: number,
 *     qualityGoalsAchieved: number,
 *     qualityGoalsAtRisk: number,
 *     qualityGoalsOverdue: number
 *   },
 *   series: {
 *     nonconformityTrend: [{ month: "YYYY-MM", count: number }],
 *     processKpi: [
 *       { code, title, formula, value, unit, numerator, denominator }
 *     ],
 *     qualityGoalsStatus: [
 *       { status: "ACHIEVED"|"AT_RISK"|"OVERDUE", value: number }
 *     ]
 *   }
 * }
 */
const getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const monthSeries = [];

    // 1) Тренды NC (последние 12 месяцев, включая текущий)
    for (let i = 11; i >= 0; i -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const count = await Nonconformity.count({
        where: {
          detectedAt: {
            [Op.gte]: start,
            [Op.lt]: end,
          },
        },
      });

      monthSeries.push({
        month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
        count,
      });
    }

    const [
      nonconformitiesTotal,
      closedNcCount,
      totalCapa,
      effectiveCapa,
      totalReviewActions,
      completedReviewActions,
      latestReview,
    ] = await Promise.all([
      Nonconformity.count(),
      Nonconformity.count({ where: { status: "CLOSED" } }),
      Capa.count(),
      Capa.count({ where: { status: "EFFECTIVE" } }),
      ReviewAction.count(),
      ReviewAction.count({ where: { status: "COMPLETED" } }),
      ManagementReview.findOne({ order: [["reviewDate", "DESC"]] }),
    ]);

    // 2) KPI процессов СМК (согласованный минимальный набор)
    const processKpi = [
      {
        code: "NC_CLOSURE_RATE",
        title: "Доля закрытых несоответствий",
        formula: "(closedNcCount / nonconformitiesTotal) * 100",
        value: nonconformitiesTotal ? Number(((closedNcCount / nonconformitiesTotal) * 100).toFixed(2)) : 0,
        unit: "%",
        numerator: closedNcCount,
        denominator: nonconformitiesTotal,
      },
      {
        code: "CAPA_EFFECTIVENESS_RATE",
        title: "Доля результативных CAPA",
        formula: "(effectiveCapa / totalCapa) * 100",
        value: totalCapa ? Number(((effectiveCapa / totalCapa) * 100).toFixed(2)) : 0,
        unit: "%",
        numerator: effectiveCapa,
        denominator: totalCapa,
      },
      {
        code: "REVIEW_ACTION_COMPLETION_RATE",
        title: "Исполнение действий по анализу руководства",
        formula: "(completedReviewActions / totalReviewActions) * 100",
        value: totalReviewActions ? Number(((completedReviewActions / totalReviewActions) * 100).toFixed(2)) : 0,
        unit: "%",
        numerator: completedReviewActions,
        denominator: totalReviewActions,
      },
    ];

    // 3) Статус целей качества (последний management review)
    const rawQualityGoals = Array.isArray(latestReview?.outputData?.qualityObjectives)
      ? latestReview.outputData.qualityObjectives
      : [];

    const goalsStatus = { ACHIEVED: 0, AT_RISK: 0, OVERDUE: 0 };

    const hasFiniteMetricValue = (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === "string" && value.trim() === "") return false;

      const parsed = Number(value);
      return Number.isFinite(parsed);
    };

    rawQualityGoals.forEach((goal) => {
      const status = String(goal?.status || "").toUpperCase();
      const dueDate = goal?.dueDate ? new Date(goal.dueDate) : null;
      const hasValidTarget = hasFiniteMetricValue(goal?.target);
      const hasValidActual = hasFiniteMetricValue(goal?.actual);
      const target = hasValidTarget ? Number(goal.target) : null;
      const actual = hasValidActual ? Number(goal.actual) : null;

      if (status === "OVERDUE") {
        goalsStatus.OVERDUE += 1;
        return;
      }

      if (status === "ACHIEVED" || (target !== null && actual !== null && actual >= target)) {
        goalsStatus.ACHIEVED += 1;
        return;
      }

      if (status === "AT_RISK") {
        goalsStatus.AT_RISK += 1;
        return;
      }

      if (dueDate && !Number.isNaN(dueDate.getTime()) && dueDate < now) {
        goalsStatus.OVERDUE += 1;
      } else {
        goalsStatus.AT_RISK += 1;
      }
    });

    const qualityGoalsStatus = [
      { status: "ACHIEVED", value: goalsStatus.ACHIEVED },
      { status: "AT_RISK", value: goalsStatus.AT_RISK },
      { status: "OVERDUE", value: goalsStatus.OVERDUE },
    ];

    res.json({
      summary: {
        nonconformitiesTotal,
        qualityGoalsTotal: rawQualityGoals.length,
        qualityGoalsAchieved: goalsStatus.ACHIEVED,
        qualityGoalsAtRisk: goalsStatus.AT_RISK,
        qualityGoalsOverdue: goalsStatus.OVERDUE,
      },
      series: {
        nonconformityTrend: monthSeries,
        processKpi,
        qualityGoalsStatus,
      },
    });
  } catch (e) {
    console.error("ManagementReview getDashboard error:", e);
    res.status(500).json({ error: e.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// PDF Minutes (Протокол совещания)  ISO 13485 §5.6
// ═══════════════════════════════════════════════════════════════

const getMinutesPdf = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const review = await ManagementReview.findByPk(id, {
      include: [{ model: ReviewAction, as: "actions" }],
    });
    if (!review) return res.status(404).json({ error: "Review not found" });

    const PdfPrinter = require("pdfmake");
    const fonts = {
      Roboto: {
        normal: require("path").join(__dirname, "../../../node_modules/pdfmake/build/vfs_fonts.js") ? "Helvetica" : "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
    };
    const printer = new PdfPrinter(fonts);

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString("ru-RU") : "—";
    const participants = Array.isArray(review.participants) ? review.participants : [];
    const inputData = review.inputData || {};
    const outputData = review.outputData || {};
    const actions = review.actions || [];
    const decisions = Array.isArray(outputData.decisions) ? outputData.decisions : [];

    const docDefinition = {
      defaultStyle: { font: "Roboto", fontSize: 10 },
      pageMargins: [40, 60, 40, 50],
      content: [
        { text: "ПРОТОКОЛ АНАЛИЗА СО СТОРОНЫ РУКОВОДСТВА", style: "header", alignment: "center", margin: [0, 0, 0, 5] },
        { text: `ISO 13485:2016 §5.6`, style: "subheader", alignment: "center", margin: [0, 0, 0, 15] },

        // General info
        {
          table: {
            widths: [140, "*"],
            body: [
              [{ text: "Номер протокола:", bold: true }, review.reviewNumber || "—"],
              [{ text: "Тема:", bold: true }, review.title || "—"],
              [{ text: "Дата совещания:", bold: true }, fmtDate(review.reviewDate)],
              [{ text: "Анализируемый период:", bold: true }, `${fmtDate(review.periodFrom)} — ${fmtDate(review.periodTo)}`],
              [{ text: "Результативность СМК:", bold: true }, review.qmsEffectiveness === "EFFECTIVE" ? "Результативна" : review.qmsEffectiveness === "PARTIALLY_EFFECTIVE" ? "Частично результативна" : review.qmsEffectiveness === "INEFFECTIVE" ? "Не результативна" : "—"],
            ],
          },
          layout: "lightHorizontalLines",
          margin: [0, 0, 0, 15],
        },

        // Participants
        { text: "УЧАСТНИКИ СОВЕЩАНИЯ", style: "sectionTitle", margin: [0, 0, 0, 5] },
        participants.length > 0
          ? {
              table: {
                widths: ["*", 150],
                headerRows: 1,
                body: [
                  [{ text: "ФИО", bold: true }, { text: "Должность/Роль", bold: true }],
                  ...participants.map((p) => [p.name || "—", p.role || "—"]),
                ],
              },
              layout: "lightHorizontalLines",
              margin: [0, 0, 0, 15],
            }
          : { text: "Участники не указаны", italics: true, margin: [0, 0, 0, 15] },

        // Input data (§5.6.2)
        { text: "ВХОДНЫЕ ДАННЫЕ (ISO 13485 §5.6.2)", style: "sectionTitle", margin: [0, 0, 0, 5] },
        {
          ul: [
            `Результаты аудитов: ${inputData.auditResults?.total ?? "—"} (находок: ${inputData.auditResults?.findings ?? "—"}, закрыто: ${inputData.auditResults?.closed ?? "—"})`,
            `Обратная связь потребителей: рекламации ${inputData.customerFeedback?.complaints ?? "—"}, удовлетворённость ${inputData.customerFeedback?.satisfaction ?? "—"}`,
            `Функционирование процессов: NC ${inputData.processPerformance?.ncStats ?? "—"}, CAPA ${inputData.processPerformance?.capaStats ?? "—"}`,
            `Соответствие продукции: брак ${inputData.productConformity?.defectRate ?? "—"}, выход годных ${inputData.productConformity?.yieldRate ?? "—"}`,
            `Предупреждающие действия: ${inputData.preventiveActions?.count ?? "—"} (результативных: ${inputData.preventiveActions?.effective ?? "—"})`,
            `Выполнение решений предыдущего анализа: выполнено ${inputData.previousActions?.completed ?? "—"}, в работе ${inputData.previousActions?.pending ?? "—"}`,
          ],
          margin: [0, 0, 0, 15],
        },

        // Conclusion
        { text: "ЗАКЛЮЧЕНИЕ", style: "sectionTitle", margin: [0, 0, 0, 5] },
        { text: review.conclusion || "Заключение не указано", margin: [0, 0, 0, 15] },

        // Decisions (§5.6.3)
        { text: "РЕШЕНИЯ (ISO 13485 §5.6.3)", style: "sectionTitle", margin: [0, 0, 0, 5] },
        decisions.length > 0
          ? {
              table: {
                widths: ["auto", "*", 100, 80],
                headerRows: 1,
                body: [
                  [{ text: "№", bold: true }, { text: "Решение", bold: true }, { text: "Ответственный", bold: true }, { text: "Срок", bold: true }],
                  ...decisions.map((d, i) => [i + 1, d.description || "—", d.responsible || "—", fmtDate(d.deadline)]),
                ],
              },
              layout: "lightHorizontalLines",
              margin: [0, 0, 0, 15],
            }
          : { text: "Решения не зафиксированы", italics: true, margin: [0, 0, 0, 15] },

        // Action items
        actions.length > 0
          ? [
              { text: "ДЕЙСТВИЯ", style: "sectionTitle", margin: [0, 0, 0, 5] },
              {
                table: {
                  widths: ["auto", "*", 80, 80, 60],
                  headerRows: 1,
                  body: [
                    [{ text: "№", bold: true }, { text: "Описание", bold: true }, { text: "Приоритет", bold: true }, { text: "Срок", bold: true }, { text: "Статус", bold: true }],
                    ...actions.map((a, i) => [i + 1, a.description || "—", a.priority || "—", fmtDate(a.deadline), a.status || "—"]),
                  ],
                },
                layout: "lightHorizontalLines",
                margin: [0, 0, 0, 15],
              },
            ]
          : [],

        // Signatures
        { text: " ", margin: [0, 20, 0, 0] },
        {
          columns: [
            { text: "Председатель: _______________", width: "50%" },
            { text: "Секретарь: _______________", width: "50%" },
          ],
          margin: [0, 0, 0, 5],
        },
        {
          columns: [
            { text: `Дата: ${fmtDate(review.reviewDate)}`, width: "50%", fontSize: 9 },
            { text: `Дата: ${fmtDate(review.reviewDate)}`, width: "50%", fontSize: 9 },
          ],
        },
      ],
      styles: {
        header: { fontSize: 14, bold: true },
        subheader: { fontSize: 10, italics: true, color: "#666666" },
        sectionTitle: { fontSize: 11, bold: true, color: "#333333" },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", () => {
      const result = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Protocol_${review.reviewNumber || id}_${new Date().toISOString().slice(0, 10)}.pdf"`);
      res.send(result);
    });
    pdfDoc.end();
  } catch (e) {
    console.error("ManagementReview getMinutesPdf error:", e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getAll, getOne, create, update,
  addAction, updateAction, getStats, getDashboard,
  getMinutesPdf,
};
