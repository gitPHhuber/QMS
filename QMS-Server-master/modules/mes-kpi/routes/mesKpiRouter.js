const Router = require("express");
const router = new Router();
const mesKpiController = require("../controllers/mesKpiController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Dashboard
router.get("/dashboard", ...protect, checkAbility("meskpi.read"), mesKpiController.getDashboard);

// KPI endpoints
router.get("/oee", ...protect, checkAbility("meskpi.read"), mesKpiController.getOee);
router.get("/fpy", ...protect, checkAbility("meskpi.read"), mesKpiController.getFpy);
router.get("/cycle-time", ...protect, checkAbility("meskpi.read"), mesKpiController.getCycleTime);
router.get("/yield", ...protect, checkAbility("meskpi.read"), mesKpiController.getYield);

// Targets CRUD
router.get("/targets", ...protect, checkAbility("meskpi.read"), mesKpiController.getTargets);
router.post("/targets", ...protect, checkAbility("meskpi.manage"), mesKpiController.createTarget);
router.put("/targets/:id", ...protect, checkAbility("meskpi.manage"), mesKpiController.updateTarget);

module.exports = router;
