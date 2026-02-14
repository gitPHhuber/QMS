const Router = require("express");
const router = new Router();
const EpicController = require("../controllers/EpicController");
const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");
const checkAbility = require("../middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

router.get("/", ...protect, EpicController.getAll);
router.get("/:id", ...protect, EpicController.getOne);
router.post("/", ...protect, checkAbility("users.manage"), EpicController.create);
router.put("/:id", ...protect, checkAbility("users.manage"), EpicController.update);
router.delete("/:id", ...protect, checkAbility("users.manage"), EpicController.delete);

module.exports = router;
