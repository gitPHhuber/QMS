/**
 * esignRouter.js — Routes for Electronic Signatures (21 CFR Part 11 / ISO 13485)
 *
 * Mounting:
 *   router.use("/esign", esignRouter);   // via module index.js
 */

const Router = require("express");
const router = new Router();
const ctrl = require("../controllers/esignController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// ── Sign ──
router.post("/sign", ...protect, checkAbility("esign.sign"), ctrl.sign);

// ── Requests ──
router.get("/requests",                    ...protect, checkAbility("esign.view"),    ctrl.getRequestList);
router.get("/requests/:id",                ...protect, checkAbility("esign.view"),    ctrl.getRequestDetail);
router.post("/requests",                   ...protect, checkAbility("esign.request"), ctrl.createRequest);
router.post("/requests/signers/:id/decline", ...protect, checkAbility("esign.sign"),  ctrl.declineRequest);

// ── Entity signatures ──
router.get("/entity/:entity/:entityId",    ...protect, checkAbility("esign.view"),    ctrl.getSignaturesForEntity);

// ── Verify ──
router.get("/verify/:id",                  ...protect, checkAbility("esign.view"),    ctrl.verifySignature);

// ── Invalidate ──
router.post("/invalidate/:id",             ...protect, checkAbility("esign.manage"),  ctrl.invalidateSignature);

// ── Policies ──
router.get("/policies",                    ...protect, checkAbility("esign.manage"),  ctrl.getPolicies);
router.post("/policies",                   ...protect, checkAbility("esign.manage"),  ctrl.createPolicy);
router.put("/policies/:id",                ...protect, checkAbility("esign.manage"),  ctrl.updatePolicy);

module.exports = router;
