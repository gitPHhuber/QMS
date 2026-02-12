const Router = require("express");
const router = new Router();
const complaintController = require("../controllers/complaintController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Static routes first
router.get("/stats", ...protect, complaintController.getStats);

// CRUD
router.get("/", ...protect, complaintController.getAll);
router.get("/:id", ...protect, complaintController.getOne);
router.post("/", ...protect, complaintController.create);
router.put("/:id", ...protect, complaintController.update);

module.exports = router;
