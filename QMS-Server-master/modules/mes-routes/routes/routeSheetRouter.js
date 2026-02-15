const Router = require("express");
const router = new Router();
const routeSheetController = require("../controllers/routeSheetController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Static / collection routes first
router.get("/by-serial/:serialNumber", ...protect, checkAbility("routesheet.read"), routeSheetController.getBySerial);
router.get("/by-unit/:unitId", ...protect, checkAbility("routesheet.read"), routeSheetController.getByUnit);
router.get("/active", ...protect, checkAbility("routesheet.read"), routeSheetController.getActive);
router.get("/workstation/:sectionId", ...protect, checkAbility("routesheet.read"), routeSheetController.getWorkstation);

// Single operation
router.get("/operations/:id", ...protect, checkAbility("routesheet.read"), routeSheetController.getOperation);

// Operation actions
router.post("/operations/:id/start", ...protect, checkAbility("routesheet.execute"), routeSheetController.startOperation);
router.post("/operations/:id/respond", ...protect, checkAbility("routesheet.execute"), routeSheetController.respond);
router.post("/operations/:id/complete", ...protect, checkAbility("routesheet.execute"), routeSheetController.completeOperation);
router.post("/operations/:id/fail", ...protect, checkAbility("routesheet.execute"), routeSheetController.failOperation);
router.post("/operations/:id/hold", ...protect, checkAbility("routesheet.manage"), routeSheetController.holdOperation);
router.post("/operations/:id/inspect", ...protect, checkAbility("mesqc.inspect"), routeSheetController.inspect);

module.exports = router;
