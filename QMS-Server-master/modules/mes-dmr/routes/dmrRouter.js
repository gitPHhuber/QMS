const Router = require("express");
const router = new Router();
const dmrController = require("../controllers/dmrController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// DMR CRUD
router.get("/", ...protect, checkAbility("dmr.read"), dmrController.getAll);
router.get("/:id", ...protect, checkAbility("dmr.read"), dmrController.getOne);
router.post("/", ...protect, checkAbility("dmr.create"), dmrController.create);
router.put("/:id", ...protect, checkAbility("dmr.manage"), dmrController.update);

// Status transitions
router.post("/:id/submit-review", ...protect, checkAbility("dmr.manage"), dmrController.submitReview);
router.post("/:id/approve", ...protect, checkAbility("dmr.approve"), dmrController.approve);
router.post("/:id/obsolete", ...protect, checkAbility("dmr.manage"), dmrController.obsolete);

// Clone & versions
router.post("/:id/clone", ...protect, checkAbility("dmr.create"), dmrController.clone);
router.get("/:id/versions", ...protect, checkAbility("dmr.read"), dmrController.getVersions);

// BOM sub-resource
router.post("/:id/bom", ...protect, checkAbility("dmr.manage"), dmrController.addBomItem);
router.put("/bom/:bomId", ...protect, checkAbility("dmr.manage"), dmrController.updateBomItem);
router.delete("/bom/:bomId", ...protect, checkAbility("dmr.manage"), dmrController.deleteBomItem);

// Routes sub-resource
router.post("/:id/routes", ...protect, checkAbility("dmr.manage"), dmrController.addRoute);
router.put("/routes/:routeId", ...protect, checkAbility("dmr.manage"), dmrController.updateRoute);

// Steps sub-resource
router.post("/routes/:routeId/steps", ...protect, checkAbility("dmr.manage"), dmrController.addStep);
router.put("/steps/:stepId", ...protect, checkAbility("dmr.manage"), dmrController.updateStep);
router.delete("/steps/:stepId", ...protect, checkAbility("dmr.manage"), dmrController.deleteStep);
router.post("/steps/:stepId/reorder", ...protect, checkAbility("dmr.manage"), dmrController.reorderSteps);

// Checklist sub-resource
router.post("/steps/:stepId/checklist", ...protect, checkAbility("dmr.manage"), dmrController.addChecklist);
router.put("/checklist/:checkId", ...protect, checkAbility("dmr.manage"), dmrController.updateChecklist);
router.delete("/checklist/:checkId", ...protect, checkAbility("dmr.manage"), dmrController.deleteChecklist);

module.exports = router;
