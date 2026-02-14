const Router = require("express");
const router = new Router({ mergeParams: true });
const ActivityController = require("../controllers/ActivityController");
const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

router.get("/", ...protect, ActivityController.getActivity);

module.exports = router;
