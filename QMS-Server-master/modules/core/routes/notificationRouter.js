const Router = require("express");
const router = new Router();
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

router.get("/count", ...protect, notificationController.getCount);
router.get("/", ...protect, notificationController.getAll);
router.patch("/:id/read", ...protect, notificationController.markRead);
router.post("/mark-all-read", ...protect, notificationController.markAllRead);

module.exports = router;
