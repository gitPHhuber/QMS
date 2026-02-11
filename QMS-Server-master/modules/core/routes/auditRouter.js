/**
 * auditRouter.js — Расширенные роуты аудит-трейла
 * 
 * ЗАМЕНА: routes/auditRouter.js
 * 
 * Endpoints:
 *   GET /api/audit/               — Логи с фильтрами (совместимо)
 *   GET /api/audit/stats          — Статистика для дашборда
 *   GET /api/audit/verify         — Быстрая проверка chain (100 записей)
 *   GET /api/audit/verify/full    — Полная проверка chain
 *   GET /api/audit/report         — Отчёт для инспекции ISO 13485
 *   GET /api/audit/:id            — Детали записи + chain-контекст
 * 
 * Права доступа:
 *   - Просмотр логов:  rbac.manage ИЛИ qms.audit.view
 *   - Верификация:     qms.audit.verify
 *   - Отчёт инспекции: qms.audit.report
 */

const Router = require("express");
const router = new Router();
const auditController = require("../controllers/auditController");
const authMiddleware = require("../middleware/authMiddleware");
const syncUserMiddleware = require("../middleware/syncUserMiddleware");
const checkAbility = require("../middleware/checkAbilityMiddleware");

// Базовая защита (совместимо со старым роутером)
const protect = [authMiddleware, syncUserMiddleware, checkAbility("rbac.manage")];

// Расширенная защита для QMS-операций
const protectQmsAudit = [authMiddleware, syncUserMiddleware, checkAbility("qms.audit.verify")];
const protectQmsReport = [authMiddleware, syncUserMiddleware, checkAbility("qms.audit.report")];

// ── Существующий endpoint (обратная совместимость) ──
router.get("/", ...protect, auditController.getLogs);

// ── Новые QMS endpoints ──
router.get("/stats", ...protect, auditController.getStats);
router.get("/verify", ...protectQmsAudit, auditController.quickVerify);
router.get("/verify/full", ...protectQmsAudit, auditController.fullVerify);
router.get("/report", ...protectQmsReport, auditController.inspectionReport);
router.get("/:id", ...protect, auditController.getOne);

module.exports = router;
