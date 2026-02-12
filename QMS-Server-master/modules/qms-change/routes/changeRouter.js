const Router = require("express");
const router = new Router();
const changeController = require("../controllers/changeController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Static routes first
router.get("/stats", ...protect, changeController.getStats);

// CRUD
router.get("/", ...protect, changeController.getAll);
router.get("/:id", ...protect, changeController.getOne);
router.post("/", ...protect, changeController.create);
router.put("/:id", ...protect, changeController.update);

module.exports = router;
