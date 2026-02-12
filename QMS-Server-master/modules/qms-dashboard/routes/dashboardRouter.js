/**
 * dashboardRouter.js — Роуты дашборда QMS
 *
 * Подключение: router.use("/dashboard", dashboardRouter);
 */

const Router = require("express");
const router = new Router();
const ctrl = require("../controllers/dashboardController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// ── Агрегированные данные дашборда ──
router.get("/summary", ...protect, checkAbility("dashboard.view"), ctrl.getSummary);
router.get("/trends",  ...protect, checkAbility("dashboard.view"), ctrl.getTrends);

// ── Цели качества (ISO 6.2) CRUD ──
router.get("/quality-objectives",       ...protect, checkAbility("dashboard.view"),   ctrl.getObjectives);
router.get("/quality-objectives/:id",   ...protect, checkAbility("dashboard.view"),   ctrl.getObjectiveOne);
router.post("/quality-objectives",      ...protect, checkAbility("dashboard.manage"), ctrl.createObjective);
router.put("/quality-objectives/:id",   ...protect, checkAbility("dashboard.manage"), ctrl.updateObjective);
router.delete("/quality-objectives/:id",...protect, checkAbility("dashboard.manage"), ctrl.deleteObjective);

module.exports = router;
