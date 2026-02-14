const Router = require("express");
const router = new Router();
const ctrl = require("../controllers/workOrderController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Static routes first
router.get("/stats", ...protect, checkAbility("workorder.read"), ctrl.getStats);

// CRUD
router.get("/", ...protect, checkAbility("workorder.read"), ctrl.getAll);
router.get("/:id", ...protect, checkAbility("workorder.read"), ctrl.getOne);
router.post("/", ...protect, checkAbility("workorder.create"), ctrl.create);
router.put("/:id", ...protect, checkAbility("workorder.manage"), ctrl.update);

// Readiness check
router.post("/:id/readiness-check", ...protect, checkAbility("workorder.manage"), ctrl.readinessCheck);

// Launch work order into production
router.post("/:id/launch", ...protect, checkAbility("workorder.launch"), ctrl.launch);

// Material issuance
router.post("/:id/issue-materials", ...protect, checkAbility("workorder.manage"), ctrl.issueMaterials);

// Progress & units
router.get("/:id/progress", ...protect, checkAbility("workorder.read"), ctrl.getProgress);
router.get("/:id/units", ...protect, checkAbility("workorder.read"), ctrl.getUnits);
router.put("/units/:unitId", ...protect, checkAbility("workorder.manage"), ctrl.updateUnit);

// Completion
router.post("/:id/complete", ...protect, checkAbility("workorder.manage"), ctrl.complete);

module.exports = router;
