const Router = require("express");
const router = new Router();
const ctrl = require("../controllers/equipmentController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Stats (static route FIRST)
router.get("/stats", ...protect, checkAbility("equipment.read"), ctrl.getStats);

// CRUD
router.get("/",      ...protect, checkAbility("equipment.read"),      ctrl.getAll);
router.get("/:id",   ...protect, checkAbility("equipment.read"),      ctrl.getOne);
router.post("/",     ...protect, checkAbility("equipment.calibrate"), ctrl.create);
router.put("/:id",   ...protect, checkAbility("equipment.calibrate"), ctrl.update);

// Calibrations sub-resource
router.post("/:id/calibrations",  ...protect, checkAbility("equipment.calibrate"), ctrl.addCalibration);
router.put("/calibrations/:id",   ...protect, checkAbility("equipment.calibrate"), ctrl.updateCalibration);

module.exports = router;
