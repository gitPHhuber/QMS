const Router = require("express");
const router = new Router();
const ctrl = require("../controllers/customerRequirementController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Static routes first
router.get("/stats", ...protect, checkAbility("product.read"), ctrl.getStats);

// CRUD
router.get("/", ...protect, checkAbility("product.read"), ctrl.getAll);
router.get("/:id", ...protect, checkAbility("product.read"), ctrl.getOne);
router.post("/", ...protect, checkAbility("product.manage"), ctrl.create);
router.put("/:id", ...protect, checkAbility("product.manage"), ctrl.update);

module.exports = router;
