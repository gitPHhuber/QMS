const Router = require("express");
const router = new Router();
const SprintController = require("../controllers/SprintController");
const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");
const checkAbility = require("../middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

router.get("/project/:projectId", ...protect, SprintController.getSprintsForProject);
router.get("/:id", ...protect, SprintController.getSprintById);
router.get("/:id/burndown", ...protect, SprintController.getBurndown);
router.post("/", ...protect, checkAbility("users.manage"), SprintController.createSprint);
router.put("/:id", ...protect, checkAbility("users.manage"), SprintController.updateSprint);
router.post("/:id/start", ...protect, checkAbility("users.manage"), SprintController.startSprint);
router.post("/:id/complete", ...protect, checkAbility("users.manage"), SprintController.completeSprint);

module.exports = router;
