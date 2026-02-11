const Router = require("express");
const router = new Router();
const ctrl = require("../controllers/supplierController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Static routes FIRST
router.get("/stats", ...protect, checkAbility("supplier.view"), ctrl.getStats);

// CRUD
router.get("/",      ...protect, checkAbility("supplier.view"),   ctrl.getAll);
router.get("/:id",   ...protect, checkAbility("supplier.view"),   ctrl.getOne);
router.post("/",     ...protect, checkAbility("supplier.create"), ctrl.create);
router.put("/:id",   ...protect, checkAbility("supplier.manage"), ctrl.update);
router.delete("/:id",...protect, checkAbility("supplier.manage"), ctrl.remove);

// Sub-resources
router.get("/:id/evaluations",  ...protect, checkAbility("supplier.view"),   ctrl.getEvaluations);
router.post("/:id/evaluations", ...protect, checkAbility("supplier.manage"), ctrl.addEvaluation);
router.post("/:id/audits",      ...protect, checkAbility("supplier.manage"), ctrl.addAudit);

module.exports = router;
