const Router = require("express");
const router = new Router();
const ctrl = require("../controllers/riskManagementController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// =================================================================
// Static routes FIRST
// =================================================================
router.get("/stats", ...protect, checkAbility("risk.read"), ctrl.getRiskManagementStats);

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
