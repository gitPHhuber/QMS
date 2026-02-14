const Router = require("express");
const router = new Router({ mergeParams: true });
const SubtaskController = require("../controllers/SubtaskController");
const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");
const checkAbility = require("../middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

router.get("/",       ...protect, SubtaskController.getSubtasks);
router.post("/",      ...protect, checkAbility("users.manage"), SubtaskController.createSubtask);
router.patch("/:id",  ...protect, checkAbility("users.manage"), SubtaskController.updateSubtask);
router.delete("/:id", ...protect, checkAbility("users.manage"), SubtaskController.deleteSubtask);
router.patch("/reorder", ...protect, checkAbility("users.manage"), SubtaskController.reorderSubtasks);

module.exports = router;
