const Router = require("express");
const router = new Router();
const changeController = require("../controllers/changeController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Static routes first
router.get("/stats", ...protect, checkAbility("change.read"), changeController.getStats);

// CRUD
router.get("/", ...protect, checkAbility("change.read"), changeController.getAll);
router.get("/:id", ...protect, checkAbility("change.read"), changeController.getOne);
router.post("/", ...protect, checkAbility("change.create"), changeController.create);
router.put("/:id", ...protect, checkAbility("change.approve"), changeController.update);

module.exports = router;
