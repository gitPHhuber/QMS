const Router = require("express");
const router = new Router();
const ctrl = require("../controllers/reviewController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Stats (static route FIRST)
router.get("/stats", ...protect, checkAbility("review.view"), ctrl.getStats);

// CRUD
router.get("/",      ...protect, checkAbility("review.view"),   ctrl.getAll);
router.get("/:id",   ...protect, checkAbility("review.view"),   ctrl.getOne);
router.post("/",     ...protect, checkAbility("review.create"), ctrl.create);
router.put("/:id",   ...protect, checkAbility("review.manage"), ctrl.update);

// Actions sub-resource
router.post("/:id/actions",  ...protect, checkAbility("review.manage"), ctrl.addAction);
router.put("/actions/:id",   ...protect, checkAbility("review.manage"), ctrl.updateAction);

module.exports = router;
