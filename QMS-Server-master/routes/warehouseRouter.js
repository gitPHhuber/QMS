const Router = require("express");
const router = new Router();

const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");
const checkAbility = require("../middleware/checkAbilityMiddleware");

const SupplyController = require("../controllers/warehouse/SupplyController");
const BoxController = require("../controllers/warehouse/BoxController");
const MovementController = require("../controllers/warehouse/MovementController");
const DocumentController = require("../controllers/warehouse/DocumentController");
const AnalyticsController = require("../controllers/warehouse/AnalyticsController");
const AlertsController = require("../controllers/warehouse/AlertsController");
const RankingsController = require("../controllers/RankingsController");
const HistoryController = require("../controllers/warehouse/HistoryController");

const protect = [authMiddleware, syncUserMiddleware];


router.post("/supplies", ...protect, checkAbility("warehouse.manage"), SupplyController.createSupply);
router.get("/supplies", ...protect, checkAbility("warehouse.view"), SupplyController.getSupplies);
router.get("/supplies/:id/export-csv", ...protect, checkAbility("warehouse.view"), SupplyController.exportCsv);


router.post("/boxes", ...protect, checkAbility("warehouse.manage"), BoxController.createSingleBox);
router.post("/boxes/batch", ...protect, checkAbility("warehouse.manage"), BoxController.createBoxesBatch);


router.put("/boxes/batch", ...protect, checkAbility("warehouse.manage"), BoxController.updateBatch);


router.get("/boxes", ...protect, checkAbility("warehouse.view"), BoxController.getBoxes);
router.get("/boxes/:id", ...protect, checkAbility("warehouse.view"), BoxController.getBoxById);
router.get("/boxes/by-qr/:qr", ...protect, checkAbility("warehouse.view"), BoxController.getBoxByQr);


router.post("/boxes/export", ...protect, checkAbility("warehouse.view"), BoxController.exportCsv);
router.post("/boxes/print-pdf", ...protect, checkAbility("labels.print"), BoxController.printLabelsPdf);


router.post("/boxes/print-special", ...protect, checkAbility("labels.print"), BoxController.printSpecialLabel);


router.get("/print-history", ...protect, checkAbility("labels.print"), HistoryController.getPrintHistory);


router.post("/movements", ...protect, checkAbility("warehouse.manage"), MovementController.moveSingle);
router.post("/movements/batch", ...protect, checkAbility("warehouse.manage"), MovementController.moveBatch);
router.get("/movements", ...protect, checkAbility("warehouse.view"), MovementController.getMovements);


router.get("/balance", ...protect, checkAbility("warehouse.view"), MovementController.getBalance);


router.post("/documents", ...protect, checkAbility("warehouse.manage"), DocumentController.createDocument);
router.get("/documents", ...protect, checkAbility("warehouse.view"), DocumentController.getDocuments);


router.get("/analytics/dashboard", ...protect, checkAbility("analytics.view"), AnalyticsController.getDashboardStats);

router.get("/rankings", ...protect, checkAbility("analytics.view"), RankingsController.getStats);


router.get("/alerts", ...protect, checkAbility("warehouse.view"), AlertsController.getAlerts);
router.get("/limits", ...protect, checkAbility("warehouse.view"), AlertsController.getAllLimits);
router.post("/limits", ...protect, checkAbility("warehouse.manage"), AlertsController.setLimit);

router.get("/rankings/user/:userId", ...protect, RankingsController.getUserDetails);


module.exports = router;
