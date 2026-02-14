const Router = require("express");
const router = new Router();
const mesQualityController = require("../controllers/mesQualityController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Hold / Release
router.post("/hold/:unitId", ...protect, checkAbility("mesqc.manage"), mesQualityController.hold);
router.post("/release/:unitId", ...protect, checkAbility("mesqc.manage"), mesQualityController.release);

// NC from operation
router.post("/nc-from-operation", ...protect, checkAbility("mesqc.manage"), mesQualityController.ncFromOperation);

// Get all holds
router.get("/holds", ...protect, checkAbility("mesqc.read"), mesQualityController.getHolds);

module.exports = router;
