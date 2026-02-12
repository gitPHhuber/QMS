const Router = require("express");
const router = new Router();
const complaintController = require("../controllers/complaintController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Static routes first

router.get("/vigilance/overdue", ...protect, complaintController.getOverdueVigilance);

router.get("/stats", ...protect, checkAbility("complaint.read"), complaintController.getStats);


// CRUD
router.get("/", ...protect, checkAbility("complaint.read"), complaintController.getAll);
router.get("/:id", ...protect, checkAbility("complaint.read"), complaintController.getOne);
router.post("/", ...protect, checkAbility("complaint.create"), complaintController.create);
router.put("/:id", ...protect, checkAbility("complaint.manage"), complaintController.update);

// Vigilance reporting (СТО-8.2.3)
router.post("/:id/vigilance/submit", ...protect, complaintController.submitVigilance);
router.post("/:id/vigilance/acknowledge", ...protect, complaintController.acknowledgeVigilance);

module.exports = router;
