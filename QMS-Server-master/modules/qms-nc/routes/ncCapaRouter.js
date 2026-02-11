/**
 * ncCapaRouter.js — Роуты NC и CAPA
 * НОВЫЙ ФАЙЛ: routes/ncCapaRouter.js
 * 
 * Подключение:
 *   router.use("/nc", ncCapaRouter);   // в routes/index.js
 */

const Router = require("express");
const router = new Router();
const ctrl = require("../controllers/ncCapaController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// ── Statistics ──
router.get("/stats", ...protect, checkAbility("nc.view"), ctrl.getStats);

// ── CAPA (before /:id so "/capa" isn't caught by the NC /:id param) ──
router.get("/capa",             ...protect, checkAbility("capa.view"),   ctrl.getCapaList);
router.get("/capa/:id",         ...protect, checkAbility("capa.view"),   ctrl.getCapaOne);
router.post("/capa",            ...protect, checkAbility("capa.create"), ctrl.createCapa);
router.put("/capa/:id/status",  ...protect, checkAbility("capa.manage"), ctrl.updateCapaStatus);
router.post("/capa/:id/actions",...protect, checkAbility("capa.manage"), ctrl.addCapaAction);
router.put("/capa/actions/:id", ...protect, checkAbility("capa.manage"), ctrl.updateCapaAction);
router.post("/capa/:id/verify", ...protect, checkAbility("capa.verify"), ctrl.verifyEffectiveness);

// ── NC ──
router.get("/",          ...protect, checkAbility("nc.view"),   ctrl.getNcList);
router.get("/:id",       ...protect, checkAbility("nc.view"),   ctrl.getNcOne);
router.post("/",         ...protect, checkAbility("nc.create"), ctrl.createNc);
router.put("/:id",       ...protect, checkAbility("nc.manage"), ctrl.updateNc);
router.post("/:id/close",...protect, checkAbility("nc.manage"), ctrl.closeNc);

module.exports = router;
