const Router = require("express");
const router = new Router();
const dhrController = require("../controllers/dhrController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Static routes first
router.get("/stats", ...protect, checkAbility("dhr.read"), dhrController.getStats);

// CRUD
router.get("/", ...protect, checkAbility("dhr.read"), dhrController.getAll);
router.get("/:id", ...protect, checkAbility("dhr.read"), dhrController.getOne);
router.post("/", ...protect, checkAbility("dhr.create"), dhrController.create);
router.put("/:id", ...protect, checkAbility("dhr.manage"), dhrController.update);

// Materials sub-resource
router.post("/:id/materials", ...protect, checkAbility("dhr.manage"), dhrController.addMaterial);
router.put("/materials/:matId", ...protect, checkAbility("dhr.manage"), dhrController.updateMaterial);

// Process Steps sub-resource
router.post("/:id/steps", ...protect, checkAbility("dhr.manage"), dhrController.addStep);
router.put("/steps/:stepId", ...protect, checkAbility("dhr.manage"), dhrController.updateStep);

// Traceability
router.get("/:id/trace", ...protect, checkAbility("dhr.read"), dhrController.getTraceForward);

module.exports = router;
