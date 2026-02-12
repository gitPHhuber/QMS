const Router = require("express");
const router = new Router();
const complaintController = require("../controllers/complaintController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Static routes first
router.get("/stats", ...protect, complaintController.getStats);
router.get("/vigilance/overdue", ...protect, complaintController.getOverdueVigilance);

// CRUD
router.get("/", ...protect, complaintController.getAll);
router.get("/:id", ...protect, complaintController.getOne);
router.post("/", ...protect, complaintController.create);
router.put("/:id", ...protect, complaintController.update);

// Vigilance reporting (СТО-8.2.3)
router.post("/:id/vigilance/submit", ...protect, complaintController.submitVigilance);
router.post("/:id/vigilance/acknowledge", ...protect, complaintController.acknowledgeVigilance);

module.exports = router;
