const Router = require("express");
const router = new Router();
const ctrl = require("../controllers/environmentController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Static routes first
router.get("/stats", ...protect, checkAbility("equipment.read"), ctrl.getEnvironmentStats);
router.get("/excursions", ...protect, checkAbility("equipment.read"), ctrl.getExcursions);

// Monitoring Points CRUD
router.get("/points", ...protect, checkAbility("equipment.read"), ctrl.getMonitoringPoints);
router.post("/points", ...protect, checkAbility("equipment.manage"), ctrl.createMonitoringPoint);
router.put("/points/:id", ...protect, checkAbility("equipment.manage"), ctrl.updateMonitoringPoint);

// Readings
router.get("/readings", ...protect, checkAbility("equipment.read"), ctrl.getReadings);
router.post("/readings", ...protect, checkAbility("equipment.manage"), ctrl.addReading);
router.post("/readings/batch", ...protect, checkAbility("equipment.manage"), ctrl.addReadingsBatch);

module.exports = router;
