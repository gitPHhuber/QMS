const Router = require("express");
const router = new Router();
const validationController = require("../controllers/validationController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

router.get("/stats", ...protect, checkAbility("validation.read"), validationController.getStats);

router.get("/", ...protect, checkAbility("validation.read"), validationController.getAll);
router.get("/:id", ...protect, checkAbility("validation.read"), validationController.getOne);
router.post("/", ...protect, checkAbility("validation.manage"), validationController.create);
router.put("/:id", ...protect, checkAbility("validation.manage"), validationController.update);

module.exports = router;
