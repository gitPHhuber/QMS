const Router = require("express");
const router = new Router();

const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const SupplyController = require("../controllers/SupplyController");
const BoxController = require("../controllers/BoxController");
const MovementController = require("../controllers/MovementController");
const DocumentController = require("../controllers/DocumentController");
const AnalyticsController = require("../controllers/AnalyticsController");
const AlertsController = require("../controllers/AlertsController");
const HistoryController = require("../controllers/HistoryController");
const RankingsController = require("../controllers/RankingsController");

// ISO 13485 controllers
const ZoneController = require("../controllers/ZoneController");
const QuarantineController = require("../controllers/QuarantineController");
const InspectionController = require("../controllers/InspectionController");
const DHRController = require("../controllers/DHRController");
const EnvironmentController = require("../controllers/EnvironmentController");
const LocationController = require("../controllers/LocationController");
const ShipmentController = require("../controllers/ShipmentController");
const ReturnController = require("../controllers/ReturnController");
const LabelTemplateController = require("../controllers/LabelTemplateController");

const protect = [authMiddleware, syncUserMiddleware];

// ═══════════════════════════════════════════════════════════════
// EXISTING ROUTES (preserved)
// ═══════════════════════════════════════════════════════════════

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

router.get("/rankings", ...protect, checkAbility("warehouse.view"), RankingsController.getRankings);

router.get("/alerts", ...protect, checkAbility("warehouse.view"), AlertsController.getAlerts);
router.get("/limits", ...protect, checkAbility("warehouse.view"), AlertsController.getAllLimits);
router.post("/limits", ...protect, checkAbility("warehouse.manage"), AlertsController.setLimit);

// ═══════════════════════════════════════════════════════════════
// LABEL TEMPLATES
// ═══════════════════════════════════════════════════════════════

router.get("/label-templates", ...protect, checkAbility("labels.print"), LabelTemplateController.getTemplates);
router.post("/label-templates", ...protect, checkAbility("labels.print"), LabelTemplateController.createTemplate);
router.delete("/label-templates/:id", ...protect, checkAbility("labels.print"), LabelTemplateController.deleteTemplate);

// ═══════════════════════════════════════════════════════════════
// ISO 13485: STORAGE ZONES (Module 1)
// ═══════════════════════════════════════════════════════════════

router.post("/zones", ...protect, checkAbility("warehouse.manage"), ZoneController.createZone);
router.get("/zones", ...protect, checkAbility("warehouse.view"), ZoneController.getZones);
router.put("/zones/:id", ...protect, checkAbility("warehouse.manage"), ZoneController.updateZone);
router.get("/zones/transitions", ...protect, checkAbility("warehouse.view"), ZoneController.getTransitionRules);
router.put("/zones/transitions/:id", ...protect, checkAbility("warehouse.manage"), ZoneController.updateTransitionRule);

// ═══════════════════════════════════════════════════════════════
// ISO 13485: QUARANTINE & BLOCKS (Module 7)
// ═══════════════════════════════════════════════════════════════

router.get("/quarantine", ...protect, checkAbility("warehouse.view"), QuarantineController.getQuarantinedBoxes);
router.post("/quarantine/decide", ...protect, checkAbility("nc.manage"), QuarantineController.makeDecision);

// ═══════════════════════════════════════════════════════════════
// ISO 13485: INCOMING INSPECTION (Module 2)
// ═══════════════════════════════════════════════════════════════

router.post("/inspections", ...protect, checkAbility("warehouse.manage"), InspectionController.createInspection);
router.get("/inspections", ...protect, checkAbility("warehouse.view"), InspectionController.getInspections);
router.put("/inspections/:id", ...protect, checkAbility("warehouse.manage"), InspectionController.updateInspection);
router.post("/inspections/:id/complete", ...protect, checkAbility("warehouse.manage"), InspectionController.completeInspection);
router.get("/inspection-templates", ...protect, checkAbility("warehouse.view"), InspectionController.getTemplates);
router.post("/inspection-templates", ...protect, checkAbility("warehouse.manage"), InspectionController.createTemplate);

// ═══════════════════════════════════════════════════════════════
// ISO 13485: DHR / TRACEABILITY (Module 9)
// ═══════════════════════════════════════════════════════════════

router.get("/dhr/trace-back/:batchNumber", ...protect, checkAbility("warehouse.view"), DHRController.traceBack);
router.get("/dhr/:serialNumber", ...protect, checkAbility("warehouse.view"), DHRController.getDHR);
router.post("/dhr", ...protect, checkAbility("warehouse.manage"), DHRController.createDHR);
router.post("/dhr/:id/components", ...protect, checkAbility("warehouse.manage"), DHRController.addComponents);
router.post("/dhr/:id/records", ...protect, checkAbility("warehouse.manage"), DHRController.addRecord);
router.put("/dhr/:id/status", ...protect, checkAbility("warehouse.manage"), DHRController.updateDHRStatus);

// ═══════════════════════════════════════════════════════════════
// ISO 13485: ENVIRONMENT MONITORING (Module 3)
// ═══════════════════════════════════════════════════════════════

router.post("/environment", ...protect, checkAbility("warehouse.manage"), EnvironmentController.createReading);
router.get("/environment", ...protect, checkAbility("warehouse.view"), EnvironmentController.getReadings);
router.get("/environment/alerts", ...protect, checkAbility("warehouse.view"), EnvironmentController.getAlerts);
router.put("/environment/alerts/:id/acknowledge", ...protect, checkAbility("warehouse.manage"), EnvironmentController.acknowledgeAlert);
router.get("/environment/report", ...protect, checkAbility("warehouse.view"), EnvironmentController.getReport);

// ═══════════════════════════════════════════════════════════════
// ISO 13485: EXPIRY & FEFO (Module 4)
// ═══════════════════════════════════════════════════════════════

router.get("/expiry-alerts", ...protect, checkAbility("warehouse.view"), MovementController.getExpiryAlerts);
router.post("/cron/check-expiry", ...protect, checkAbility("warehouse.manage"), MovementController.checkExpiryCron);

// ═══════════════════════════════════════════════════════════════
// ISO 13485: ADDRESS STORAGE (Module 5)
// ═══════════════════════════════════════════════════════════════

router.post("/locations", ...protect, checkAbility("warehouse.manage"), LocationController.createLocation);
router.get("/locations", ...protect, checkAbility("warehouse.view"), LocationController.getLocations);
router.put("/locations/:id", ...protect, checkAbility("warehouse.manage"), LocationController.updateLocation);
router.get("/locations/by-barcode/:barcode", ...protect, checkAbility("warehouse.view"), LocationController.getByBarcode);
router.get("/locations/occupancy", ...protect, checkAbility("warehouse.view"), LocationController.getOccupancy);

// ═══════════════════════════════════════════════════════════════
// ISO 13485: SHIPMENTS (Module 6)
// ═══════════════════════════════════════════════════════════════

router.post("/shipments", ...protect, checkAbility("warehouse.manage"), ShipmentController.createShipment);
router.get("/shipments", ...protect, checkAbility("warehouse.view"), ShipmentController.getShipments);
router.get("/shipments/:id", ...protect, checkAbility("warehouse.view"), ShipmentController.getShipmentById);
router.post("/shipments/:id/pick", ...protect, checkAbility("warehouse.manage"), ShipmentController.pick);
router.post("/shipments/:id/verify", ...protect, checkAbility("warehouse.manage"), ShipmentController.verify);
router.post("/shipments/:id/ship", ...protect, checkAbility("warehouse.manage"), ShipmentController.ship);

// ═══════════════════════════════════════════════════════════════
// ISO 13485: RETURNS (Module 8)
// ═══════════════════════════════════════════════════════════════

router.post("/returns", ...protect, checkAbility("warehouse.manage"), ReturnController.createReturn);
router.get("/returns", ...protect, checkAbility("warehouse.view"), ReturnController.getReturns);
router.post("/returns/:id/inspect", ...protect, checkAbility("warehouse.manage"), ReturnController.inspect);
router.post("/returns/:id/decide", ...protect, checkAbility("nc.manage"), ReturnController.decide);

module.exports = router;
