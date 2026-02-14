const Router = require("express");
const router = new Router();
const ctrl = require("../controllers/riskManagementController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");
const ExportService = require("../../../services/ExportService");
const { logAudit } = require("../../core/utils/auditLogger");

const protect = [authMiddleware, syncUserMiddleware];

// =================================================================
// Static routes FIRST
// =================================================================
router.get("/stats", ...protect, checkAbility("risk.read"), ctrl.getRiskManagementStats);

// =================================================================
// Export — ISO 14971 Risk Management Report (multi-sheet Excel)
// =================================================================
router.get("/export/report", ...protect, checkAbility("risk.read"), async (req, res, next) => {
  try {
    const {
      RiskManagementPlan, Hazard, BenefitRiskAnalysis, RiskControlTraceability,
    } = require("../models/RiskManagement");
    const { User } = require("../../../models/index");

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString("ru-RU") : "—";
    const fmtPerson = (p) => p ? `${p.surname || ""} ${p.name || ""}`.trim() : "—";

    // Fetch all data
    const [plans, hazards, braList, traceList] = await Promise.all([
      RiskManagementPlan.findAll({
        include: [{ model: User, as: "responsiblePerson", attributes: ["id", "name", "surname"] }],
        order: [["createdAt", "DESC"]],
      }),
      Hazard.findAll({
        include: [{ model: RiskManagementPlan, attributes: ["id", "planNumber", "productName"] }],
        order: [["riskLevel", "DESC"]],
      }),
      BenefitRiskAnalysis.findAll({
        include: [
          { model: Hazard, attributes: ["id", "hazardNumber", "hazardDescription"] },
          { model: User, as: "assessor", attributes: ["id", "name", "surname"] },
        ],
        order: [["assessmentDate", "DESC"]],
      }),
      RiskControlTraceability.findAll({
        include: [{ model: Hazard, attributes: ["id", "hazardNumber", "hazardDescription"] }],
        order: [["controlPriority", "ASC"]],
      }),
    ]);

    const buffer = await ExportService.generateMultiSheetExcel({
      title: "ISO 14971 Risk Management File",
      sheets: [
        {
          name: "Планы RMP (§4.4)",
          columns: [
            { header: "Номер", key: "planNumber", width: 18 },
            { header: "Название", key: "title", width: 35 },
            { header: "Изделие", key: "productName", width: 25 },
            { header: "Назначение", key: "intendedUse", width: 35 },
            { header: "Фаза", key: "lifecyclePhase", width: 16 },
            { header: "Статус", key: "status", width: 12 },
            { header: "Ответственный", key: "responsible", width: 22 },
            { header: "Дата утверждения", key: "approvedAt", width: 16 },
            { header: "Пересмотр", key: "nextReviewDate", width: 14 },
          ],
          rows: plans.map((p) => ({
            planNumber: p.planNumber,
            title: p.title,
            productName: p.productName,
            intendedUse: p.intendedUse,
            lifecyclePhase: p.lifecyclePhase,
            status: p.status,
            responsible: fmtPerson(p.responsiblePerson),
            approvedAt: fmtDate(p.approvedAt),
            nextReviewDate: fmtDate(p.nextReviewDate),
          })),
        },
        {
          name: "Опасности (§5)",
          columns: [
            { header: "Номер", key: "hazardNumber", width: 14 },
            { header: "План", key: "plan", width: 18 },
            { header: "Категория", key: "hazardCategory", width: 16 },
            { header: "Описание", key: "hazardDescription", width: 35 },
            { header: "Опасная ситуация", key: "hazardousSituation", width: 30 },
            { header: "Вред", key: "harm", width: 25 },
            { header: "P", key: "probability", width: 6 },
            { header: "S", key: "severity", width: 6 },
            { header: "Уровень", key: "riskLevel", width: 10 },
            { header: "Класс", key: "riskClass", width: 10 },
            { header: "P (ост.)", key: "residualP", width: 8 },
            { header: "S (ост.)", key: "residualS", width: 8 },
            { header: "Класс (ост.)", key: "residualClass", width: 12 },
            { header: "Статус", key: "status", width: 14 },
          ],
          rows: hazards.map((h) => ({
            hazardNumber: h.hazardNumber,
            plan: h.risk_management_plan?.planNumber || "",
            hazardCategory: h.hazardCategory,
            hazardDescription: h.hazardDescription,
            hazardousSituation: h.hazardousSituation,
            harm: h.harm,
            probability: h.probabilityOfOccurrence,
            severity: h.severityOfHarm,
            riskLevel: h.riskLevel,
            riskClass: h.riskClass,
            residualP: h.residualProbability ?? "",
            residualS: h.residualSeverity ?? "",
            residualClass: h.residualRiskClass ?? "",
            status: h.status,
          })),
        },
        {
          name: "Меры управления (§7)",
          columns: [
            { header: "Номер", key: "traceNumber", width: 14 },
            { header: "Опасность", key: "hazard", width: 18 },
            { header: "Описание меры", key: "description", width: 35 },
            { header: "Тип", key: "controlType", width: 18 },
            { header: "Приоритет", key: "priority", width: 10 },
            { header: "Статус реализации", key: "implStatus", width: 18 },
            { header: "Метод верификации", key: "verifMethod", width: 25 },
            { header: "Результат", key: "verifResult", width: 12 },
            { header: "Ост. риск приемлем", key: "acceptable", width: 16 },
            { header: "Новые опасности", key: "newHazards", width: 14 },
          ],
          rows: traceList.map((t) => ({
            traceNumber: t.traceNumber,
            hazard: t.hazard?.hazardNumber || "",
            description: t.controlMeasureDescription,
            controlType: t.controlType,
            priority: t.controlPriority,
            implStatus: t.implementationStatus,
            verifMethod: t.verificationMethod || "",
            verifResult: t.verificationResult,
            acceptable: t.residualRiskAcceptable === true ? "Да" : t.residualRiskAcceptable === false ? "Нет" : "—",
            newHazards: t.newHazardsIntroduced ? "Да" : "Нет",
          })),
        },
        {
          name: "Польза-Риск (§6.5)",
          columns: [
            { header: "Номер", key: "analysisNumber", width: 14 },
            { header: "Опасность", key: "hazard", width: 18 },
            { header: "Ост. риск", key: "residualRisk", width: 30 },
            { header: "Класс ост. риска", key: "residualRiskClass", width: 16 },
            { header: "Клин. польза", key: "benefit", width: 35 },
            { header: "Обоснование", key: "justification", width: 35 },
            { header: "Польза > Риск", key: "outweighs", width: 14 },
            { header: "Заключение", key: "conclusion", width: 35 },
            { header: "Оценщик", key: "assessor", width: 22 },
            { header: "Дата", key: "date", width: 14 },
          ],
          rows: braList.map((b) => ({
            analysisNumber: b.analysisNumber,
            hazard: b.hazard?.hazardNumber || "",
            residualRisk: b.residualRiskDescription,
            residualRiskClass: b.residualRiskClass,
            benefit: b.clinicalBenefitDescription,
            justification: b.benefitJustification,
            outweighs: b.benefitOutweighsRisk ? "Да" : "Нет",
            conclusion: b.conclusion,
            assessor: fmtPerson(b.assessor),
            date: fmtDate(b.assessmentDate),
          })),
        },
      ],
    });

    await logAudit(req, "export.risk_management_report", "risk_management", null, {
      plans: plans.length, hazards: hazards.length, controls: traceList.length, bra: braList.length,
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="ISO14971_Risk_Report_${new Date().toISOString().slice(0, 10)}.xlsx"`);
    res.send(Buffer.from(buffer));
  } catch (e) {
    console.error("Risk Management export error:", e);
    next(e);
  }
});

// =================================================================
// Risk Management Plans — ISO 14971 §4.4
// =================================================================
router.get("/plans",          ...protect, checkAbility("risk.read"),    ctrl.getAllPlans);
router.get("/plans/:id",      ...protect, checkAbility("risk.read"),    ctrl.getOnePlan);
router.post("/plans",         ...protect, checkAbility("risk.create"),  ctrl.createPlan);
router.put("/plans/:id",      ...protect, checkAbility("risk.update"),  ctrl.updatePlan);
router.post("/plans/:id/submit-review", ...protect, checkAbility("risk.update"), ctrl.submitPlanForReview);
router.post("/plans/:id/approve",       ...protect, checkAbility("risk.accept"), ctrl.approvePlan);

// =================================================================
// Hazard Analysis — ISO 14971 §5
// =================================================================
router.get("/hazards",                     ...protect, checkAbility("risk.read"),   ctrl.getAllHazards);
router.get("/hazards/:hazardId",           ...protect, checkAbility("risk.read"),   ctrl.getOneHazard);
router.post("/plans/:id/hazards",          ...protect, checkAbility("risk.create"), ctrl.createHazard);
router.put("/hazards/:hazardId",           ...protect, checkAbility("risk.update"), ctrl.updateHazard);
router.put("/hazards/:hazardId/residual",  ...protect, checkAbility("risk.assess"), ctrl.updateHazardResidualRisk);

// =================================================================
// Benefit-Risk Analysis — ISO 14971 §6.5
// =================================================================
router.get("/benefit-risk",                ...protect, checkAbility("risk.read"),   ctrl.getAllBenefitRisk);
router.post("/plans/:id/benefit-risk",     ...protect, checkAbility("risk.create"), ctrl.createBenefitRisk);
router.put("/benefit-risk/:braId",         ...protect, checkAbility("risk.update"), ctrl.updateBenefitRisk);
router.post("/benefit-risk/:braId/review", ...protect, checkAbility("risk.accept"), ctrl.reviewBenefitRisk);

// =================================================================
// Risk Control Traceability — ISO 14971 §7, §8
// =================================================================
router.get("/traceability",                       ...protect, checkAbility("risk.read"),   ctrl.getAllTraceability);
router.post("/hazards/:hazardId/traceability",     ...protect, checkAbility("risk.create"), ctrl.createTraceability);
router.put("/traceability/:traceId",               ...protect, checkAbility("risk.update"), ctrl.updateTraceability);
router.post("/traceability/:traceId/verify",       ...protect, checkAbility("risk.verify"), ctrl.verifyTraceability);

// =================================================================
// Traceability Matrix — ISO 14971 §8
// =================================================================
router.get("/plans/:riskManagementPlanId/matrix", ...protect, checkAbility("risk.read"), ctrl.getTraceabilityMatrix);

module.exports = router;
