const Router = require("express");
const router = new Router();
const ctrl = require("../controllers/trainingController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Stats (static route FIRST)
router.get("/stats", ...protect, checkAbility("training.read"), ctrl.getStats);

// Plans
router.get("/plans",      ...protect, checkAbility("training.read"),   ctrl.getPlans);
router.get("/plans/:id",  ...protect, checkAbility("training.read"),   ctrl.getPlanOne);
router.post("/plans",     ...protect, checkAbility("training.manage"), ctrl.createPlan);
router.put("/plans/:id",  ...protect, checkAbility("training.manage"), ctrl.updatePlan);

// Records
router.get("/records",      ...protect, checkAbility("training.read"),   ctrl.getRecords);
router.post("/records",     ...protect, checkAbility("training.manage"), ctrl.createRecord);
router.put("/records/:id",  ...protect, checkAbility("training.manage"), ctrl.updateRecord);

// Competency Matrix
router.get("/competency",      ...protect, checkAbility("training.read"),   ctrl.getCompetency);
router.post("/competency",     ...protect, checkAbility("training.manage"), ctrl.createCompetency);
router.put("/competency/:id",  ...protect, checkAbility("training.manage"), ctrl.updateCompetency);

// Plan Items (Annual Plan)
router.get("/plan-items",      ...protect, checkAbility("training.read"),   ctrl.getPlanItems);
router.post("/plan-items",     ...protect, checkAbility("training.manage"), ctrl.createPlanItem);
router.put("/plan-items/:id",  ...protect, checkAbility("training.manage"), ctrl.updatePlanItem);
router.delete("/plan-items/:id", ...protect, checkAbility("training.manage"), ctrl.deletePlanItem);

// Gap Analysis
router.get("/gap-analysis",    ...protect, checkAbility("training.read"),   ctrl.getGapAnalysis);

module.exports = router;
