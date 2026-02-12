const Router = require("express");
const router = new Router();
const ctrl = require("../controllers/internalAuditController");
const authMiddleware = require("../../core/middleware/authMiddleware");
const syncUserMiddleware = require("../../core/middleware/syncUserMiddleware");
const checkAbility = require("../../core/middleware/checkAbilityMiddleware");

const protect = [authMiddleware, syncUserMiddleware];

// Stats (static route FIRST)
router.get("/stats", ...protect, checkAbility("internal-audit.read"), ctrl.getStats);

// Plans
router.get("/plans",      ...protect, checkAbility("internal-audit.read"),   ctrl.getPlans);
router.get("/plans/:id",  ...protect, checkAbility("internal-audit.read"),   ctrl.getPlanOne);
router.post("/plans",     ...protect, checkAbility("internal-audit.manage"), ctrl.createPlan);
router.put("/plans/:id",  ...protect, checkAbility("internal-audit.manage"), ctrl.updatePlan);

// Schedules (individual audits)
router.get("/schedules",       ...protect, checkAbility("internal-audit.read"),   ctrl.getSchedules);
router.get("/schedules/:id",   ...protect, checkAbility("internal-audit.read"),   ctrl.getScheduleOne);
router.post("/schedules",      ...protect, checkAbility("internal-audit.manage"), ctrl.createSchedule);
router.put("/schedules/:id",   ...protect, checkAbility("internal-audit.manage"), ctrl.updateSchedule);

// Findings
router.post("/schedules/:scheduleId/findings", ...protect, checkAbility("internal-audit.manage"), ctrl.addFinding);
router.put("/findings/:id",                     ...protect, checkAbility("internal-audit.manage"), ctrl.updateFinding);

// Автосоздание CAPA из finding (ISO 8.5.2 — Audit → CAPA интеграция)
router.post("/findings/:id/create-capa", ...protect, checkAbility("internal-audit.manage"), ctrl.createCapaFromFinding);

// ═══════════════════════════════════════════════════════════════
// Чек-листы по разделам ISO 13485 (шаблоны)
// ═══════════════════════════════════════════════════════════════
router.get("/checklists",            ...protect, checkAbility("internal-audit.read"),   ctrl.getChecklists);
router.post("/checklists/seed",      ...protect, checkAbility("internal-audit.manage"), ctrl.seedChecklists);
router.post("/checklists",           ...protect, checkAbility("internal-audit.manage"), ctrl.createChecklist);
router.get("/checklists/:clause",    ...protect, checkAbility("internal-audit.read"),   ctrl.getChecklistByClause);

// ═══════════════════════════════════════════════════════════════
// Ответы на чек-лист в рамках аудита
// ═══════════════════════════════════════════════════════════════
router.get("/schedules/:id/checklist-responses",  ...protect, checkAbility("internal-audit.read"),   ctrl.getChecklistResponses);
router.post("/schedules/:id/checklist-init",      ...protect, checkAbility("internal-audit.manage"), ctrl.initChecklistForAudit);
router.put("/schedules/:id/checklist-responses",  ...protect, checkAbility("internal-audit.manage"), ctrl.bulkUpdateChecklistResponses);
router.put("/checklist-responses/:id",            ...protect, checkAbility("internal-audit.manage"), ctrl.updateChecklistResponse);

// ═══════════════════════════════════════════════════════════════
// Рассылка отчёта аудита через DMS workflow (СТО-8.2.4)
// ═══════════════════════════════════════════════════════════════
router.post("/schedules/:id/distribute-report", ...protect, checkAbility("internal-audit.manage"), ctrl.distributeAuditReport);

module.exports = router;
