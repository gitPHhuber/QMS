const Router = require("express");
const router = new Router();
const changeController = require("../controllers/changeController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Static routes first
router.get("/stats", ...protect, checkAbility("change.read"), changeController.getStats);
router.get("/analytics", ...protect, checkAbility("change.read"), changeController.getAnalytics);

// Impact item routes (static paths before parameterized)
router.put("/impacts/:itemId", ...protect, checkAbility("change.approve"), changeController.updateImpactItem);
router.delete("/impacts/:itemId", ...protect, checkAbility("change.approve"), changeController.deleteImpactItem);

// CRUD
router.get("/", ...protect, checkAbility("change.read"), changeController.getAll);
router.post("/", ...protect, checkAbility("change.create"), changeController.create);

// Parameterized routes
router.get("/:id/impacts", ...protect, checkAbility("change.read"), changeController.getImpactItems);
router.post("/:id/impacts", ...protect, checkAbility("change.approve"), changeController.addImpactItem);
router.get("/:id", ...protect, checkAbility("change.read"), changeController.getOne);
router.put("/:id", ...protect, checkAbility("change.approve"), changeController.update);

module.exports = router;
