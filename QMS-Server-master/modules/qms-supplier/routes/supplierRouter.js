const Router = require("express");
const router = new Router();
const ctrl = require("../controllers/supplierController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Static routes FIRST
router.get("/stats", ...protect, checkAbility("supplier.read"), ctrl.getStats);

// CRUD
router.get("/",      ...protect, checkAbility("supplier.read"),   ctrl.getAll);
router.get("/:id",   ...protect, checkAbility("supplier.read"),   ctrl.getOne);
router.post("/",     ...protect, checkAbility("supplier.manage"), ctrl.create);
router.put("/:id",   ...protect, checkAbility("supplier.manage"), ctrl.update);
router.delete("/:id",...protect, checkAbility("supplier.manage"), ctrl.remove);

// Sub-resources
router.get("/:id/evaluations",  ...protect, checkAbility("supplier.read"),   ctrl.getEvaluations);
router.post("/:id/evaluations", ...protect, checkAbility("supplier.manage"), ctrl.addEvaluation);
router.post("/:id/audits",      ...protect, checkAbility("supplier.manage"), ctrl.addAudit);

module.exports = router;
