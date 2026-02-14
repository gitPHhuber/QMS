const Router = require("express");
const router = new Router();
const acceptanceTestController = require("../controllers/acceptanceTestController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Templates (static routes before /:id)
router.get("/templates", ...protect, checkAbility("psi.read"), acceptanceTestController.getTemplates);
router.post("/templates", ...protect, checkAbility("psi.manage"), acceptanceTestController.createTemplate);
router.put("/templates/:id", ...protect, checkAbility("psi.manage"), acceptanceTestController.updateTemplate);

// Journal (static route before /:id)
router.get("/journal", ...protect, checkAbility("psi.read"), acceptanceTestController.getJournal);

// CRUD
router.get("/", ...protect, checkAbility("psi.read"), acceptanceTestController.getAll);
router.get("/:id", ...protect, checkAbility("psi.read"), acceptanceTestController.getOne);
router.post("/", ...protect, checkAbility("psi.create"), acceptanceTestController.create);
router.put("/:id", ...protect, checkAbility("psi.manage"), acceptanceTestController.update);

// Workflow transitions
router.post("/:id/submit", ...protect, checkAbility("psi.create"), acceptanceTestController.submit);
router.post("/:id/start-testing", ...protect, checkAbility("psi.manage"), acceptanceTestController.startTesting);

// Item update
router.put("/items/:itemId", ...protect, checkAbility("psi.manage"), acceptanceTestController.updateItem);

// Decision
router.post("/:id/decide", ...protect, checkAbility("psi.decide"), acceptanceTestController.decide);

// PDF generation
router.get("/:id/certificate-pdf", ...protect, checkAbility("psi.read"), acceptanceTestController.getCertificatePdf);
router.get("/:id/protocol-pdf", ...protect, checkAbility("psi.read"), acceptanceTestController.getProtocolPdf);

module.exports = router;
