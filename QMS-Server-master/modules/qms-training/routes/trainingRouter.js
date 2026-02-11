const Router = require("express");
const router = new Router();
const ctrl = require("../controllers/trainingController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Stats (static route FIRST)
router.get("/stats", ...protect, checkAbility("training.view"), ctrl.getStats);

// Plans
router.get("/plans",      ...protect, checkAbility("training.view"),   ctrl.getPlans);
router.get("/plans/:id",  ...protect, checkAbility("training.view"),   ctrl.getPlanOne);
router.post("/plans",     ...protect, checkAbility("training.create"), ctrl.createPlan);
router.put("/plans/:id",  ...protect, checkAbility("training.manage"), ctrl.updatePlan);

// Records
router.get("/records",      ...protect, checkAbility("training.view"),   ctrl.getRecords);
router.post("/records",     ...protect, checkAbility("training.create"), ctrl.createRecord);
router.put("/records/:id",  ...protect, checkAbility("training.manage"), ctrl.updateRecord);

// Competency Matrix
router.get("/competency",      ...protect, checkAbility("training.view"),   ctrl.getCompetency);
router.post("/competency",     ...protect, checkAbility("training.create"), ctrl.createCompetency);
router.put("/competency/:id",  ...protect, checkAbility("training.manage"), ctrl.updateCompetency);

module.exports = router;
