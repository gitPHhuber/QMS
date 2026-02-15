/**
 * designRouter.js — Routes for Design Control (ISO 13485 §7.3)
 *
 * Mounting:
 *   router.use("/design", designRouter);   // via module index.js
 */

const Router = require("express");
const router = new Router();
const ctrl = require("../controllers/designController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// ── Statistics ──
router.get("/stats", ...protect, checkAbility("design.view"), ctrl.getStats);

// ── Design Project ──
router.get("/",     ...protect, checkAbility("design.view"),   ctrl.getProjectList);
router.get("/:id",  ...protect, checkAbility("design.view"),   ctrl.getProjectDetail);
router.post("/",    ...protect, checkAbility("design.create"), ctrl.createProject);
router.put("/:id",  ...protect, checkAbility("design.manage"), ctrl.updateProject);

// ── Design Inputs (§7.3.3) ──
router.post("/:id/inputs",          ...protect, checkAbility("design.create"), ctrl.addInput);
router.put("/inputs/:inputId",      ...protect, checkAbility("design.manage"), ctrl.updateInput);

// ── Design Outputs (§7.3.4) ──
router.post("/:id/outputs",         ...protect, checkAbility("design.create"), ctrl.addOutput);
router.put("/outputs/:outputId",    ...protect, checkAbility("design.manage"), ctrl.updateOutput);

// ── Design Reviews (§7.3.5) ──
router.post("/:id/reviews",                ...protect, checkAbility("design.manage"),  ctrl.addReview);
router.put("/reviews/:reviewId/complete",   ...protect, checkAbility("design.approve"), ctrl.completeReview);

// ── Design Verification (§7.3.6) ──
router.post("/:id/verifications",    ...protect, checkAbility("design.manage"), ctrl.addVerification);
router.put("/verifications/:vId",    ...protect, checkAbility("design.manage"), ctrl.updateVerification);

// ── Design Validation (§7.3.7) ──
router.post("/:id/validations",      ...protect, checkAbility("design.manage"), ctrl.addValidation);
router.put("/validations/:vId",      ...protect, checkAbility("design.manage"), ctrl.updateValidation);

// ── Design Transfer (§7.3.8) ──
router.post("/:id/transfers",             ...protect, checkAbility("design.manage"), ctrl.addTransfer);
router.put("/transfers/:tId/complete",     ...protect, checkAbility("design.manage"), ctrl.completeTransfer);

// ── Design Changes (§7.3.9) ──
router.post("/:id/changes",               ...protect, checkAbility("design.create"),  ctrl.createChange);
router.put("/changes/:cId/status",         ...protect, checkAbility("design.approve"), ctrl.updateChangeStatus);

module.exports = router;
