const Router = require("express");
const router = new Router();
const ctrl = require("../controllers/internalAuditController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Stats (static route FIRST)
router.get("/stats", ...protect, checkAbility("audit.view"), ctrl.getStats);

// Plans
router.get("/plans",      ...protect, checkAbility("audit.view"),   ctrl.getPlans);
router.get("/plans/:id",  ...protect, checkAbility("audit.view"),   ctrl.getPlanOne);
router.post("/plans",     ...protect, checkAbility("audit.create"), ctrl.createPlan);
router.put("/plans/:id",  ...protect, checkAbility("audit.manage"), ctrl.updatePlan);

// Schedules (individual audits)
router.get("/schedules",       ...protect, checkAbility("audit.view"),   ctrl.getSchedules);
router.get("/schedules/:id",   ...protect, checkAbility("audit.view"),   ctrl.getScheduleOne);
router.post("/schedules",      ...protect, checkAbility("audit.create"), ctrl.createSchedule);
router.put("/schedules/:id",   ...protect, checkAbility("audit.manage"), ctrl.updateSchedule);

// Findings
router.post("/schedules/:scheduleId/findings", ...protect, checkAbility("audit.manage"), ctrl.addFinding);
router.put("/findings/:id",                     ...protect, checkAbility("audit.manage"), ctrl.updateFinding);

module.exports = router;
