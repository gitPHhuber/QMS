const Router = require("express");
const router = new Router();
const featureFlagController = require("../controllers/featureFlagController");
const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");
const checkAbility = require("../middleware/checkAbilityMiddleware");

const protect = [
  authMiddleware,
  syncUserMiddleware,
  checkAbility("rbac.manage"),
];

router.get("/",         ...protect, featureFlagController.getAll);
router.get("/:id",      ...protect, featureFlagController.getOne);
router.post("/",         ...protect, featureFlagController.create);
router.put("/:id",      ...protect, featureFlagController.update);
router.patch("/:id/toggle", ...protect, featureFlagController.toggle);
router.delete("/:id",   ...protect, featureFlagController.remove);

module.exports = router;
